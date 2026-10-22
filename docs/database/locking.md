---
tags:
  - Middle
  - Базы данных
  - Транзакции
---

# Блокировки и конкурентные обновления

Что ломается, когда две транзакции одновременно читают и меняют одни и те же данные, — потерянное обновление (lost update) и искажение записи (write skew), — и как от этого защищаются: оптимистичная блокировка через версию строки и пессимистичная через `SELECT … FOR UPDATE`, в SQL и в JPA. На собесе спрашивают, почему счётчик теряет обновления на `READ COMMITTED`, почему `REPEATABLE READ` не спасает от write skew и какую блокировку выбрать для счётчика, бронирования или списания со счёта.

## Аномалии записи { #write-anomalies }

Три аномалии из стандарта SQL — dirty read, non-repeatable read и phantom read — про чтение ([Транзакции и MVCC](transactions.md#read-anomalies)). Две следующие — про запись: транзакции читают данные, принимают решение и пишут, а результат не совпадает ни с одним последовательным порядком.

### Что такое lost update и как его избежать? { #lost-update }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Потерянное обновление (lost update) — две транзакции читают одно значение, каждая считает новое в коде и записывает, и вторая запись затирает первую. На `READ COMMITTED` это проходит молча и в PostgreSQL, и в MySQL. Защита — атомарный `UPDATE … SET x = x + 1`, `SELECT … FOR UPDATE` или проверка версии через `@Version`; на `REPEATABLE READ` PostgreSQL отклонит вторую запись ошибкой сериализации, а MySQL всё равно потеряет обновление.

=== "Подробно"

    Классика — счётчик или баланс, который меняют по схеме «прочитать → посчитать в коде → записать» (read-modify-write). На балансе 100 транзакция A зачисляет 50, а B — 20:

    | Шаг | Транзакция A | Транзакция B |
    |---|---|---|
    | 1 | `SELECT balance` → 100 | |
    | 2 | | `SELECT balance` → 100 |
    | 3 | `UPDATE … SET balance = 150`, `COMMIT` | |
    | 4 | | `UPDATE … SET balance = 120`, `COMMIT` |

    Итог — 120 вместо 170: зачисление A потеряно. Ни одна из трёх аномалий чтения здесь не случилась, поэтому `READ COMMITTED` её не ловит. В JPA это обычный код с dirty checking: `account.setBalance(account.getBalance() + 20)` внутри `@Transactional` превращается ровно в такие `SELECT` и `UPDATE`.

    **Как защититься:**

    1. **Атомарный `UPDATE`** — посчитать в самой БД: `UPDATE accounts SET balance = balance + 20 WHERE id = 1`. Второй `UPDATE` ждёт блокировку строки, а потом применяется к уже обновлённой версии. В Spring Data — метод с `@Modifying` и `@Query`. Подходит, когда новое значение выражается формулой от старого.
    2. **Пессимистичная блокировка** — читать через `SELECT … FOR UPDATE` (`@Lock(PESSIMISTIC_WRITE)`): вторая транзакция ждёт на чтении, пока первая не закончит, и прочитает уже 150. Подробно — в [пессимистичной блокировке](#pessimistic-locking).
    3. **Оптимистичная блокировка** — поле `@Version`: `UPDATE … WHERE id = 1 AND version = 7` у второй транзакции не найдёт строку, и она получит исключение вместо тихой перезаписи. Подробно — в [оптимистичной блокировке](#optimistic-locking).
    4. **`REPEATABLE READ` в PostgreSQL** — второй `UPDATE` строки, которую изменила транзакция, закоммиченная после начала текущей, падает с SQLSTATE `40001` `could not serialize access due to concurrent update`. Транзакцию нужно повторить целиком.

    Поведение на одном и том же сценарии в PostgreSQL 16 и MySQL 8.0 (InnoDB) — вывод программы ниже:

    | | **PostgreSQL** | **MySQL (InnoDB)** |
    |---|---|---|
    | `READ COMMITTED`, read-modify-write | Итог 120 — потеря | Итог 120 — потеря |
    | `READ COMMITTED`, атомарный `UPDATE` | Итог 170 | Итог 170 |
    | `REPEATABLE READ`, read-modify-write | Ошибка `40001` у B, итог 150 — B нужно повторить | Итог 120 — **тихая потеря** |
    | `REPEATABLE READ`, атомарный `UPDATE` | Ошибка `40001` у B | Итог 170 |

    Разница в том, что видит `UPDATE` на `REPEATABLE READ`. В PostgreSQL он работает со снимком транзакции и не имеет права изменить строку, которую после начала транзакции закоммитил кто-то другой. В InnoDB снимок действует только на обычные `SELECT`, а `UPDATE` читает последнюю закоммиченную версию строки, поэтому B просто записывает своё 120 поверх 150.

    ??? example "Код: `LostUpdate.java`"

        ```java
        import java.sql.Connection;
        import java.sql.DriverManager;
        import java.sql.ResultSet;
        import java.sql.SQLException;
        import java.sql.Statement;

        // java -cp .:<jdbc-драйвер> LostUpdate <jdbc-url> <user> <password> <RC|RR> <read-modify-write|atomic>
        public class LostUpdate {

            public static void main(String[] args) throws Exception {
                String url = args[0], user = args[1], password = args[2];
                int isolation = args[3].equals("RR")
                        ? Connection.TRANSACTION_REPEATABLE_READ
                        : Connection.TRANSACTION_READ_COMMITTED;
                boolean atomic = args[4].equals("atomic");

                try (Connection setup = DriverManager.getConnection(url, user, password);
                     Statement st = setup.createStatement()) {
                    st.execute("DROP TABLE IF EXISTS accounts");
                    st.execute("CREATE TABLE accounts (id INT PRIMARY KEY, balance INT NOT NULL)");
                    st.execute("INSERT INTO accounts VALUES (1, 100)");
                }

                try (Connection a = open(url, user, password, isolation);
                     Connection b = open(url, user, password, isolation)) {
                    // Обе транзакции читают баланс до того, как кто-то из них запишет
                    int readA = balance(a);
                    int readB = balance(b);
                    System.out.println("A и B прочитали: " + readA + " и " + readB);

                    if (atomic) {
                        update(a, "UPDATE accounts SET balance = balance + 50 WHERE id = 1");
                    } else {
                        update(a, "UPDATE accounts SET balance = " + (readA + 50) + " WHERE id = 1"); // ❌ значение посчитано в коде
                    }
                    a.commit();
                    System.out.println("A: +50, COMMIT");

                    try {
                        if (atomic) {
                            update(b, "UPDATE accounts SET balance = balance + 20 WHERE id = 1");
                        } else {
                            update(b, "UPDATE accounts SET balance = " + (readB + 20) + " WHERE id = 1");
                        }
                        b.commit();
                        System.out.println("B: +20, COMMIT");
                    } catch (SQLException e) {
                        b.rollback();
                        System.out.println("B: SQLState " + e.getSQLState() + ": " + e.getMessage());
                    }
                }

                try (Connection check = DriverManager.getConnection(url, user, password)) {
                    System.out.println("Итог: " + balance(check) + ", ожидали 170");
                }
            }

            static Connection open(String url, String user, String password, int isolation) throws SQLException {
                Connection c = DriverManager.getConnection(url, user, password);
                c.setAutoCommit(false);
                c.setTransactionIsolation(isolation);
                return c;
            }

            static int balance(Connection c) throws SQLException {
                try (Statement st = c.createStatement();
                     ResultSet rs = st.executeQuery("SELECT balance FROM accounts WHERE id = 1")) {
                    rs.next();
                    return rs.getInt(1);
                }
            }

            static void update(Connection c, String sql) throws SQLException {
                try (Statement st = c.createStatement()) {
                    st.executeUpdate(sql);
                }
            }
        }
        ```

    Вывод на JDK 25 с PostgreSQL 16, `READ COMMITTED`, read-modify-write:

    ```text
    A и B прочитали: 100 и 100
    A: +50, COMMIT
    B: +20, COMMIT
    Итог: 120, ожидали 170
    ```

    Тот же сценарий на `REPEATABLE READ`:

    ```text
    A и B прочитали: 100 и 100
    A: +50, COMMIT
    B: SQLState 40001: ERROR: could not serialize access due to concurrent update
    Итог: 150, ожидали 170
    ```

    MySQL 8.0 на `REPEATABLE READ` печатает то же, что PostgreSQL на `READ COMMITTED`: `B: +20, COMMIT` и `Итог: 120`.

!!! warning "Ловушка: «`REPEATABLE READ` защищает от потерянных обновлений»"
    Только в PostgreSQL, и то ценой ошибки `40001`, которую приложение обязано поймать и повторить транзакцию. В MySQL на уровне по умолчанию обновление теряется без единой ошибки. Надёжнее не полагаться на уровень изоляции, а писать атомарный `UPDATE` или ставить блокировку явно.

!!! warning "Ловушка: dirty checking — тоже read-modify-write"
    `entity.setCounter(entity.getCounter() + 1)` в `@Transactional` без `@Version` теряет обновления так же, как SQL выше: Hibernate прочитал значение в начале и запишет посчитанное в коде при коммите. Для счётчиков — атомарный `@Modifying @Query("update … set counter = counter + 1 …")`, для сущностей, которые правят люди, — `@Version`.

??? question "Проверь себя"
    1. Почему lost update возможен на `READ COMMITTED`, хотя ни одной аномалии чтения не произошло?
    2. Назови три способа защититься от потерянного обновления.
    3. Чем отличается поведение `REPEATABLE READ` в PostgreSQL и MySQL на этом сценарии?

### Что такое write skew и почему от него не спасает `REPEATABLE READ`? { #write-skew }

**Уровень:** Senior

=== "Коротко"

    !!! abstract "Ответ вслух"
        Искажение записи (write skew) — две транзакции читают одни и те же данные, проверяют по ним правило и меняют **разные** строки, а вместе нарушают правило. Классика: два дежурных врача одновременно видят «на дежурстве двое» и оба уходят. Конфликта записи нет, поэтому снимок `REPEATABLE READ` его пропускает; ловит только `SERIALIZABLE` или явная блокировка прочитанных строк через `SELECT … FOR UPDATE`.

=== "Подробно"

    Правило: на дежурстве всегда хотя бы один врач. Сейчас дежурят alice и bob, и оба одновременно просят снять их с дежурства:

    | Шаг | Транзакция alice | Транзакция bob |
    |---|---|---|
    | 1 | `SELECT … WHERE on_call` → 2 врача | |
    | 2 | | `SELECT … WHERE on_call` → 2 врача |
    | 3 | `UPDATE … SET on_call = FALSE WHERE name = 'alice'`, `COMMIT` | |
    | 4 | | `UPDATE … SET on_call = FALSE WHERE name = 'bob'`, `COMMIT` |

    Каждая транзакция по отдельности корректна, и выполненные по очереди они дали бы одного дежурного. Но каждая меняет свою строку, поэтому для MVCC это не конфликт: ни PostgreSQL, ни InnoDB на `REPEATABLE READ` не ждут и не откатывают, и на дежурстве не остаётся никого. Lost update — частный случай той же схемы, когда обе транзакции пишут одну строку; его `REPEATABLE READ` в PostgreSQL ловит, а write skew — нет.

    Поэтому в таблице уровней изоляции `REPEATABLE READ` PostgreSQL защищает от фантомов, но не от всех аномалий: стандарт SQL называет это serialization anomaly, и закрывает её только `SERIALIZABLE`.

    **Как защититься:**

    1. **`SERIALIZABLE`.** PostgreSQL (SSI) отслеживает зависимости «прочитал → другой записал» и откатывает одну из транзакций с `40001` `could not serialize access due to read/write dependencies among transactions`. InnoDB на `SERIALIZABLE` превращает обычные `SELECT` в блокирующие (`FOR SHARE`), и транзакции упираются в дедлок, одну из них InnoDB откатывает. В обоих случаях транзакцию нужно повторить — цена этого в [«Почему не `SERIALIZABLE` везде»](transactions.md#serializable).
    2. **Блокировать то, что прочитал.** `SELECT name FROM doctors WHERE on_call FOR UPDATE`: вторая транзакция ждёт на чтении, а после коммита первой видит одного дежурного и не уходит. Работает на `READ COMMITTED`.
    3. **Ограничение в БД**, если правило на него ложится: уникальный индекс, `CHECK`, в PostgreSQL — ограничение-исключение `EXCLUDE` для пересекающихся интервалов.

    `FOR UPDATE` блокирует только найденные строки. Если правило — «нет пересекающейся брони», а запись — `INSERT` новой брони, блокировать нечего: обе транзакции увидят пустую выборку и обе вставят. Тогда остаются ограничение в БД, `SERIALIZABLE` или блокировка общей родительской строки (например, комнаты) перед проверкой.

    Вывод программы ниже на JDK 25 с PostgreSQL 16, `REPEATABLE READ`:

    ```text
    alice: на дежурстве 2
    bob: на дежурстве 2
    alice: ушёл с дежурства, COMMIT
    bob: ушёл с дежурства, COMMIT
    На дежурстве: 0
    ```

    `SERIALIZABLE`:

    ```text
    alice: на дежурстве 2
    bob: на дежурстве 2
    alice: ушёл с дежурства, COMMIT
    bob: SQLState 40001: ERROR: could not serialize access due to read/write dependencies among transactions
      Detail: Reason code: Canceled on identification as a pivot, during write.
      Hint: The transaction might succeed if retried.
    На дежурстве: 1
    ```

    `READ COMMITTED` и `SELECT … FOR UPDATE`:

    ```text
    alice: на дежурстве 2
    alice: ушёл с дежурства, COMMIT
    bob: на дежурстве 1
    bob: остаётся, он последний
    На дежурстве: 1
    ```

    MySQL 8.0 на `REPEATABLE READ` тоже оставляет 0 дежурных, на `READ COMMITTED` с `FOR UPDATE` — одного, а на `SERIALIZABLE` откатывает bob с `SQLState 40001: Deadlock found when trying to get lock; try restarting transaction`.

    ??? example "Код: `WriteSkew.java`"

        ```java
        import java.sql.Connection;
        import java.sql.DriverManager;
        import java.sql.ResultSet;
        import java.sql.SQLException;
        import java.sql.Statement;
        import java.util.concurrent.CyclicBarrier;

        // java -cp .:<jdbc-драйвер> WriteSkew <jdbc-url> <user> <password> <RC|RR|SERIALIZABLE> <plain|for-update>
        public class WriteSkew {

            static String url, user, password;
            static int isolation;
            static boolean forUpdate;
            static final CyclicBarrier bothChecked = new CyclicBarrier(2);

            public static void main(String[] args) throws Exception {
                url = args[0];
                user = args[1];
                password = args[2];
                isolation = switch (args[3]) {
                    case "RC" -> Connection.TRANSACTION_READ_COMMITTED;
                    case "RR" -> Connection.TRANSACTION_REPEATABLE_READ;
                    default -> Connection.TRANSACTION_SERIALIZABLE;
                };
                forUpdate = args[4].equals("for-update");

                try (Connection c = DriverManager.getConnection(url, user, password);
                     Statement st = c.createStatement()) {
                    st.execute("DROP TABLE IF EXISTS doctors");
                    st.execute("CREATE TABLE doctors (name VARCHAR(20) PRIMARY KEY, on_call BOOLEAN NOT NULL)");
                    st.execute("INSERT INTO doctors VALUES ('alice', TRUE), ('bob', TRUE)");
                }

                // Правило: на дежурстве всегда хотя бы один врач. Оба уходят одновременно
                Thread a = Thread.ofPlatform().start(() -> goOffCall("alice", 0));
                Thread.sleep(100); // alice начинает первой
                Thread b = Thread.ofPlatform().start(() -> goOffCall("bob", 300));
                a.join();
                b.join();

                try (Connection c = DriverManager.getConnection(url, user, password)) {
                    System.out.println("На дежурстве: " + onCall(c, false));
                }
            }

            static void goOffCall(String name, long delayMs) {
                try (Connection c = DriverManager.getConnection(url, user, password)) {
                    c.setAutoCommit(false);
                    c.setTransactionIsolation(isolation);
                    try {
                        int onCall = onCall(c, forUpdate);
                        System.out.println(name + ": на дежурстве " + onCall);
                        if (!forUpdate) {
                            bothChecked.await(); // без блокировки обе проверки проходят до записи
                        }
                        Thread.sleep(delayMs);
                        if (onCall >= 2) {
                            try (Statement st = c.createStatement()) {
                                st.executeUpdate("UPDATE doctors SET on_call = FALSE WHERE name = '" + name + "'");
                            }
                            c.commit();
                            System.out.println(name + ": ушёл с дежурства, COMMIT");
                        } else {
                            c.rollback();
                            System.out.println(name + ": остаётся, он последний");
                        }
                    } catch (SQLException e) {
                        c.rollback();
                        System.out.println(name + ": SQLState " + e.getSQLState() + ": " + e.getMessage());
                    }
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
            }

            static int onCall(Connection c, boolean lock) throws SQLException {
                String sql = "SELECT name FROM doctors WHERE on_call" + (lock ? " FOR UPDATE" : "");
                int count = 0;
                try (Statement st = c.createStatement(); ResultSet rs = st.executeQuery(sql)) {
                    while (rs.next()) count++;
                }
                return count;
            }
        }
        ```

!!! warning "Ловушка: `@Version` не ловит write skew"
    Оптимистичная блокировка проверяет версию **той строки, которую пишешь**. Здесь каждая транзакция пишет свою строку, версии не конфликтуют, и обе закоммитятся. Нужна блокировка или проверка тех строк, по которым принималось решение.

!!! warning "Ловушка: `SELECT count(*) … FOR UPDATE` в PostgreSQL"
    PostgreSQL не разрешает `FOR UPDATE` вместе с агрегатами: `ERROR: FOR UPDATE is not allowed with aggregate functions`. Блокируй сами строки (`SELECT id … FOR UPDATE`) и считай их в коде, как в примере.

??? question "Проверь себя"
    1. Чем write skew отличается от lost update?
    2. Почему снимок `REPEATABLE READ` не видит конфликта в сценарии с дежурными врачами?
    3. Почему `SELECT … FOR UPDATE` не помогает, если правило проверяет отсутствие строк, а транзакции делают `INSERT`?

**Источники:**

- [PostgreSQL: Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html) — таблица аномалий с serialization anomaly, `could not serialize access due to concurrent update` на Repeatable Read, SSI и пример с `class | value`
- [PostgreSQL: Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) и [`SELECT` — The Locking Clause](https://www.postgresql.org/docs/current/sql-select.html#SQL-FOR-UPDATE-SHARE) — `FOR UPDATE`, запрет с агрегатами
- [PostgreSQL: Exclusion Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-EXCLUSION)
- [MySQL 8.0: Consistent Nonlocking Reads](https://dev.mysql.com/doc/refman/8.0/en/innodb-consistent-read.html) — снимок действует на `SELECT`, а не на DML
- [MySQL 8.0: Transaction Isolation Levels](https://dev.mysql.com/doc/refman/8.0/en/innodb-transaction-isolation-levels.html) — `SERIALIZABLE` превращает `SELECT` в `SELECT … FOR SHARE`
- [Spring Data JPA: Locking](https://docs.spring.io/spring-data/jpa/reference/jpa/locking.html) и [Modifying Queries](https://docs.spring.io/spring-data/jpa/reference/jpa/query-methods.html#jpa.modifying-queries) — `@Lock` и `@Modifying`

## Блокировки строк { #row-locking }

### Как работает оптимистичная блокировка? { #optimistic-locking }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    В Entity добавляют поле `@Version`, и Hibernate дописывает проверку версии в `WHERE` каждого `UPDATE`. Если другая транзакция уже обновила строку, `UPDATE` затронет 0 строк, и Hibernate бросит `OptimisticLockException`. Блокировок в БД нет — подходит, когда конфликты редки, а читают много.

**Девиз:** «Я верю, что конфликтов не будет. Если возникнут — разберёмся по факту». Никаких реальных блокировок на уровне БД.

```java
@Entity
public class Habit {
    @Id
    private Long id;

    private String name;

    @Version  // Hibernate управляет этим полем сам
    private Integer version;
}
```

При `UPDATE` Hibernate добавляет проверку версии в SQL:

```sql
UPDATE habit SET name = 'Бег', version = 2 WHERE id = 1 AND version = 1;
-- Если другая транзакция уже обновила запись (version стал 2),
-- WHERE не найдёт строку → 0 updated rows → OptimisticLockException
```

**Когда использовать:** вероятность коллизий **низкая**, но читают много.

_Пример:_ CRM с календарём записей. Администратор и клиент одновременно бронируют одно окошко: шанс коллизии мал, но возможен, а блокировать всю строку — замедлить систему. Второй получит `OptimisticLockException`, мы поймаем его и покажем: «Это время только что заняли, выберите другое».

!!! warning "Ловушка: исключение нужно обработать"
    Оптимистичная блокировка не предотвращает конфликт, а обнаруживает его. Если не поймать `OptimisticLockException` и не сделать повтор или понятное сообщение, пользователь получит 500.

??? question "Проверь себя"
    1. Что Hibernate добавляет в `UPDATE` при наличии `@Version`?
    2. Что происходит, если версия уже изменилась?
    3. В каких сценариях выбирают оптимистичную блокировку?

### Как работает пессимистичная блокировка? { #pessimistic-locking }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Это реальная блокировка строки в СУБД: `@Lock(PESSIMISTIC_WRITE)` превращается в `SELECT ... FOR UPDATE`, и другие транзакции с `FOR UPDATE` ждут, пока первая не закончит. Выбирают, когда конфликты частые, а цена ошибки высокая — например, списания с одного счёта.

**Девиз:** «Никому не доверяю. Пока я работаю с данными — никто не прикоснётся».

```java
public interface HabitRepository extends JpaRepository<Habit, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Habit h WHERE h.id = :id")
    Optional<Habit> findByIdForUpdate(@Param("id") Long id);
}
```

Hibernate генерирует:

```sql
SELECT * FROM habit WHERE id = 1 FOR UPDATE;
-- Строка заблокирована. Другие транзакции с FOR UPDATE зависнут и будут ждать.
```

**Когда использовать:** вероятность коллизий **высокая**, цена ошибки критична.

_Пример:_ банковский перевод. У пользователя 10 000 тенге, одновременно списываются платёж по кредиту, подписка и перевод другу. Оптимистичная блокировка с бесконечными повторами положит платёжный шлюз, а `SELECT FOR UPDATE` выстроит транзакции в строгую очередь — каждая работает с актуальным остатком.

| | **Optimistic** | **Pessimistic** |
|---|---|---|
| **Блокировка в БД** | Нет | Да (`SELECT FOR UPDATE`) |
| **Механизм** | `@Version` поле | `@Lock(PESSIMISTIC_WRITE)` |
| **При коллизии** | `OptimisticLockException` (retry) | Ожидание (hang) |
| **Производительность** | Высокая при низкой конкуренции | Деградирует при высокой конкуренции |
| **Когда** | Читаем много, пишем редко | Конкуренция высокая, цена ошибки критична |

!!! warning "Ловушка: блокировка живёт до конца транзакции"
    `FOR UPDATE` держит строку до коммита или отката. Если метод с такой выборкой ещё и ходит во внешние сервисы, все конкурирующие транзакции ждут его целиком.

??? question "Проверь себя"
    1. Во что превращается `@Lock(PESSIMISTIC_WRITE)`?
    2. Что происходит с другими транзакциями, которые хотят ту же строку?
    3. Почему для частых списаний со счёта пессимистичная блокировка лучше оптимистичной?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Lost update** | Read-modify-write в коде затирает чужую запись; лечат атомарным `UPDATE x = x + 1`, `FOR UPDATE` или `@Version`. PostgreSQL на `REPEATABLE READ` — ошибка `40001`, MySQL — тихая потеря |
| **Write skew** | Читают одно, пишут разные строки и вместе ломают правило; `REPEATABLE READ` не ловит — нужен `SERIALIZABLE` или `FOR UPDATE` на прочитанные строки |
| **Optimistic Lock** | Поле `@Version`, без блокировки БД. Для низкой конкуренции |
| **Pessimistic Lock** | `SELECT FOR UPDATE`, физическая блокировка. Для критичных операций |

<!-- --8<-- [end:cheatsheet] -->
