# Многопоточность (Multithreading)

## Фундамент

### 1. Потоки (Threads) и Процессы (Processes)

- **Процесс** — тяжеловесная единица (экземпляр запущенной программы). У процесса **своя изолированная память**. Если один упадёт — другие выживут.
    - _Аналогия:_ Отдельный дом. Чтобы поговорить с соседом (другим процессом), нужно орать через улицу (Socket, REST, IPC).
- **Поток** — лёгкая единица исполнения _внутри_ процесса. Все потоки одного процесса делят **общую память (Heap)**, но имеют свой **стек (Stack)**.
    - _Аналогия:_ Жильцы одной квартиры. Легко передают вещи (объекты в Heap), но могут подраться за туалет (Race Condition).

### 2. Создание: `Thread` vs `Runnable`

Почему `extends Thread` — моветон:

1. **Ограниченность наследования:** нет множественного наследования — ты теряешь возможность унаследоваться от бизнес-класса.
2. **SRP:** Поток (`Thread`) — это "рабочий" (механизм запуска). Задача (`Runnable`) — это "инструкция" (бизнес-логика). Нельзя вшивать инструкцию в рабочего.

```java
// ❌ Смешиваем инфраструктуру и логику
class BadThread extends Thread {
    @Override
    public void run() { System.out.println("Hard work..."); }
}

// ✅ Логика отдельно, запуск отдельно
Runnable task = () -> System.out.println("Clean work!");
Thread worker = new Thread(task);
worker.start();
```

### 3. Жизненный цикл потока

Состояния `Thread.State`:

1. **NEW** — создан `new Thread()`, `start()` ещё не вызван.
2. **RUNNABLE** — вызван `start()`. Поток либо выполняется на CPU, либо ждёт своей очереди в планировщике ОС.
3. **BLOCKED** — упёрся в `synchronized` и ждёт освобождения монитора.
4. **WAITING** — ждёт другого потока без лимита времени (`wait()`, `join()`).
5. **TIMED_WAITING** — ждёт с тайм-аутом (`sleep(1000)`, `wait(1000)`).
6. **TERMINATED** — `run()` завершился. Перезапустить нельзя — умер значит умер.

### 4. Базовая синхронизация: Мониторы

В Java **каждый объект** имеет встроенный замок (монитор/mutex). В один момент монитором может владеть только один поток.

```java
public class Counter {
    private int count = 0;
    private final Object lock = new Object();

    // Вариант 1: лок на this
    public synchronized void increment() {
        count++;
    }

    // Вариант 2: лок на конкретном объекте (лучше для гранулярности)
    public void incrementBlock() {
        synchronized (lock) {
            count++;
        }
    }

    // Вариант 3: лок на классе (static synchronized)
    // эквивалентно synchronized(Counter.class)
    public static synchronized void staticJob() { ... }
}
```

!!! tip "`synchronized` даёт сразу два свойства"
    **Атомарность** — никто не вмешается в середине. **Видимость** — после выхода из блока все потоки увидят актуальное значение.

### 5. `wait()` / `notify()` и Spurious Wakeup

Работают **только** внутри `synchronized` блока того же объекта.

- `wait()` — "Отпускаю монитор и иду спать, пока не разбудят".
- `notify()` — будит одного случайного из спящих.
- `notifyAll()` — будит всех, они начинают драться за монитор.

**Spurious Wakeup:** ОС может разбудить поток без вызова `notify`. Поэтому всегда используем `while`, а не `if`:

```java
public synchronized void consume() throws InterruptedException {
    // ✅ while — если проснулись ложно, цикл проверит условие снова
    while (queue.isEmpty()) {
        wait();
    }
    var data = queue.poll();
    notifyAll(); // сообщаем продюсерам, что место освободилось
}
```

### 6. `join`, `sleep`, `yield`

- **`Thread.sleep(ms)`** — пауза текущего потока. **НЕ отпускает мониторы!** Если уснул в `synchronized` — никто туда не зайдёт.
- **`thread.join()`** — "Жду, пока поток `thread` завершится". Используется, чтобы дождаться результата.
- **`Thread.yield()`** — подсказка планировщику "готов уступить CPU". Может быть проигнорирована. В реальном коде — редко.

### 7. Правильная остановка: `interrupt()`

`stop()` — **deprecated** и опасен: убивает поток "на полуслове", данные могут остаться битыми.

Правильный путь — **кооперативное завершение**:

