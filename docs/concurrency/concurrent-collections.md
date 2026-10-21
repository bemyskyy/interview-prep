---
tags:
  - Java
  - Многопоточность
---

# Потокобезопасные коллекции

Коллекции для многопоточного кода: почему устарели `Hashtable` и `Vector`, как `ConcurrentHashMap` обходится почти без блокировок, когда брать `CopyOnWriteArrayList` и какие очереди из `java.util.concurrent` брать для передачи задач между потоками. Чаще всего спрашивают устройство `ConcurrentHashMap` и почему она не принимает `null`.

## Потокобезопасные Map и List { #concurrent-collections }

### Чем плохи `Hashtable` и `Vector`? { #hashtable-vector }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Это классы из Java 1.0, которые вешают `synchronized` на каждый метод целиком. Пока один поток пишет, ждут все остальные, даже читатели. Для многопоточного кода есть `ConcurrentHashMap` и другие коллекции из `java.util.concurrent`.

На вопрос _"Как сделать `Map` потокобезопасной?"_ ответ _"Использовать `Hashtable`"_ — красный флаг.

- **Проблема:** эти классы из Java 1.0 вешают `synchronized` **на все методы целиком** (whole-object locking).
- **Удар по производительности:** если поток 1 делает `put()`, он блокирует ВСЮ таблицу. Потоки 2, 3, 100 хотят просто прочитать (`get()`), но вынуждены ждать. На многоядерных машинах это узкое место.

```java
Map<String, Integer> counters = Collections.synchronizedMap(new HashMap<>());

// ❌ Каждый метод синхронизирован, но пара вызовов — нет:
// два потока могут одновременно увидеть «ключа нет»
if (!counters.containsKey("visits")) {
    counters.put("visits", 0);
}

// ✅ Проверка и вставка — одна атомарная операция
ConcurrentMap<String, Integer> safe = new ConcurrentHashMap<>();
safe.putIfAbsent("visits", 0);
```

!!! warning "Ловушка: синхронизированные методы ≠ атомарный сценарий"
    `Hashtable`, `Vector` и `Collections.synchronizedXxx()` защищают каждый вызов по отдельности. Последовательность «проверил → записал» между вызовами не защищена. Для таких сценариев есть атомарные методы `putIfAbsent()`, `computeIfAbsent()`, `merge()`.

??? question "Проверь себя"
    1. Почему `Hashtable` медленно работает под нагрузкой?
    2. Чем опасен код `if (!map.containsKey(k)) map.put(k, v)` даже на синхронизированной мапе?
    3. Какой метод делает «вставить, если нет» атомарно?

### Как `ConcurrentHashMap` обходится почти без блокировок? { #concurrenthashmap }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    В Java 8+ чтение идёт без блокировок через volatile-чтения. Вставка в пустой бакет делается через CAS, а в занятый — под `synchronized` только на первом узле этого бакета. Поэтому потоки, которые пишут в разные бакеты, не мешают друг другу.

`ConcurrentHashMap` (CHM) позволяет сотням потоков одновременно читать и писать, почти не блокируя друг друга.

**Эволюция CHM:**

- **Java 7 — lock striping:** мапу делили на 16 **сегментов**, у каждого свой замок. 16 потоков могли одновременно писать в разные сегменты, чтение шло без блокировок.
- **Java 8+ — CAS + блокировка бакета:**
    - Сегменты убрали — они занимали лишнюю память.
    - Если бакет **пустой** — вставка через **CAS (compare-and-swap)**, атомарную инструкцию процессора, без `synchronized`.
    - Если бакет **занят** — `synchronized` вешается **только на первый узел этого бакета**. Остальные бакеты остаются свободными.

```java
// Атомарно создать счётчик, если его нет, и увеличить
ConcurrentMap<String, LongAdder> hits = new ConcurrentHashMap<>();
hits.computeIfAbsent("/api/users", k -> new LongAdder()).increment();

// Атомарный инкремент без ручных проверок
ConcurrentMap<String, Integer> counts = new ConcurrentHashMap<>();
counts.merge("/api/users", 1, Integer::sum);
```

