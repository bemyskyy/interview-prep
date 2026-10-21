---
tags:
  - Junior
  - Middle
  - Senior
  - Spring
  - Транзакции
---

# Транзакции в Spring

Как Spring управляет транзакциями: что делает прокси `@Transactional`, при каких исключениях будет откат, чем опасен самовызов, как работают типы propagation и как задать уровень изоляции. На собесе чаще всего спрашивают, почему транзакция не откатилась, что будет при самовызове и разницу `REQUIRED`, `REQUIRES_NEW` и `NESTED`. Что гарантируют сами уровни изоляции — на странице [Транзакции и MVCC](../database/transactions.md).

## Как работает `@Transactional` { #transactional }

### Что происходит при вызове `@Transactional`-метода? { #transactional-flow }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `@Transactional` — AOP-аспект, реализованный через прокси (обычно CGLIB). Прокси через `TransactionManager` берёт соединение из пула, выключает auto-commit и вызывает реальный метод. Метод завершился успешно — `commit()`, бросил `RuntimeException` — `rollback()`, после чего соединение возвращается в пул.

Как устроены прокси, разобрано в [Spring Core → AOP и прокси](spring-core.md#aop). Здесь — что прокси делает с транзакцией, когда `OrderController` вызывает `habitService.saveHabit()`:

```mermaid
sequenceDiagram
    participant C as OrderController
    participant P as Proxy HabitService
    participant TM as TransactionManager
    participant H as Пул HikariCP
    participant S as Реальный HabitService
    participant DB as БД
    C->>P: saveHabit()
    P->>TM: начать транзакцию
    TM->>H: взять Connection
    TM->>DB: setAutoCommit(false) — транзакция открыта
    P->>S: saveHabit()
    S->>DB: INSERT / UPDATE (ещё не зафиксированы)
    alt метод вернул результат
        P->>DB: commit() — данные на диске
    else метод бросил RuntimeException
        P->>DB: rollback() — данные исчезли
    end
    P->>H: вернуть Connection в пул
```

Вызов приходит не в реальный объект, а в прокси. Всё, что между `setAutoCommit(false)` и `commit()`, — одна транзакция на одном соединении.

!!! warning "Ловушка: соединение занято на всё время метода"
    Пока метод с `@Transactional` выполняется, он держит соединение из пула. Долгий HTTP-вызов внутри транзакции держит соединение всё это время — при нагрузке пул быстро заканчивается.

??? question "Проверь себя"
    1. Через какой механизм Spring реализует `@Transactional`?
    2. Откуда прокси берёт соединение и что с ним делает перед вызовом метода?
    3. Когда вызывается `commit()`, а когда — `rollback()`?

### При каких исключениях Spring откатывает транзакцию? { #rollback-rules }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    По умолчанию — только при `RuntimeException` и `Error`. Если метод бросит checked-исключение, например `IOException`, Spring закоммитит транзакцию. Чтобы откатывать на любое исключение, пишут `@Transactional(rollbackFor = Exception.class)`.

```java
// ❌ IOException не откатит транзакцию
@Transactional
public void save(Habit habit) throws IOException {
    habitRepository.save(habit);
    throw new IOException("упс"); // коммит всё равно произойдёт!
}

// ✅ Откат на любое исключение
@Transactional(rollbackFor = Exception.class)
public void save(Habit habit) throws IOException { ... }
```

Почему в Spring предпочитают unchecked-исключения — в [Исключения → Свои исключения](../java/exceptions.md#custom-exceptions).

!!! warning "Ловушка: checked-исключение коммитит транзакцию"
    `throws IOException` или `throws Exception` в сигнатуре не делают откат автоматическим. Без `rollbackFor` данные, записанные до исключения, будут зафиксированы.

??? question "Проверь себя"
    1. При каких исключениях Spring откатывает транзакцию по умолчанию?
    2. Что произойдёт с данными, если метод бросит `IOException`?
    3. Как включить откат для любого исключения?

### Чем опасен самовызов для транзакций? { #self-invocation-transactions }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    При вызове `this.method()` прокси не участвует, поэтому `@Transactional` на вызываемом методе игнорируется. Для транзакций это значит, что Hibernate работает в режиме auto-commit и данные сохраняются кусками: часть бизнес-процесса записалась, часть упала — и ничего не откатилось.

Сам механизм самовызова и общие способы лечения разобраны в [Spring Core → Самовызов](spring-core.md#self-invocation). Здесь — последствия для данных.

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

Вопрос на собесе: _«Откатятся ли данные, если при отправке письма упадёт ошибка?»_

**Ответ: нет.** Транзакция вообще не откроется: привычка сохранится в базу, письмо не отправится — бизнес-процесс сломан. Контроллер вызывает `createHabitWithNotification()` через прокси, а над этим методом нет `@Transactional`, поэтому прокси просто пробрасывает вызов. Внутри реального объекта `this.saveToDb()` вызывается напрямую, никакого `setAutoCommit(false)` нет.

**Как лечить:**

- **Разнести по разным сервисам** — самый правильный, архитектурный способ: `HabitPersistenceService.saveToDb()` с `@Transactional`, вызов через его прокси.
- **Self-injection** — рабочий костыль: `@Autowired @Lazy private HabitService self`, вызов `self.saveToDb()`.
- **`TransactionTemplate`** — программное управление транзакцией, без прокси вовсе:

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

Код первых двух способов — в [Spring Core → Самовызов](spring-core.md#self-invocation).

!!! warning "Ловушка: propagation тоже работает только через прокси"
    Не только «открыть транзакцию», но и `REQUIRES_NEW`, `NESTED`, `rollbackFor` и любые другие настройки `@Transactional` применяет прокси. При вызове через `this` все они игнорируются — примеры ниже, в разделе [Propagation](#propagation).

??? question "Проверь себя"
    1. Откатится ли сохранение, если `saveToDb()` вызвать через `this`, а потом упадёт отправка письма?
    2. В каком режиме работает Hibernate, если транзакция не открылась?
    3. Как `TransactionTemplate` обходит проблему самовызова?

## Propagation: распространение транзакций { #propagation }

### Как работает `REQUIRED` и откуда берётся `UnexpectedRollbackException`? { #required }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    `REQUIRED` — значение по умолчанию: есть внешняя транзакция — присоединяемся, нет — создаём новую. Транзакция одна, на одном соединении. Если внутренний метод упал, прокси помечает общую транзакцию как `rollback-only`, и даже если внешний метод поймал исключение, при попытке коммита Spring бросит `UnexpectedRollbackException`.

**Суть:** «Давай вместе». Под капотом **одно соединение (Connection)** к БД и один физический `commit()` в конце внешнего метода.

Внешний метод вызывает внутренний. Внутренний падает с ошибкой, но внешний оборачивает вызов в `try-catch` и пытается продолжить. Что будет?

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private final InventoryService inventoryService; // другой бин → вызов пойдёт через его Proxy

    @Transactional
    public void outer() {
        try {
            inventoryService.inner(); // падает с RuntimeException
        } catch (Exception e) {
            log.error("поймал ошибку, продолжаю...");
        }
        // пытаемся дойти до конца и закоммитить
    }
}

@Service
public class InventoryService {

    @Transactional // REQUIRED — присоединяется к транзакции outer()
    public void inner() {
        throw new RuntimeException("упс");
    }
}
```

```mermaid
sequenceDiagram
    participant O as OrderService.outer()
    participant P as Proxy InventoryService
    participant I as InventoryService.inner()
    O->>P: inner()
    P->>I: inner()
    I-->>P: RuntimeException
    P->>P: пометить общую транзакцию rollback-only
    P-->>O: RuntimeException
    O->>O: catch — продолжаем
    O->>O: commit() при выходе из outer()
    Note over O: флаг rollback-only → UnexpectedRollbackException
```

**Ответ:** приложение упадёт с `UnexpectedRollbackException`, потому что транзакция одна. Прокси `InventoryService` поймал исключение из `inner()` и пометил общую транзакцию флагом `rollback-only`. Внешний метод поймал ошибку в `catch`, дошёл до конца и попытался сделать `commit()` — Spring видит флаг («кто-то внутри уже забраковал эту транзакцию») и бросает исключение.

!!! warning "Ловушка: если `inner()` в том же классе"
    `inner()` вынесен в отдельный бин не случайно. Если бы `outer()` и `inner()` лежали в одном классе, вызов шёл бы через `this`, **минуя прокси** — это [самовызов](#self-invocation-transactions). `@Transactional` над `inner()` был бы проигнорирован, флаг `rollback-only` никто бы не поставил: исключение просто поймалось бы в `catch`, и `outer()` спокойно закоммитился бы без `UnexpectedRollbackException`.

??? question "Проверь себя"
    1. Сколько соединений и физических коммитов при `REQUIRED`?
    2. Почему внешний метод получает `UnexpectedRollbackException`, хотя поймал исключение?
    3. Что изменится, если `inner()` будет в том же классе, что и `outer()`?

### Когда нужен `REQUIRES_NEW`? { #requires-new }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Когда операция должна закоммититься независимо от внешней транзакции — например, запись аудита о попытке перевода, даже если сам перевод откатился. `REQUIRES_NEW` приостанавливает внешнюю транзакцию и открывает новую на втором соединении. Цена — два соединения на один запрос и риск исчерпания пула.

**Суть:** «Я сам по себе». Всегда создаёт новую транзакцию, внешняя ставится на паузу (suspend). Под капотом **два соединения** из пула: первое висит и ждёт, пока внутренний метод работает на втором.

**Бизнес-кейс:** аудит и логирование операций. Если основной бизнес-процесс (перевод денег) откатился, запись о **попытке** перевода всё равно должна закоммититься.

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

`logAudit()` должен вызываться через прокси другого бина — иначе это самовызов и `REQUIRES_NEW` будет проигнорирован.

!!! warning "Ловушка: исчерпание пула соединений (Connection Pool Exhaustion)"
    В пуле 10 соединений, пришло 10 одновременных запросов. Каждый держит одно соединение во внешней транзакции и просит второе для `REQUIRES_NEW`. Все 10 запросов ждут второе соединение, которого никогда не будет, — пул мёртв, дедлок.

??? question "Проверь себя"
    1. Сколько соединений использует `REQUIRES_NEW`?
    2. Для какого бизнес-кейса он подходит?
    3. Как `REQUIRES_NEW` может положить пул соединений?

### Чем `NESTED` отличается от `REQUIRES_NEW`? { #nested }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    `NESTED` работает внутри внешней транзакции на том же соединении, но перед стартом ставит savepoint. Ошибка внутри откатывает только до savepoint, и внешняя транзакция живёт дальше; а если откатится внешняя — откатится и вложенная. `REQUIRES_NEW` же полностью независим и берёт второе соединение.

**Суть:** «С тобой, но с подстраховкой». Под капотом **одно соединение** и `connection.setSavepoint()` перед стартом внутреннего метода. При ошибке — `rollback` только до savepoint.

```java
@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final NotificationService notificationService; // отдельный бин

    @Transactional
    public void processOrder(Order order) {
        orderRepository.save(order);
        try {
            notificationService.sendNotification(order); // может упасть — но не сломает всё
        } catch (Exception e) {
            log.warn("Уведомление не отправлено, заказ всё равно сохранён");
        }
    }
}

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    @Transactional(propagation = Propagation.NESTED)
    public void sendNotification(Order order) {
        // если упадёт — откат только до Savepoint, не весь processOrder
        notificationRepository.save(new Notification(order));
    }
}
```

| Propagation | Соединений к БД | Ошибка внутри | Откат внешней → внутренняя |
|---|---|---|---|
| **`REQUIRED`** | 1 (общее) | Ломает всю транзакцию | Откатываются обе |
| **`REQUIRES_NEW`** | 2 (независимые) | Внешняя выживает (при `try-catch`) | Не влияет (полная независимость) |
| **`NESTED`** | 1 + savepoint | Внешняя выживает (откат до savepoint) | Внутренняя тоже откатится |

!!! warning "Ловушка: `NESTED` через `this` не ставит savepoint"
    Savepoint ставит `TransactionInterceptor` в прокси бина `NotificationService`. Если оставить `sendNotification()` в `OrderService` и вызвать его как `this.sendNotification()`, прокси не участвует: `NESTED` игнорируется, savepoint не создаётся, и метод просто выполняется внутри транзакции `processOrder()`. То же касается `REQUIRES_NEW` и любых других настроек `@Transactional`.

??? question "Проверь себя"
    1. Что делает `NESTED` перед стартом внутреннего метода?
    2. Что будет с вложенной транзакцией, если откатится внешняя?
    3. Почему `sendNotification()` вынесен в отдельный бин?

### Какие ещё бывают типы propagation? { #other-propagation }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Кроме `REQUIRED`, `REQUIRES_NEW` и `NESTED` есть ещё четыре. `MANDATORY` требует готовую транзакцию, `NEVER` — её отсутствие; `SUPPORTS` работает в транзакции, если она есть, а `NOT_SUPPORTED` приостанавливает текущую и работает без неё.

- **`MANDATORY`** — ожидает готовую транзакцию. Нет транзакции → исключение.
- **`SUPPORTS`** — есть транзакция → работает в ней. Нет → работает без неё (auto-commit).
- **`NOT_SUPPORTED`** — приостанавливает текущую транзакцию и работает без неё.
- **`NEVER`** — если вызвали в контексте транзакции → исключение.

!!! warning "Ловушка: `SUPPORTS` не открывает транзакцию"
    Метод с `SUPPORTS`, вызванный без внешней транзакции, работает в auto-commit: каждый запрос коммитится сам, и откатить их вместе нельзя.

??? question "Проверь себя"
    1. Чем `MANDATORY` отличается от `NEVER`?
    2. Как ведёт себя `SUPPORTS` без внешней транзакции?
    3. Что делает `NOT_SUPPORTED` с текущей транзакцией?

## Изоляция { #spring-isolation }

### Как задать уровень изоляции в Spring? { #isolation }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Через атрибут `isolation` у `@Transactional`, например `@Transactional(isolation = Isolation.REPEATABLE_READ)`. Значение по умолчанию `Isolation.DEFAULT` означает «использовать уровень, настроенный в самой БД». На практике жёсткие уровни изоляции поднимают редко, а конкуренцию за строки решают блокировками JPA.

Аномалии чтения, уровни изоляции, особенности PostgreSQL и цена `SERIALIZABLE` разобраны в [SQL → Уровни изоляции](../database/transactions.md#isolation-levels). Здесь — только то, что относится к Spring.

```java
@Service
public class ReportService {

    @Transactional(isolation = Isolation.REPEATABLE_READ) // явно задать уровень
    public Report buildMonthlyReport() { ... }

    @Transactional // isolation = Isolation.DEFAULT — уровень из настроек БД
    public void saveReport(Report report) { ... }
}
```

Вместо жёстких уровней изоляции в Enterprise чаще используют блокировки Hibernate — [оптимистичную](../database/locking.md#optimistic-locking) и [пессимистичную](../database/locking.md#pessimistic-locking).

!!! warning "Ловушка: `READ_UNCOMMITTED` в PostgreSQL"
    Spring передаст уровень в БД как есть, но Postgres не поддерживает `READ_UNCOMMITTED` и молча работает на `READ_COMMITTED`. Что именно гарантирует уровень, решает СУБД, а не Spring.

??? question "Проверь себя"
    1. Как задать уровень изоляции для метода?
    2. Что означает `Isolation.DEFAULT`?
    3. Чем в Enterprise обычно заменяют высокие уровни изоляции?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **`@Transactional`** | Прокси → `TransactionManager` → соединение из пула → `setAutoCommit(false)` → commit / rollback |
| **Rollback** | По умолчанию только на `RuntimeException` и `Error`. Для всего — `rollbackFor = Exception.class` |
| **Самовызов** | `this.method()` минует прокси → транзакция не откроется, данные сохраняются кусками. Решение: разные сервисы или `TransactionTemplate` |
| **`REQUIRED`** | 1 соединение, общая транзакция. Ошибка внутри + `catch` снаружи → `UnexpectedRollbackException` |
| **`REQUIRES_NEW`** | 2 соединения, независимые транзакции. Риск исчерпания пула |
| **`NESTED`** | 1 соединение + savepoint. Внутренняя откатывается независимо |
| **Isolation** | `@Transactional(isolation = ...)`, `DEFAULT` — уровень БД. Теория — в [SQL](../database/transactions.md#isolation-levels) |

<!-- --8<-- [end:cheatsheet] -->