```java
Thread worker = new Thread(() -> {
    while (!Thread.currentThread().isInterrupted()) {
        try {
            System.out.println("Working...");
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            System.out.println("Попросили выйти во сне!");
            Thread.currentThread().interrupt(); // ❗ восстанавливаем флаг — catch его сбрасывает
            break;
        }
    }
    System.out.println("Clean shutdown.");
});

worker.start();
Thread.sleep(3000);
worker.interrupt(); // "стучимся" к потоку
```

## Java Memory Model (JMM)

### 1. Три кита JMM

**Atomicity (Атомарность)** — операция либо выполнена полностью, либо не начиналась. Другие потоки не видят промежуточного состояния.

Атомарны из коробки: чтение/запись ссылок и всех примитивов, **кроме** `long` и `double` (если не `volatile`). 64-битная запись на 32-битной ОС может разбиться на два шага — другой поток прочитает "склейку" из старой и новой половины (Word Tearing).

**Visibility (Видимость)** — у каждого ядра CPU есть свой кэш (L1, L2, L3). Когда поток меняет переменную, он меняет её в кэше своего ядра. Другой поток читает старое значение из своего кэша. Без явной синхронизации JMM **не гарантирует**, когда данные доедут до другого ядра.

**Ordering (Упорядочивание/Reordering)** — компилятор и CPU вправе менять порядок инструкций, если это не ломает логику _текущего потока_ (правило _as-if-serial_). В многопоточном коде это приводит к неожиданным эффектам.

### 2. Happens-Before — твоя главная аксиома

Если событие A _happens-before_ события B, то JMM гарантирует:

1. Результат A будет **виден** для B.
2. A гарантированно **выполнится до** B (запрет переупорядочивания).

Если между записью в одном потоке и чтением в другом нет связи happens-before — у тебя **data race**.

**Ключевые правила:**

| Правило | Суть |
|---|---|
| **Program Order** | Каждое действие в потоке HB следующего в том же потоке |
| **Monitor Lock** | `unlock` HB следующего `lock` того же монитора |
| **Volatile Variable** | Запись в `volatile` HB любого последующего чтения этой переменной |
| **Thread Start** | `Thread.start()` HB любой инструкции в `run()` этого потока |
| **Thread Join** | Любая инструкция потока HB успешного выхода из `join()` |
| **Transitivity** | Если A HB B, и B HB C, то A HB C |

### 3. Анатомия `volatile`

Решает проблемы **видимости** и **упорядочивания**, но **не решает** атомарность сложных операций.

- **Видимость:** запись в `volatile` → немедленный сброс в RAM. Чтение → всегда из RAM, минуя кэш.
- **Memory Barriers:** `volatile` расставляет барьеры (StoreStore, StoreLoad, LoadLoad, LoadStore), запрещающие переупорядочивание.
- **Release/Acquire семантика:** если поток А записал `x = 5`, потом `volatile flag = true` — поток Б, увидев `flag == true`, гарантированно увидит и `x == 5`.

!!! warning "`volatile count++` — это баг"
    `count++` — это три шага: Read → Modify → Write. `volatile` гарантирует честное чтение и запись, но **не защищает** от двух потоков, одновременно прочитавших одно значение. Для атомарного инкремента — `AtomicInteger`.

### 4. Final Field Semantics (Безопасная публикация)

JMM даёт особую гарантию для `final` полей: если объект корректно создан (конструктор завершился), любой поток, получивший на него ссылку, **гарантированно увидит инициализированные значения `final` полей**.

```java
public class ImmutableConfig {
    private final Map<String, String> settings;

    public ImmutableConfig() {
        Map<String, String> temp = new HashMap<>();
        temp.put("timeout", "5000");
        this.settings = temp;
        // В конце конструктора JMM ставит StoreStore-барьер:
        // все записи внутри конструктора будут видны ВСЕМ потокам
        // ДО того, как ссылка на объект станет доступна снаружи
    }
}
```

!!! warning "Escape during construction (Утечка `this`)"
    Гарантия ломается, если ссылка на объект "утекла" до завершения конструктора — например, передал `this` в глобальный Listener или запустил поток из конструктора. Другой поток может увидеть `final` поля ещё равными `null`.

## java.util.concurrent

### 1. Locks (Блокировки)

**`ReentrantLock` vs `synchronized`:**

