# Spring Data JPA и Транзакции

## Магия `@Transactional` под капотом

### 1. Что происходит пошагово

Мы знаем из Spring Core, что `@Transactional` — это AOP-аспект, реализованный через Proxy (обычно CGLIB). Когда `OrderController` вызывает `habitService.saveHabit()`:

```
1. Вызов → Proxy (не реальный объект!)
2. Proxy → TransactionManager → берёт Connection из пула (HikariCP)
3. connection.setAutoCommit(false)  ← открыта транзакция
4. Proxy → реальный метод saveHabit() → INSERT/UPDATE улетают в БД (но не зафиксированы)
5а. Метод вернул результат → connection.commit() → данные на диске
5б. Метод бросил RuntimeException → connection.rollback() → данные исчезли
6. Connection → обратно в пул
```

!!! warning "Главная ловушка: только RuntimeException"
    По умолчанию Spring делает Rollback **только** при `RuntimeException` (и `Error`). Если метод бросит проверяемое `IOException` или просто `Exception` — Spring **закоммитит** транзакцию!

    ```java
    // ❌ IOException не откатит транзакцию
    @Transactional
    public void save(Habit habit) throws IOException {
        habitRepository.save(habit);
        throw new IOException("упс"); // коммит всё равно произойдёт!
    }

    // ✅ Сеньоры всегда пишут так
    @Transactional(rollbackFor = Exception.class)
    public void save(Habit habit) throws IOException { ... }
    ```

### 2. Проблема самовызова (Self-invocation)

Разбирали в Spring Core, но в контексте транзакций это имеет критические бизнес-последствия — данные могут сохраниться кусками.

```java
@Service
public class HabitService {

    // Контроллер вызывает этот метод — БЕЗ @Transactional
    public void createHabitWithNotification(Habit habit) {
        saveToDb(habit);    // внутренний вызов через this
        sendEmail(habit);   // бросит RuntimeException
    }

    @Transactional
    public void saveToDb(Habit habit) {
        habitRepository.save(habit);
    }

    private void sendEmail(Habit habit) {
        throw new RuntimeException("Почта сломалась!");
    }
}
```

!!! warning "Вопрос на собесе"
    _"Откатятся ли данные, если при отправке письма упадёт ошибка?"_

    **Ответ: НЕТ.** Транзакция вообще не откроется. Привычка сохранится в базу, письмо не отправится — бизнес-процесс сломан.

    **Почему:** Контроллер вызывает `createHabitWithNotification()` через Proxy. Proxy видит — над этим методом нет `@Transactional`, просто пробрасывает вызов в реальный объект. Внутри реального объекта `this.saveToDb()` вызывается напрямую, **минуя Proxy**. Никакого `setAutoCommit(false)` — Hibernate работает в режиме auto-commit.

### 3. Как лечить Self-invocation

**Способ 1 — Архитектурный (самый правильный):**

```java
// Разнести по разным сервисам
@Service
public class HabitService {
    private final HabitPersistenceService persistenceService; // инжектируем бин

    public void createHabitWithNotification(Habit habit) {
        persistenceService.saveToDb(habit); // вызов через Proxy нового сервиса → транзакция откроется
        sendEmail(habit);
    }
}

@Service
public class HabitPersistenceService {
    @Transactional
    public void saveToDb(Habit habit) { ... }
}
```

**Способ 2 — Self-injection (костыль, но рабочий):**

```java
@Service
public class HabitService {
    @Autowired @Lazy  // @Lazy разрывает циклическую зависимость при инжекте самого себя
    private HabitService self;

    public void createHabitWithNotification(Habit habit) {
        self.saveToDb(habit); // вызов через Proxy → транзакция откроется
        sendEmail(habit);
    }

    @Transactional
    public void saveToDb(Habit habit) { ... }
}
```

**Способ 3 — `TransactionTemplate` (программное управление):**

```java
@Service
public class HabitService {
    private final TransactionTemplate txTemplate;

    public void createHabitWithNotification(Habit habit) {
        txTemplate.execute(status -> {         // явно открываем транзакцию
            habitRepository.save(habit);
            return null;
        });
        sendEmail(habit);
    }
}
```

## Propagation (Распространение транзакций)

### REQUIRED — по умолчанию

**Суть:** "Давай вместе". Есть внешняя транзакция — присоединяется к ней. Нет — создаёт новую.

Под капотом: **один Connection** к БД. Один физический `commit()` в конце внешнего метода.

