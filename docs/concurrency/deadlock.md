---
tags:
  - Middle
  - Java
  - Многопоточность
---

# Deadlock, livelock, starvation

Три проблемы живости (liveness): потоки есть, а работа не двигается. На собесе просят объяснить разницу, написать дедлок с нуля, найти его в thread dump и назвать два способа избежать.

## Deadlock, livelock, starvation { #liveness }

### Что такое deadlock и как он возникает? { #deadlock }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Взаимная блокировка (deadlock) — это когда потоки навсегда заблокированы, ожидая друг друга: каждый держит один лок и ждёт лок, который держит другой. Классика — два потока берут те же два лока в разном порядке. Сама JVM дедлок не предотвращает и не разрывает: потоки висят, пока жив процесс.

=== "Подробно"

    Дедлок возможен, только когда одновременно выполнены четыре условия Коффмана (Coffman conditions):

    1. **Взаимное исключение (mutual exclusion)** — ресурсом владеет один поток.
    2. **Удержание и ожидание (hold and wait)** — поток держит один лок и ждёт другой.
    3. **Нет вытеснения (no preemption)** — отнять лок у потока нельзя, он отпускает его сам.
    4. **Циклическое ожидание (circular wait)** — потоки ждут друг друга по кругу.

    Сломай любое из условий — и дедлока не будет. На практике ломают циклическое ожидание (порядок захвата) или удержание с ожиданием (`tryLock` с таймаутом), см. [как избежать](#deadlock-prevention).

    Пример: перевод между счетами. Каждый `transfer` блокирует сначала счёт-источник, потом счёт-получатель. Если один поток переводит A → B, а другой B → A, они берут те же мониторы в противоположном порядке:

    ```java linenums="1"
    public class Deadlock {

        static class Account {
            private final String id;
            private long balance;

            Account(String id, long balance) {
                this.id = id;
                this.balance = balance;
            }
        }

        // ❌ Порядок захвата зависит от аргументов: transfer(a, b) и transfer(b, a)
        //    берут те же мониторы в противоположном порядке
        static void transfer(Account from, Account to, long amount) throws InterruptedException {
            synchronized (from) {
                Thread.sleep(100); // окно, в которое второй поток успевает взять свой первый лок
                synchronized (to) {
                    from.balance -= amount;
                    to.balance += amount;
                }
            }
        }

        public static void main(String[] args) {
            var a = new Account("A", 1_000);
            var b = new Account("B", 1_000);

            Thread.ofPlatform().name("transfer-A-to-B").start(() -> run(a, b));
            Thread.ofPlatform().name("transfer-B-to-A").start(() -> run(b, a));
        }

        private static void run(Account from, Account to) {
            try {
                transfer(from, to, 100);
                System.out.println(Thread.currentThread().getName() + ": done");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
    ```

    Запусти `java Deadlock.java` на JDK 25 — программа ничего не напечатает и не завершится. `sleep(100)` нужен только чтобы дедлок воспроизводился каждый раз: без него потоки тоже могут сцепиться, но редко и непредсказуемо.

    ```mermaid
    flowchart LR
        T1["transfer-A-to-B"] -- держит --> A(("счёт A"))
        T1 -. ждёт .-> B(("счёт B"))
        T2["transfer-B-to-A"] -- держит --> B
        T2 -. ждёт .-> A
    ```

!!! warning "Ловушка: «у меня один лок на метод — дедлока не будет»"
    Дедлок не обязан быть в одном методе. Если под локом ты вызываешь чужой код — колбэк, слушатель, метод другого `synchronized`-объекта, — тот может взять свой лок, и порядок захвата уже неявный. Правило: под локом не вызывай код, который ты не контролируешь (open call — вызов без удержания лока).

!!! warning "Ловушка: дедлок на `synchronized` не прервать"
    Поток в состоянии BLOCKED на входе в `synchronized` не реагирует на `interrupt()` и не имеет таймаута. Спасает только рестарт процесса. У `ReentrantLock` есть `lockInterruptibly()` и `tryLock(timeout, unit)`, у `synchronized` таких выходов нет.

??? question "Проверь себя"
    1. Назови четыре условия Коффмана. Какое из них ломает фиксированный порядок захвата локов?
    2. Почему в примере дедлок воспроизводится каждый раз, а без `Thread.sleep(100)` — нет?
    3. Как можно получить дедлок, если в каждом методе ровно один `synchronized`?

### Как найти дедлок в работающем приложении? { #deadlock-detection }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Снять thread dump: `jcmd <pid> Thread.print`, `jstack <pid>` или `kill -3 <pid>`. HotSpot сам ищет циклы ожидания по `synchronized` и локам из `java.util.concurrent` и печатает в конце дампа блок `Found one Java-level deadlock` с участниками и стеками. Из кода то же делает `ThreadMXBean.findDeadlockedThreads()`.

=== "Подробно"

    Сначала узнай pid: `jps -l` или `jcmd` без аргументов. Потом сними дамп одним из способов:

    ```bash
    jcmd <pid> Thread.print       # рекомендуемый способ; -l добавит локи java.util.concurrent
    jstack <pid>                  # то же; -l — «long listing» с информацией о локах; утилита экспериментальная
    kill -3 <pid>                 # SIGQUIT: дамп уходит в stdout самого процесса, а не в твой терминал
    ```

    Вывод `jstack` для примера выше (JDK 25, сокращено). Сначала в общем списке потоков:

    ```text
    "transfer-A-to-B" #23 [705] prio=5 os_prio=0 cpu=0.62ms elapsed=3.19s tid=0x00007fe16c1318e0 nid=705 waiting for monitor entry  [0x00007fe14cb34000]
       java.lang.Thread.State: BLOCKED (on object monitor)
    	at Deadlock.transfer(Deadlock.java:19)
    	- waiting to lock <0x000000073781f3e0> (a Deadlock$Account)
    	- locked <0x000000073781f398> (a Deadlock$Account)
    	at Deadlock.run(Deadlock.java:35)
    	...

    "transfer-B-to-A" #24 [706] prio=5 os_prio=0 cpu=0.67ms elapsed=3.19s tid=0x00007fe16c132d80 nid=706 waiting for monitor entry  [0x00007fe14ca34000]
       java.lang.Thread.State: BLOCKED (on object monitor)
    	at Deadlock.transfer(Deadlock.java:19)
    	- waiting to lock <0x000000073781f398> (a Deadlock$Account)
    	- locked <0x000000073781f3e0> (a Deadlock$Account)
    	at Deadlock.run(Deadlock.java:35)
    	...
    ```

    Затем, в самом конце дампа, — результат поиска дедлоков:

    ```text
    Found one Java-level deadlock:
    =============================
    "transfer-A-to-B":
      waiting to lock monitor 0x00007fe108002090 (object 0x000000073781f3e0, a Deadlock$Account),
      which is held by "transfer-B-to-A"

    "transfer-B-to-A":
      waiting to lock monitor 0x00007fe0fc000f20 (object 0x000000073781f398, a Deadlock$Account),
      which is held by "transfer-A-to-B"

    Java stack information for the threads listed above:
    ===================================================
    ...

    Found 1 deadlock.
    ```

    Как это читать:

    - **`BLOCKED (on object monitor)`** и **`waiting for monitor entry`** — поток стоит на входе в `synchronized`.
    - **`- locked <0x...398>`** — монитор, которым поток уже владеет; **`- waiting to lock <0x...3e0>`** — монитор, которого он ждёт. У второго потока адреса зеркальные — это и есть цикл.
    - **`Deadlock.java:19`** — первая строка внутри вложенного `synchronized (to)`: поток застрял на входе в этот блок.
    - **`Found one Java-level deadlock`** — HotSpot сам нашёл цикл и назвал, кто чей лок держит. `jcmd <pid> Thread.print` даёт тот же вывод.

    С `ReentrantLock` вместо `synchronized` дедлок тоже находится, но выглядит иначе: поток в состоянии `WAITING (parking)`, в стеке `- parking to wait for <0x...> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)`, а в блоке дедлока — `waiting for ownable synchronizer ..., which is held by "t2"`. Чтобы увидеть, кто держит такой лок, добавь `-l`: у каждого потока появится секция `Locked ownable synchronizers`.

    Из кода дедлок ищет `ThreadMXBean` — так делают watchdog-потоки и health-check'и:

    ```java
    var mx = ManagementFactory.getThreadMXBean();
    long[] ids = mx.findDeadlockedThreads(); // null, если дедлока нет
    if (ids != null) {
        for (var info : mx.getThreadInfo(ids, true, true)) {
            System.out.print(info); // имя потока, лок, которого ждёт, и его владелец
        }
    }
    ```

!!! warning "Ловушка: виртуальные потоки не видны `jstack` и `ThreadMXBean`"
    `jstack` и `jcmd Thread.print` показывают только платформенные потоки, а `findDeadlockedThreads()` по документации не находит циклы с участием виртуальных потоков. Для них снимай `jcmd <pid> Thread.dump_to_file -format=json <file>` (или `plain`): в JDK 25 там видно `BLOCKED`, `locked` и `waiting to lock`, но строки `Found one Java-level deadlock` нет — цикл ищешь глазами.

!!! warning "Ловушка: дедлока не нашлось, а приложение висит"
    `Found 1 deadlock` бывает только при цикле ожидания локов. Если поток навсегда завис в `wait()`, `await()` на защёлке или в `get()` у `Future`, которую никто не завершит, — HotSpot об этом не скажет. Ищи потоки в `WAITING` и смотри в стеке, чего они ждут.

??? question "Проверь себя"
    1. Какими тремя способами можно снять thread dump и куда уходит вывод `kill -3`?
    2. По каким строкам дампа видно, что два потока ждут друг друга?
    3. Почему дедлок между виртуальными потоками не покажет `jstack`, и что использовать вместо него?

### Как избежать дедлока? { #deadlock-prevention }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Главный способ — глобальный порядок захвата: все потоки берут локи в одном порядке, например по возрастанию id, и цикл ожидания не может возникнуть. Второй — `tryLock` с таймаутом: не взял второй лок — отпусти первый и попробуй позже. Плюс общие правила: держи лок как можно меньше и не вызывай под ним чужой код.

=== "Подробно"

    **Способ 1: порядок захвата локов.** Ломает циклическое ожидание. Ключ порядка должен быть уникальным и неизменяемым:

    ```java
    static class Account {
        final long id;     // уникальный и неизменяемый — по нему задаём порядок
        long balance;

        Account(long id) {
            this.id = id;
        }
    }

    // ✅ Мониторы всегда берутся в порядке возрастания id,
    //    какой бы стороной перевода ни был счёт
    static void transfer(Account from, Account to, long amount) {
        Account first  = from.id < to.id ? from : to;
        Account second = from.id < to.id ? to : from;
        synchronized (first) {
            synchronized (second) {
                from.balance -= amount;
                to.balance += amount;
            }
        }
    }
    ```

    Два потока по миллиону встречных переводов `a → b` и `b → a` на JDK 25 завершаются за доли секунды, сумма на счетах сохраняется.

    **Способ 2: `tryLock` с таймаутом.** Ломает «удержание и ожидание»: поток не держит первый лок бесконечно, пока ждёт второй:

    ```java
    static class Account {
        final ReentrantLock lock = new ReentrantLock();
        long balance;
    }

    // ✅ Не ждём второй лок вечно: не взяли за таймаут — отпускаем первый и пробуем заново
    static boolean transfer(Account from, Account to, long amount, long timeoutMs)
            throws InterruptedException {
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(timeoutMs);
        while (true) {
            if (from.lock.tryLock(10, TimeUnit.MILLISECONDS)) {
                try {
                    if (to.lock.tryLock(10, TimeUnit.MILLISECONDS)) {
                        try {
                            from.balance -= amount;
                            to.balance += amount;
                            return true;
                        } finally {
                            to.lock.unlock();
                        }
                    }
                } finally {
                    from.lock.unlock(); // отпускаем первый лок, даже если второй не взяли
                }
            }
            if (System.nanoTime() > deadline) {
                return false; // сдаёмся — вызывающий решает: повторить, вернуть ошибку
            }
            // случайная пауза, чтобы потоки не повторяли попытки в такт (livelock)
            Thread.sleep(ThreadLocalRandom.current().nextLong(1, 5));
        }
    }
    ```

    `tryLock` без порядка захвата выбирают, когда порядок задать нельзя: локи приходят из разных модулей или их набор известен только в рантайме. Цена — повторные попытки и ветка «не получилось», которую надо обработать.

    Общие правила, которые снижают шанс дедлока:

    - **Меньше локов.** Один лок на всё состояние вместо двух — нет порядка, который можно нарушить.
    - **Короткие критические секции.** Под локом — только работа с общим состоянием, без I/O и сетевых вызовов.
    - **Open calls.** Чужой код (колбэки, слушатели) вызывай после выхода из `synchronized`.
    - **Готовые примитивы.** `ConcurrentHashMap`, очереди и `Atomic*` прячут локи внутри и не дают взять их в неправильном порядке.

!!! warning "Ловушка: `System.identityHashCode` как ключ порядка"
    Если у объектов нет id, порядок часто строят по `System.identityHashCode()`. Но хэши двух разных объектов могут совпасть — тогда порядок снова зависит от аргументов. При равенстве хэшей бери третий, общий для всех лок-«рефери» (tie-breaking lock) и захватывай оба лока под ним.

!!! warning "Ловушка: `tryLock()` без аргументов игнорирует fairness"
    По документации `ReentrantLock` нетаймаутный `tryLock()` захватывает свободный лок, даже если в очереди уже ждут другие потоки, — настройка fairness на него не действует. `tryLock(timeout, unit)` у честного лока её соблюдает.

??? question "Проверь себя"
    1. Какое условие Коффмана ломает порядок захвата, а какое — `tryLock` с таймаутом?
    2. Почему в варианте с `tryLock` первый лок отпускается в `finally`, а не только при успехе?
    3. Зачем случайная пауза между попытками и что будет без неё?

### Чем livelock и starvation отличаются от deadlock? { #livelock-starvation }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    При livelock потоки не заблокированы и жгут CPU, но прогресса нет: они постоянно уступают друг другу, как двое в коридоре, шагающие в одну сторону. При голодании (starvation) система в целом работает, но конкретный поток долго не получает ресурс — его обходят «жадные» потоки. Deadlock — потоки стоят в BLOCKED или WAITING и не двигаются вовсе.

| | **Deadlock** | **Livelock** | **Starvation** |
|---|---|---|---|
| **Состояние потоков** | BLOCKED / WAITING навсегда | RUNNABLE, крутятся в цикле | Жертва ждёт, остальные работают |
| **CPU** | ~0% | Высокий | Нормальный |
| **Прогресс системы** | Нет у участников | Нет у участников | Есть, но не у жертвы |
| **Видно в thread dump** | `Found one Java-level deadlock` | Нет: потоки RUNNABLE, стек меняется от дампа к дампу | Нет: жертва в нескольких дампах подряд ждёт тот же лок |

**Livelock** типично возникает при «вежливом» отступлении: поток не смог взять ресурс, откатился и сразу повторил. Если два потока с `tryLock` делают это с одинаковым интервалом, они могут бесконечно хватать по одному локу и отпускать его. Лечится случайной паузой (backoff), как в примере выше, или фиксированным порядком захвата.

**Starvation** случается, когда:

- лок нечестный (по умолчанию и у `synchronized`, и у `ReentrantLock`) — новый поток может «влезть» (barging) перед тем, кто давно ждёт;
- поток держит лок долго и часто перезахватывает его — остальным почти не достаётся;
- пул забит долгими задачами, и короткие задачи стоят в очереди.

Против голодания на локе — честный лок `new ReentrantLock(true)`: при конкуренции он отдаёт доступ потоку, который ждёт дольше всех. По документации такой лок гарантирует отсутствие голодания, но пропускная способность у него ниже, часто намного.

!!! warning "Ловушка: приоритеты потоков против голодания"
    `Thread.setPriority()` — лишь подсказка планировщику ОС, и на многих платформах она почти ни на что не влияет. Чинить голодание приоритетами нельзя, а высоким приоритетом «жадного» потока его легко устроить.

??? question "Проверь себя"
    1. Как отличить livelock от deadlock по thread dump и загрузке CPU?
    2. Почему `tryLock` в цикле без случайной паузы может привести к livelock?
    3. Чем честный `ReentrantLock` помогает от голодания и чем за это платишь?

**Источники:**

- [JLS SE 25, §17.1 Synchronization](https://docs.oracle.com/javase/specs/jls/se25/html/jls-17.html#jls-17.1) — язык не предотвращает и не обязан обнаруживать дедлоки.
- [The Java Tutorials: Deadlock](https://docs.oracle.com/javase/tutorial/essential/concurrency/deadlock.html) и [Starvation and Livelock](https://docs.oracle.com/javase/tutorial/essential/concurrency/starvelive.html)
- [`jstack` — JDK 25 Tool Specifications](https://docs.oracle.com/en/java/javase/25/docs/specs/man/jstack.html) и [`jcmd`](https://docs.oracle.com/en/java/javase/25/docs/specs/man/jcmd.html) — `Thread.print`, `Thread.dump_to_file`
- [Troubleshooting Guide JDK 25: Diagnostic Tools](https://docs.oracle.com/en/java/javase/25/troubleshoot/diagnostic-tools.html) — `jcmd` рекомендуется вместо `jstack`
- [Troubleshooting Guide JDK 21: Troubleshoot Process Hangs and Loops](https://docs.oracle.com/en/java/javase/21/troubleshoot/troubleshoot-process-hangs-and-loops.html) — thread dump и встроенный поиск дедлоков HotSpot
- [`ThreadMXBean.findDeadlockedThreads()`](https://docs.oracle.com/en/java/javase/25/docs/api/java.management/java/lang/management/ThreadMXBean.html#findDeadlockedThreads()) — только платформенные потоки
- [`ReentrantLock`](https://docs.oracle.com/en/java/javase/25/docs/api/java.base/java/util/concurrent/locks/ReentrantLock.html) — fairness, `tryLock(long, TimeUnit)`, `lockInterruptibly()`

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Deadlock** | Потоки держат по локу и ждут друг друга по кругу; нужны все 4 условия Коффмана; JVM сама не разрывает |
| **Поиск дедлока** | `jcmd <pid> Thread.print` / `jstack` / `kill -3` → `Found one Java-level deadlock`; виртуальные потоки — `Thread.dump_to_file` |
| **Избежать дедлока** | Единый порядок захвата локов (по id); `tryLock(timeout)` с откатом и случайной паузой; не звать чужой код под локом |
| **Livelock и starvation** | Livelock — RUNNABLE и CPU, но без прогресса; starvation — поток обходят, лечится `new ReentrantLock(true)` |

<!-- --8<-- [end:cheatsheet] -->