```java
ReentrantLock lock = new ReentrantLock();

// ✅ tryLock — не зависнешь навсегда
if (lock.tryLock(100, TimeUnit.MILLISECONDS)) {
    try {
        // критическая секция
    } finally {
        lock.unlock(); // обязателен в finally!
    }
}

// ✅ lockInterruptibly — можно прервать ожидание
lock.lockInterruptibly();
```

| Возможность | `synchronized` | `ReentrantLock` |
|---|---|---|
| Попытка захвата без зависания | ❌ | ✅ `tryLock()` |
| Прерываемое ожидание | ❌ | ✅ `lockInterruptibly()` |
| Честная очередь (fairness) | ❌ | ✅ `new ReentrantLock(true)` |
| Несколько Condition | ❌ | ✅ `lock.newCondition()` |
| Автоматическое освобождение | ✅ | ❌ (нужен `finally`) |

**`ReadWriteLock`** — для кэшей: тысячи читателей одновременно, но при записи все ждут.

**`StampedLock`** (Java 8) — добавляет **оптимистичное чтение**: читаешь без блокировки, получаешь `stamp`, потом проверяешь "данные не изменились?". Если нет — сэкономили время. Если да — перечитываем с обычной блокировкой.

**`Condition`** — замена `wait/notify`. Для одного лока можно создать несколько независимых очередей ожидания:

```java
ReentrantLock lock = new ReentrantLock();
Condition notEmpty = lock.newCondition(); // будим потребителей
Condition notFull  = lock.newCondition(); // будим производителей

// При добавлении элемента:
notEmpty.signal(); // только потребителей, не всех подряд

// При извлечении:
notFull.signal();  // только производителей
```

### 2. Atomics (Атомарные переменные)

Работают без блокировок (lock-free) через **CAS** (Compare-And-Swap — атомарная инструкция процессора `cmpxchg`): "обнови значение на X, но только если текущее == Y".

```java
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();              // атомарный ++
counter.compareAndSet(expected, update); // CAS напрямую

AtomicReference<Node> head = new AtomicReference<>();
head.compareAndSet(oldHead, newHead);   // lock-free структуры данных
```

**`LongAdder` vs `AtomicLong` — почему LongAdder рвёт под нагрузкой:**

При 100 потоках, бьющих в один `AtomicInteger`, 99 промахнутся в CAS и уйдут на новый круг (spin-wait), сжигая CPU. `LongAdder` держит массив ячеек — потоки хешируются и обновляют разные ячейки, не мешая друг другу. `sum()` просто складывает ячейки.

!!! tip "Must-have для метрик"
    `LongAdder` — обязательный выбор для высоконагруженных счётчиков (метрики, статистика). `AtomicLong` — когда нужен точный CAS (`compareAndSet`) или `get()` с мгновенной точностью.

### 3. Concurrent Collections