!!! warning "Ловушка: `UnexpectedRollbackException`"
    Внешний метод вызывает внутренний. Внутренний падает с ошибкой, но внешний оборачивает вызов в `try-catch` и пытается продолжить. Что будет?

    ```java
    @Transactional
    public void outer() {
        try {
            inner(); // падает с RuntimeException
        } catch (Exception e) {
            log.error("поймал ошибку, продолжаю...");
        }
        // пытаемся дойти до конца и закоммитить
    }

    @Transactional // REQUIRED — присоединяется к транзакции outer()
    public void inner() {
        throw new RuntimeException("упс");
    }
    ```

    **Ответ:** Приложение упадёт с `UnexpectedRollbackException`. Транзакция одна. Внутренний метод при падении пометил её флагом `rollback-only`. Внешний поймал ошибку в `catch`, дошёл до конца, попытался сделать `commit()`. Spring видит флаг и говорит: "Кто-то внутри уже забраковал эту транзакцию" — и кидает исключение.

---

### REQUIRES_NEW — независимая транзакция

**Суть:** "Я сам по себе". Всегда создаёт новую транзакцию. Внешняя ставится на паузу (suspend).

Под капотом: **два Connection** из пула. Первый висит и ждёт, пока внутренний метод работает на втором.

!!! danger "Ловушка для HighLoad: Connection Pool Exhaustion"
    Если в пуле 10 коннектов и придут 10 одновременных запросов, каждый из которых зависнет во внешней транзакции и попросит второй коннект для REQUIRES_NEW — все 10 запросов будут держать по одному коннекту и ждать второй. Пул мёртв. Дедлок.

**Бизнес-кейс:** Аудит и логирование операций. Если основной бизнес-процесс (перевод денег) откатился — запись о **попытке** перевода всё равно должна закоммититься.

```java
@Transactional
public void transfer(Account from, Account to, BigDecimal amount) {
    debit(from, amount);  // может упасть
    credit(to, amount);
}

@Transactional(propagation = Propagation.REQUIRES_NEW) // независимая транзакция
public void logAudit(AuditEvent event) {
    auditRepository.save(event); // закоммитится даже если transfer() откатится
}
```

---

### NESTED — вложенная транзакция

**Суть:** "С тобой, но с подстраховкой". Зависит от внешней (если внешняя откатится — откатится и она), но может откатиться **сама по себе**, не ломая внешнюю.

Под капотом: **один Connection** + `connection.setSavepoint()` перед стартом внутреннего метода. При ошибке — `rollback` только до Savepoint, внешняя транзакция живёт дальше.

```java
@Transactional
public void processOrder(Order order) {
    saveOrder(order);
    try {
        sendNotification(order); // может упасть — но не сломает всё
    } catch (Exception e) {
        log.warn("Уведомление не отправлено, заказ всё равно сохранён");
    }
}

@Transactional(propagation = Propagation.NESTED)
public void sendNotification(Order order) {
    // если упадёт — откат только до Savepoint, не весь processOrder
    notificationRepository.save(new Notification(order));
}
```

---

### Сравнительная таблица

| Propagation | Коннектов к БД | Ошибка внутри | Откат внешней → внутренняя |
|---|---|---|---|
| **REQUIRED** | 1 (общий) | Ломает всю транзакцию | Откатываются обе |
| **REQUIRES_NEW** | 2 (независимые) | Внешняя выживает (при try-catch) | Не влияет (полная независимость) |
| **NESTED** | 1 + Savepoint | Внешняя выживает (откат до Savepoint) | Внутренняя тоже откатится |

### Остальные типы (для справки)

- **MANDATORY** — ожидает готовую транзакцию. Нет транзакции → исключение.
- **SUPPORTS** — есть транзакция → работает в ней. Нет → работает без неё (auto-commit).
- **NOT_SUPPORTED** — приостанавливает текущую транзакцию и работает без неё.
- **NEVER** — если вызвали в контексте транзакции → исключение.

## Isolation (Уровни изоляции)

### Три аномалии

**Dirty Read (Грязное чтение)** — транзакция А читает данные, которые транзакция Б изменила, но ещё не закоммитила. Б делает rollback — А работала с "мусором", которого никогда не было в БД.

**Non-repeatable Read (Неповторяющееся чтение)** — проблема **одной строки**. А читает баланс (100). Б списывает 50 и коммитит. А снова читает тот же баланс и видит 50. Данные изменились внутри транзакции А.

**Phantom Read (Фантомное чтение)** — проблема **множества строк**. А делает `SELECT * WHERE status = 'NEW'` — находит 5 заказов. Б добавляет новый заказ и коммитит. А повторяет тот же SELECT — находит 6. Появился "фантом".