!!! tip "Итог"
    `ConcurrentHashMap` — выбор по умолчанию для любого кэша или хранилища в многопоточной среде.

!!! warning "Ловушка: `null` запрещён"
    `put(key, null)` и `put(null, value)` бросают `NullPointerException`. В многопоточной мапе `get(key) == null` должно однозначно значить «ключа нет»: между `get()` и `containsKey()` другой поток мог бы всё изменить.

!!! warning "Ловушка: не меняй мапу внутри `computeIfAbsent()`"
    Функция в `computeIfAbsent()` и `compute()` выполняется под блокировкой бакета и должна быть короткой. Если внутри неё изменить ту же мапу, можно получить `IllegalStateException: Recursive update`.

??? question "Проверь себя"
    1. Как CHM в Java 8 вставляет элемент в пустой и в занятый бакет?
    2. Чем подход Java 8 отличается от сегментов в Java 7?
    3. Почему `ConcurrentHashMap` не принимает `null`?

### Когда нужен `CopyOnWriteArrayList`? { #copyonwritearraylist }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Когда читают постоянно, а пишут редко. Чтение идёт без блокировок, а каждая запись копирует весь массив и атомарно подменяет ссылку на него. Поэтому итераторы работают со снимком и никогда не бросают CME.

Чем плох `Collections.synchronizedList()` — те же затраты на `synchronized`, что и у `Vector`. `CopyOnWriteArrayList` (COWAL) решает задачу иначе:

- **Чтение** (`get`, `iterator`) — без блокировок.
- **Запись** (`add`, `remove`) — три шага:
    1. Создаётся **точная копия** всего массива.
    2. Новый элемент добавляется в копию.
    3. Ссылка атомарно переключается на новый массив. Старый уходит в GC.

```java
List<Listener> listeners = new CopyOnWriteArrayList<>();
listeners.add(event -> System.out.println("got " + event)); // подписка при старте — редкая запись

for (Listener l : listeners) {   // частые обходы без блокировок
    l.onEvent("order-created");  // итератор видит снимок: add() во время обхода не бросит CME
}
```

!!! warning "Когда применять"
    Копирование массива при каждой записи — **очень дорого**. Идеальный сценарий: **read-heavy, write-rare** (читаем постоянно, пишем крайне редко). Пример: список event listeners — подписались при старте, потом миллионы раз перебираем их для отправки уведомлений.

??? question "Проверь себя"
    1. Что происходит при записи в `CopyOnWriteArrayList`?
    2. Почему итератор `CopyOnWriteArrayList` не бросает CME?
    3. В каком сценарии `CopyOnWriteArrayList` — плохой выбор?

## Блокирующие очереди { #blocking-queues }

`BlockingQueue` блокирует поток, который берёт элемент из пустой очереди или кладёт в полную. На ней строят producer-consumer и очереди задач пулов потоков ([`ThreadPoolExecutor`](executors.md#thread-pool-executor)).

| Очередь | Когда использовать |
|---|---|
| `ArrayBlockingQueue` | Ограниченная очередь задач, жёсткий лимит |
| `LinkedBlockingQueue` | Очередь задач с высокой пропускной способностью |
| `SynchronousQueue` | Передача «из рук в руки» без буфера |

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **`Hashtable` / `Vector`** | `synchronized` на всё; составные операции не атомарны |
| **`ConcurrentHashMap`** | CAS в пустой бакет, `synchronized` на первом узле; без `null`; `merge` / `computeIfAbsent` |
| **`CopyOnWriteArrayList`** | Копия массива на каждую запись; read-heavy, write-rare |
| **`BlockingQueue`** | `ArrayBlockingQueue` — ограниченная, `LinkedBlockingQueue` — для пропускной способности, `SynchronousQueue` — без буфера |

<!-- --8<-- [end:cheatsheet] -->