Разобраны в разделе [Коллекции → Потокобезопасные коллекции](collections.md#_6). Краткая шпаргалка:

| Коллекция | Когда использовать |
|---|---|
| `ConcurrentHashMap` | Кэш, любое хранилище в многопоточной среде |
| `CopyOnWriteArrayList` | Список слушателей — читаем постоянно, пишем редко |
| `ArrayBlockingQueue` | Ограниченная очередь задач, жёсткий лимит |
| `LinkedBlockingQueue` | Очередь задач с высокой пропускной способностью |
| `SynchronousQueue` | Передача "из рук в руки" без буфера |

### 4. Synchronizers (Синхронизаторы)

**`CountDownLatch` — "Защёлка" (одноразовый)**

Главный поток ждёт, пока `N` других не выполнят работу.

```java
CountDownLatch latch = new CountDownLatch(3);

// В каждом из 3 потоков:
latch.countDown(); // уменьшает счётчик

// В главном потоке:
latch.await(); // блокируется, пока счётчик не станет 0
```

_Пример:_ Отправили запросы в 3 микросервиса, дождались всех, собрали финальный ответ.

**`CyclicBarrier` — "Шлагбаум" (многоразовый)**

N потоков делают расчёт по этапам. Кто дошёл до точки — ждёт остальных. Когда все пришли — идут дальше вместе.

```java
CyclicBarrier barrier = new CyclicBarrier(5, () -> {
    System.out.println("Все пришли, переходим к следующему этапу!");
});

// В каждом из 5 потоков:
barrier.await(); // ждём остальных
```

**`Semaphore` — "Парковка"**

Ограничивает количество потоков, работающих с ресурсом одновременно.

```java
Semaphore semaphore = new Semaphore(5); // 5 "пропусков"

semaphore.acquire(); // взять пропуск (блокируется если все заняты)
try {
    callExternalApi();
} finally {
    semaphore.release(); // вернуть пропуск
}
```

_Идеально для rate limiting_ — ограничить одновременные запросы к внешнему API.

**`Phaser` — "Комбайн"**

Смесь Latch и Barrier на максималках. Динамически регистрирует и удаляет участников в процессе работы. Очень гибкий, но сложный.

## Управление потоками (Executors)

### Почему не делаем `new Thread()` вручную?

1. **Дорого:** создание системного потока (Java-поток → поток ОС) — тяжёлый системный вызов с выделением памяти под стек.
2. **Риск OOM:** 1000 запросов → 1000 потоков → `OutOfMemoryError: unable to create new native thread`.
3. **Нет контроля:** как собрать результаты? как отменить? как ограничить количество?

Решение — **пулы потоков**: переиспользуем потоки, управляем жизненным циклом.

### 1. Иерархия интерфейсов

- **`Executor`** — базовый: `execute(Runnable)`. Просто "выполни где-нибудь".
- **`ExecutorService`** — рабочий инструмент: управление жизненным циклом (`shutdown`, `shutdownNow`), возврат результата через `submit(Callable)` → `Future`.
- **`ScheduledExecutorService`** — выполнение с задержкой или периодически (замена устаревшему `Timer`).

### 2. ThreadPoolExecutor — сердце управления потоками

Четыре главных параметра конструктора:

- **`corePoolSize`** — базовое число потоков, живут всегда (даже без задач).
- **`maxPoolSize`** — максимум потоков при пиковой нагрузке.
- **`keepAliveTime`** — время простоя "лишних" потоков (сверх core) до удаления.
- **`workQueue`** — очередь задач, когда все потоки заняты.

!!! warning "Золотое правило пула — алгоритм принятия решений"
    Порядок строго такой, тут часто путаются:

    1. Потоков меньше `corePoolSize` → **создать новый поток**.
    2. `corePoolSize` заполнен → **положить в очередь**.
    3. Очередь **заполнена** → **создать поток до `maxPoolSize`**.
    4. `maxPoolSize` достигнут, очередь полна → **Rejection Policy**.

    Важно: новые потоки сверх core создаются только когда **и** очередь заполнена!

**Rejection Policies:**

| Политика | Поведение | Когда применять |
|---|---|---|
| `AbortPolicy` | Бросает `RejectedExecutionException` | По умолчанию, когда важно не терять задачи |
| `CallerRunsPolicy` | Вызывающий поток сам выполняет задачу | ⭐ Продакшн — создаёт естественный Backpressure |
| `DiscardPolicy` | Молча выбрасывает новую задачу | Некритичные логи, метрики |
| `DiscardOldestPolicy` | Выбрасывает самую старую задачу | Редко |

`CallerRunsPolicy` — любимая политика для продакшена. Пока главный поток сам обрабатывает задачу, он не может принимать новые запросы — пул получает время разгрести завал. Это **Backpressure**.

### 3. Готовые пулы — фабрика `Executors`

!!! warning "Мины в продакшене"
    Стандартные фабрики удобны, но каждая содержит архитектурную мину.

**`Executors.newFixedThreadPool(n)`**

Под капотом: `core == max == n`, `LinkedBlockingQueue` — **безлимитная** очередь.

При наплыве задач очередь бесконечно растёт → `OutOfMemoryError: Java heap space`.

Когда юзать: нагрузка предсказуема, количество потоков строго ограничено ресурсами CPU.

**`Executors.newCachedThreadPool()`**

Под капотом: `core = 0`, `max = Integer.MAX_VALUE`, `SynchronousQueue` (ёмкость 0 — сразу передаёт потоку).

При DDoS-атаке создаёт поток на каждую задачу → `OutOfMemoryError: unable to create new native thread`.

Когда юзать: много коротких лёгких асинхронных задач.

**`Executors.newSingleThreadExecutor()`**

Под капотом: `core = max = 1`, `LinkedBlockingQueue`.

Гарантирует строго последовательное выполнение. Если поток умрёт — пул создаст замену.

!!! tip "Вопрос с подвохом"
    Чем отличается от `newFixedThreadPool(1)`?

    `newFixedThreadPool(1)` возвращает обычный `ThreadPoolExecutor` — его можно привести к типу и перенастроить (например, `.setMaximumPoolSize(10)`). `newSingleThreadExecutor()` оборачивает пул в **неизменяемый wrapper** — изменить размер в процессе работы невозможно.

### 4. ForkJoinPool (FJP)

Особый вид пула для алгоритмов "Разделяй и властвуй" (рекурсивные задачи). Работает под капотом `parallelStream()` и `CompletableFuture` (по умолчанию).

В обычном пуле — одна общая очередь, все толкаются. В FJP у **каждого** потока **своя очередь (Deque)**.

**Work Stealing (Кража работы):** Если поток выполнил все свои задачи — он идёт к загруженному соседу и "ворует" задачу с **хвоста** его очереди. Хозяин берёт с головы — конфликтов нет, синхронизация минимальна, CPU загружен максимально.

## Асинхронность и Future

### 1. `Future` — в чём боль?

`Future` появился в Java 5. Отправляешь задачу в пул, получаешь "обещание" результата. Но он глухой и немой:

```java
Future<String> future = executor.submit(() -> fetchData());

// Два варианта — оба плохие:
while (!future.isDone()) { ... } // сжигаем CPU в опросном цикле
String result = future.get();    // БЛОКИРУЕМ текущий поток — вся суть асинхронности теряется
```

### 2. `CompletableFuture` — функциональный конвейер

Java 8. Строим цепочки задач, передающих данные асинхронно — главный поток не блокируется.

**Запуск:**

```java
// ❗ Всегда передавай свой Executor!
// По умолчанию CF использует ForkJoinPool.commonPool() — его легко забить тяжёлыми задачами

CompletableFuture<Void> noResult = CompletableFuture
    .runAsync(() -> sendEmail(), executor);           // void

CompletableFuture<String> withResult = CompletableFuture
    .supplyAsync(() -> fetchData(), executor);        // возвращает результат
```

**Трансформация результата:**

```java
// thenApply — как map() в стримах. Один к одному, в том же потоке
CompletableFuture<Integer> length = CompletableFuture
    .supplyAsync(() -> "Hello", executor)
    .thenApply(String::length);       // String → Integer

// thenCompose — как flatMap(). Когда следующий шаг тоже возвращает CF
CompletableFuture<Document> doc = CompletableFuture
    .supplyAsync(() -> fetchDocumentId(), executor)       // → Long
    .thenCompose(id -> loadDocument(id, executor));       // Long → CF<Document>
    // без thenCompose получили бы CF<CF<Document>>
```

**Слияние независимых задач (`thenCombine`):**

```java
// Параллельно парсим таблицы и картинки из файла
CompletableFuture<List<Table>> tables = CompletableFuture
    .supplyAsync(() -> parseTables(file), executor);
CompletableFuture<List<Image>> images = CompletableFuture
    .supplyAsync(() -> parseImages(file), executor);

// Ждём обоих, склеиваем результат — без блокировки главного потока
CompletableFuture<Document> result = tables.thenCombine(images,
    (t, i) -> new Document(t, i)
);
```

**Обработка ошибок:**

```java
CompletableFuture<List<Image>> images = CompletableFuture
    .supplyAsync(() -> parseImages(file), executor)

    // exceptionally — как catch: ловит ошибку, возвращает фоллбэк
    .exceptionally(ex -> {
        log.error("Не удалось распарсить картинки: ", ex);
        return Collections.emptyList(); // вместо падения — пустой список
    })

    // handle — как finally + catch: вызывается В ЛЮБОМ СЛУЧАЕ
    // удобно для закрытия ресурсов и записи статуса
    .handle((result, ex) -> {
        if (ex != null) {
            log.error("Ошибка:", ex);
            return Collections.emptyList();
        }
        return result;
    });
```

**Ожидание нескольких CF:**

```java
// Ждём ВСЕ завершатся
CompletableFuture.allOf(cf1, cf2, cf3).join();

// Возвращает результат ПЕРВОГО завершившегося
CompletableFuture.anyOf(cf1, cf2, cf3).thenAccept(result -> ...);
```

## Deep Dive — Under the Hood

### 1. CAS и Проблема ABA

**CAS (Compare-And-Swap)** — неделимая инструкция процессора (`cmpxchg` в x86). За один такт: читает → сравнивает с ожидаемым → если совпало, записывает новое. Никаких блокировок ОС.

**Проблема ABA:**

1. Поток 1 читает значение `A`, вытесняется планировщиком.
2. Поток 2 меняет `A → B`.
3. Поток 3 меняет `B → A`.
4. Поток 1 просыпается, видит `A` — совпало! — делает CAS. Но логически состояние уже другое.

**Решение:** `AtomicStampedReference` — к значению добавляется счётчик-версия. CAS проверяет и значение, и версию.

### 2. AQS (AbstractQueuedSynchronizer)

Абсолютное ядро пакета `java.util.concurrent`. На нём построены `ReentrantLock`, `CountDownLatch`, `Semaphore`, `ReadWriteLock`.

- Хранит `volatile int state` (состояние: количество разрешений, статус лока и т.п.).
- Держит FIFO-очередь ожидания потоков (двусвязный список нод).
- Если поток не смог получить доступ (CAS не прошёл) — AQS **сам паркует** его и ставит в очередь. Когда ресурс освобождается — **сам будит** следующего.

### 3. `LockSupport.park()` / `unpark()`

Низкоуровневые примитивы, на которых работает AQS. Не нужен `synchronized`.

У каждого потока есть один "пермит": `park()` блокирует если пермита нет; `unpark(thread)` выдаёт пермит.

!!! tip "Ключевое отличие от `wait/notify`"
    Если сделать `unpark()` **до** вызова `park()` — поток не заблокируется вообще. С `wait/notify` такой трюк приводит к вечному зависанию.

### 4. False Sharing (Ложное разделение)

Процессор читает память **кэш-линиями** по 64 байта. Если две независимые `volatile` переменные оказались в одной кэш-линии, и два потока на разных ядрах их постоянно обновляют — ядра непрерывно инвалидируют кэш друг друга. Производительность падает на ровном месте.

**Решение:** аннотация `@Contended` (или "паддинг" — добивка пустыми полями). Заставляет JVM разнести переменные по разным кэш-линиям. Именно так устроен `LongAdder` под капотом.

```java
// Добавить JVM-флаг: -XX:-RestrictContended
@sun.misc.Contended
private volatile long value;
```

## Project Loom (Java 21+)

### Virtual Threads vs Platform Threads

| | **Platform (OS) Threads** | **Virtual Threads** |
|---|---|---|
| **Управление** | ОС | JVM |
| **Стек** | ~1-2 МБ в памяти ОС | В Java Heap как обычный объект |
| **Максимум** | ~тысячи | **Миллионы** |
| **Создание** | `new Thread(task)` | `Thread.ofVirtual().start(task)` |

### Carrier Threads и монтирование

Виртуальные потоки выполняются на небольшом пуле обычных потоков-носителей (Carrier Threads, по умолчанию ForkJoinPool).

1. Виртуальный поток **монтируется** на Carrier — выполняется на CPU.
2. Встречает блокирующую I/O (ждёт БД, сеть) — **размонтируется**, стек сохраняется в Heap.
3. Carrier-поток свободен — берёт другой виртуальный поток.
4. Когда I/O готово — виртуальный поток монтируется снова.

Никто не простаивает. Можно держать тысячи открытых соединений к БД без тысяч реальных потоков.

### Pinning (Прикалывание) — ахиллесова пята

Если виртуальный поток вызывает блокирующую операцию внутри `synchronized` или native-метода JNI — он **не может** размонтироваться. Он "прикалывает" (pins) Carrier-поток к себе.

Если таких потоков будет много — пул Carrier-потоков исчерпается, приложение зависнет.

!!! warning "Золотое правило Loom"
    Заменяй `synchronized` на `ReentrantLock`. С `ReentrantLock` виртуальные потоки корректно размонтируются при ожидании блокировки.

### Structured Concurrency (Preview, Java 21+)

Управление подзадачами как единым блоком — по аналогии с обычным `try-catch`:

```java
try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Future<String> user  = scope.fork(() -> fetchUser(id));
    Future<Order>  order = scope.fork(() -> fetchOrder(id));

    scope.join();           // ждём обоих
    scope.throwIfFailed();  // если один упал — бросаем исключение

    return new Response(user.resultNow(), order.resultNow());
} // при выходе из блока — все незавершённые подзадачи автоматически отменяются
```

Если один fork падает с ошибкой — второй автоматически отменяется. Никаких утечек потоков. Код становится линейным и предсказуемым.