### Уровни изоляции

| Уровень | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| **READ_UNCOMMITTED** | Допускает | Допускает | Допускает |
| **READ_COMMITTED** | **Защищает** | Допускает | Допускает |
| **REPEATABLE_READ** | Защищает | **Защищает** | Допускает |
| **SERIALIZABLE** | Защищает | Защищает | **Защищает** |

`Isolation.DEFAULT` в Spring = использовать уровень, настроенный в самой БД.

### Сеньорские нюансы

**Подвох PostgreSQL:**

- Postgres не поддерживает `READ_UNCOMMITTED`. Если выставишь — молча работает на `READ_COMMITTED`. Грязного чтения в Postgres не бывает в принципе.
- В Postgres `REPEATABLE_READ` защищает **и от Phantom Read тоже** — за счёт MVCC (Multi-Version Concurrency Control). Каждая транзакция работает со своим "снимком" БД.

!!! warning "`SERIALIZABLE` — зло для HighLoad"
    _"Если SERIALIZABLE решает все проблемы, почему бы не ставить его везде?"_

    Потому что это убьёт производительность. База вешает тяжёлые блокировки на таблицы и строки, выстраивая транзакции строго последовательно. В высоконагруженной системе — колоссальные задержки и постоянные дедлоки.

### Как решают на практике: блокировки на уровне JPA

Вместо жёстких уровней изоляции в Enterprise используют блокировки Hibernate.

#### Оптимистичная блокировка (Optimistic Locking)

**Девиз:** "Я верю, что конфликтов не будет. Если возникнут — разберёмся по факту."

Никаких реальных блокировок на уровне БД. В Entity добавляется поле `@Version`:

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

**Когда использовать:** Вероятность коллизий **низкая**, но читают много.

_Пример:_ CRM с календарём записей. Администратор и клиент одновременно бронируют одно окошко. Шанс коллизии мал, но возможен. Блокировать всю строку — замедлить систему. Второй получит `OptimisticLockException`, красиво поймаем и покажем: "Это время только что заняли, выберите другое."

#### Пессимистичная блокировка (Pessimistic Locking)

**Девиз:** "Никому не доверяю. Пока я работаю с данными — никто не прикоснётся."

Реальная физическая блокировка на уровне СУБД:

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

**Когда использовать:** Вероятность коллизий **высокая**, цена ошибки критична.

_Пример:_ Банковский перевод. У пользователя 10 000 тенге. Одновременно списываются платёж по кредиту, подписка и перевод другу. Оптимистичная блокировка с бесконечными retry положит платёжный шлюз. `SELECT FOR UPDATE` выстроит транзакции в строгую очередь — каждая работает с актуальным остатком.

| | **Optimistic** | **Pessimistic** |
|---|---|---|
| **Блокировка в БД** | Нет | Да (`SELECT FOR UPDATE`) |
| **Механизм** | `@Version` поле | `@Lock(PESSIMISTIC_WRITE)` |
| **При коллизии** | `OptimisticLockException` (retry) | Ожидание (hang) |
| **Производительность** | Высокая при низкой конкуренции | Деградирует при высокой конкуренции |
| **Когда** | Читаем много, пишем редко | Конкуренция высокая, цена ошибки критична |

## Hibernate под капотом

### 1. Проблема N+1

```java
// У Client есть @OneToMany с Appointment (LAZY по умолчанию)
List<Client> clients = clientRepository.findAll(); // 1 SELECT — 10 клиентов

for (Client client : clients) {
    // ❌ На каждой итерации — отдельный SELECT в appointments!
    int count = client.getAppointments().size();
}
// Итого: 1 + 10 = 11 запросов. При 1000 клиентах — 1001 запрос. База ляжет.
```

**Способ 1 — JOIN FETCH (классика):**

```java
@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {

    @Query("SELECT c FROM Client c JOIN FETCH c.appointments")
    List<Client> findAllWithAppointments();
    // Один SELECT с INNER JOIN — всё сразу
}
```

**Способ 2 — `@EntityGraph` (современный подход):**

```java
@EntityGraph(attributePaths = {"appointments"})
List<Client> findAll(); // для этого вызова связь становится EAGER, один JOIN
```

**Способ 3 — `@BatchSize` (когда JOIN невозможен):**

```java
@Entity
public class Client {
    @OneToMany
    @BatchSize(size = 50) // вместо 1000 запросов — 20 (батчи по 50)
    private List<Appointment> appointments;
}
// Hibernate использует IN (id1, id2, ..., id50) вместо отдельных запросов
```

!!! tip "Когда JOIN FETCH не подходит"
    При нескольких `JOIN FETCH` в одном запросе можно получить декартово произведение (огромный результат). В таком случае `@BatchSize` — правильное решение.

### 2. Жизненный цикл Entity

```
new Client()                    → TRANSIENT   (Hibernate не знает об объекте)
     ↓ repository.save() или findById()
Persistence Context             → PERSISTENT  (Hibernate следит за изменениями)
     ↓ транзакция завершилась / entityManager.clear()
В памяти, но не под наблюдением → DETACHED    (изменения не попадут в БД)
     ↓ entityManager.merge()
Persistence Context             → PERSISTENT  (снова под наблюдением)
     ↓ repository.delete()
Запланирован к удалению         → REMOVED     (физически удалится при коммите)
```

**Dirty Checking — главная магия PERSISTENT состояния:**

```java
@Transactional
public void updateName(Long id, String newName) {
    Client client = clientRepository.findById(id).get(); // PERSISTENT
    client.setName(newName); // просто меняем поле

    // ✅ НЕ нужно вызывать save()!
    // При коммите транзакции Hibernate сам увидит изменение
    // и сгенерирует UPDATE
}
```

### 3. `save()` vs `saveAndFlush()`

```java
@Transactional
public void example() {
    Habit habit = new Habit("Бег");
    habitRepository.save(habit);
    // SQL INSERT ещё НЕ отправлен в БД!
    // Данные в Persistence Context, ждут коммита
    System.out.println(habit.getId()); // ID может быть null если генерируется БД

    habitRepository.saveAndFlush(habit);
    // SQL INSERT отправлен в БД прямо сейчас
    System.out.println(habit.getId()); // ID точно есть — его вернула БД
    // НО! Транзакция ещё не закоммичена.
    // Если метод упадёт ниже — rollback, данные исчезнут.
}
```

!!! tip "Когда нужен `saveAndFlush()`"
    Когда до конца метода нужен сгенерированный БД `id`. Или когда на таблице висят триггеры, которые должны отработать немедленно, до выполнения следующего кода.

### 4. Кэш 1-го и 2-го уровня

| | **L1 (Persistence Context)** | **L2 (Second-level Cache)** |
|---|---|---|
| **Область видимости** | Одна транзакция (EntityManager) | Всё приложение (SessionFactory) |
| **По умолчанию** | **Включён всегда**, нельзя отключить | Отключён |
| **Что кэширует** | Объекты в рамках транзакции | Объекты между транзакциями |
| **Реализация** | Встроено в Hibernate | Внешний провайдер (Ehcache, Hazelcast) |

```java
@Transactional
public void example() {
    Client c1 = clientRepository.findById(1L); // SELECT в БД
    Client c2 = clientRepository.findById(1L); // Из L1-кэша, SELECT нет!
    // c1 == c2 (один и тот же объект)
}
```

!!! note "L2 Cache в современных проектах"
    Встроенный L2-кэш Hibernate крайне редко используют в Enterprise-архитектуре. При нескольких инстансах микросервиса инвалидация кэша становится кошмаром. Вместо него — **Redis** через `@Cacheable` в Spring: прозрачный распределённый кэш, независимый от ORM.

    ```java
    @Cacheable(value = "clients", key = "#id")
    public Client findById(Long id) {
        return clientRepository.findById(id).orElseThrow();
    }
    ```

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **`@Transactional` rollback** | По умолчанию только на `RuntimeException`. Для всего — `rollbackFor = Exception.class` |
| **Self-invocation** | `this.method()` минует Proxy → транзакция не откроется. Решение: разные сервисы |
| **REQUIRED** | 1 коннект, общая транзакция. Ошибка внутри → `UnexpectedRollbackException` |
| **REQUIRES_NEW** | 2 коннекта, независимые транзакции. Риск дедлока пула |
| **NESTED** | 1 коннект + Savepoint. Внутренняя откатывается независимо |
| **Optimistic Lock** | `@Version` поле, без блокировки БД. Для низкой конкуренции |
| **Pessimistic Lock** | `SELECT FOR UPDATE`, физическая блокировка. Для критичных операций |
| **N+1** | JOIN FETCH → @EntityGraph → @BatchSize |
| **Dirty Checking** | PERSISTENT объект: `setName()` без `save()` — UPDATE при коммите |
| **save() vs saveAndFlush()** | `save()` — откладывает SQL. `saveAndFlush()` — немедленно, но не коммитит |
| **L2 Cache** | В Enterprise заменяют на Redis + `@Cacheable` |