---
tags:
  - Подготовка
---

<!-- Сгенерировано scripts/prep_pages.py — не редактируй руками. -->

# Вопросы собеса

Все 437 вопросов базы в порядке изучения, у каждого — уровень и ссылка на ответ.
Тренируйся так: прочитай вопрос, ответь вслух за 30 секунд и только потом открой ответ.

## Язык Java { #java }

### JVM и память { #jvm }

- [Чем отличаются JVM, JRE и JDK?](../java/jvm.md#jvm-jre-jdk) — *Junior*
- [Как GC понимает, что объект больше не нужен?](../java/jvm.md#gc-roots) — *Junior*
- [Что такое гипотеза поколений?](../java/jvm.md#generations) — *Middle*
- [Как работает Mark-Sweep-Compact?](../java/jvm.md#mark-sweep-compact) — *Middle*
- [Что такое Stop-The-World?](../java/jvm.md#stw) — *Middle*
- [Какие сборщики мусора есть и какой выбрать?](../java/jvm.md#collectors) — *Senior*
- [Чем Stack отличается от Heap?](../java/jvm.md#stack-heap) — *Junior*
- [Что такое Metaspace и чем он отличается от PermGen?](../java/jvm.md#metaspace) — *Middle*
- [Где живут статические переменные и String Pool?](../java/jvm.md#static-location) — *Senior*
- [Как очищается Metaspace?](../java/jvm.md#metaspace-gc) — *Senior*
- [Что такое OutOfMemoryError?](../java/jvm.md#oom-basics) — *Junior*
- [Какие бывают OutOfMemoryError?](../java/jvm.md#oom-types) — *Middle*
- [Как расследовать и лечить OutOfMemoryError?](../java/jvm.md#oom-investigation) — *Senior*

### Основы языка { #basics }

- [Чем примитивы отличаются от ссылочных типов?](../java/basics.md#primitives) — *Junior*
- [Java передаёт параметры по ссылке или по значению?](../java/basics.md#pass-by-value) — *Junior*
- [Как работают автоупаковка и распаковка?](../java/basics.md#autoboxing) — *Junior*
- [Какие ловушки у автоупаковки?](../java/basics.md#autoboxing-traps) — *Middle*
- [Какой контракт у `equals()` и `hashCode()`?](../java/basics.md#equals-hashcode) — *Middle*
- [Чем отличаются `final`, `finally` и `finalize()`?](../java/basics.md#final-finally-finalize) — *Junior*
- [Что значит `static`?](../java/basics.md#static) — *Junior*
- [В каком порядке инициализируется объект?](../java/basics.md#init-order) — *Middle*
- [Какие значения по умолчанию у переменных?](../java/basics.md#default-values) — *Junior*
- [Как устроен `enum`?](../java/basics.md#enum) — *Middle*
- [Какие модификаторы доступа есть в Java?](../java/basics.md#access-modifiers) — *Junior*

### Строки { #strings }

- [Почему `String` неизменяемый?](../java/strings.md#string-immutable) — *Junior*
- [Чем `StringBuilder` отличается от `StringBuffer`?](../java/strings.md#stringbuilder) — *Junior*
- [Нужен ли `StringBuilder` для `a + b + c`?](../java/strings.md#concat-indy) — *Senior*
- [Что такое String Pool?](../java/strings.md#string-pool) — *Junior*
- [Как работает `intern()`?](../java/strings.md#intern) — *Middle*

### Современная Java { #modern-java }

- [Что такое `var` и где его нельзя использовать?](../java/modern-java.md#var) — *Junior*
- [Что такое `record`?](../java/modern-java.md#records) — *Junior*
- [Как работает новый `switch`?](../java/modern-java.md#switch-expressions) — *Junior*
- [Что такое pattern matching?](../java/modern-java.md#pattern-matching) — *Middle*
- [Что такое `sealed`-классы?](../java/modern-java.md#sealed) — *Middle*
- [Зачем `sealed` нужен в паре со `switch`?](../java/modern-java.md#sealed-switch) — *Senior*

### ООП { #oop }

- [Что такое ООП и зачем оно нужно?](../java/oop.md#what-is-oop) — *Junior*
- [Что такое инкапсуляция?](../java/oop.md#encapsulation) — *Junior*
- [Что такое абстракция?](../java/oop.md#abstraction) — *Junior*
- [Что такое полиморфизм?](../java/oop.md#polymorphism) — *Junior*
- [Чем интерфейс отличается от абстрактного класса?](../java/oop.md#interface-vs-abstract) — *Junior*
- [Зачем в интерфейсах `default`, `static` и `private` методы?](../java/oop.md#interface-methods) — *Middle*
- [Превратили ли `default`-методы интерфейс в абстрактный класс?](../java/oop.md#interface-state) — *Middle*
- [Что входит в сигнатуру метода?](../java/oop.md#signature) — *Junior*
- [Чем перегрузка отличается от переопределения?](../java/oop.md#overload-vs-override) — *Junior*
- [Можно ли при переопределении изменить тип возвращаемого значения?](../java/oop.md#covariant-return) — *Middle*

### Коллекции { #collections }

- [Как устроена иерархия коллекций?](../java/collections.md#collection-hierarchy) — *Junior*
- [Почему `Map` — это не `Collection`?](../java/collections.md#map-not-collection) — *Junior*
- [Как устроен `ArrayList`?](../java/collections.md#arraylist) — *Junior*
- [Как устроен `LinkedList`?](../java/collections.md#linkedlist) — *Junior*
- [Что быстрее для вставки в середину: `ArrayList` или `LinkedList`?](../java/collections.md#insert-middle) — *Middle*
- [Почему `LinkedList` проигрывает даже при равной асимптотике?](../java/collections.md#cache-locality) — *Senior*
- [Как `HashSet` обеспечивает уникальность?](../java/collections.md#hashset) — *Junior*
- [Как `TreeSet` сортирует элементы?](../java/collections.md#treeset) — *Junior*
- [`Comparable` или `Comparator`?](../java/collections.md#comparable-comparator) — *Junior*
- [Почему `Stack` устарел и чем его заменить?](../java/collections.md#stack-arraydeque) — *Junior*
- [Как работает `PriorityQueue`?](../java/collections.md#priorityqueue) — *Middle*
- [Откуда берётся `ConcurrentModificationException`?](../java/collections.md#cme) — *Middle*

### HashMap { #hashmap }

- [Как `HashMap` устроена внутри?](../java/hashmap.md#hashmap-internals) — *Junior*
- [Как `HashMap` находит бакет по ключу?](../java/hashmap.md#bucket-index) — *Middle*
- [Что происходит при коллизии?](../java/hashmap.md#collisions) — *Middle*
- [Когда `HashMap` расширяется?](../java/hashmap.md#rehashing) — *Middle*
- [Зачем в Java 8 бакеты превращаются в деревья?](../java/hashmap.md#treeify) — *Senior*
- [`HashMap`, `LinkedHashMap` или `TreeMap`?](../java/hashmap.md#map-choice) — *Junior*

### Исключения { #exceptions }

- [Как устроена иерархия исключений?](../java/exceptions.md#throwable) — *Junior*
- [Чем checked-исключения отличаются от unchecked?](../java/exceptions.md#checked-unchecked) — *Junior*
- [Как работает `try-catch-finally`?](../java/exceptions.md#try-catch) — *Junior*
- [Когда `finally` не выполняется?](../java/exceptions.md#finally) — *Middle*
- [Что даёт `try-with-resources`?](../java/exceptions.md#try-with-resources) — *Middle*
- [Когда создавать свои исключения и какие — checked или unchecked?](../java/exceptions.md#custom-exceptions) — *Middle*
- [Какие антипаттерны встречаются при работе с исключениями?](../java/exceptions.md#antipatterns) — *Middle*

### Дженерики { #generics }

- [Зачем нужны дженерики?](../java/generics.md#why-generics) — *Junior*
- [Что такое стирание типов?](../java/generics.md#type-erasure) — *Middle*
- [Что такое bridge-методы?](../java/generics.md#bridge-methods) — *Senior*
- [Что значит `? extends T`?](../java/generics.md#extends) — *Middle*
- [Что значит `? super T`?](../java/generics.md#super) — *Middle*
- [Чем `List<?>` отличается от `List<Object>`?](../java/generics.md#wildcard-vs-object) — *Middle*
- [Что такое PECS?](../java/generics.md#pecs) — *Middle*
- [Как ограничить параметр типа?](../java/generics.md#upper-bound) — *Middle*
- [Что такое generic-метод?](../java/generics.md#generic-methods) — *Junior*
- [Чего нельзя делать с дженериками?](../java/generics.md#generics-restrictions) — *Middle*
- [Почему raw types опасны?](../java/generics.md#raw) — *Middle*
- [Что такое heap pollution?](../java/generics.md#heap-pollution) — *Senior*
- [Когда ставить `@SafeVarargs`?](../java/generics.md#safevarargs) — *Senior*

### Stream API { #streams }

- [Что такое Stream и из чего состоит конвейер?](../java/streams.md#what-is-stream) — *Junior*
- [Чем промежуточные операции отличаются от терминальных?](../java/streams.md#intermediate-terminal) — *Junior*
- [Чем `map` отличается от `flatMap`?](../java/streams.md#map-flatmap) — *Junior*
- [В каком порядке выполняются операции стрима?](../java/streams.md#vertical) — *Middle*
- [Что такое short-circuiting?](../java/streams.md#short-circuit) — *Middle*
- [Зачем нужны `IntStream`, `LongStream` и `DoubleStream`?](../java/streams.md#primitive-streams) — *Middle*
- [Когда использовать `parallelStream()`?](../java/streams.md#parallel) — *Senior*
- [Как собрать стрим в коллекцию?](../java/streams.md#to-list) — *Junior*
- [Чем опасен `toMap`?](../java/streams.md#to-map) — *Middle*
- [Как группировать элементы?](../java/streams.md#grouping) — *Middle*
- [Как склеить строки из стрима?](../java/streams.md#joining) — *Junior*
- [Как решать типовые задачи на стримы?](../java/streams.md#stream-tasks) — *Middle*

### Лямбды и Optional { #functional }

- [Что такое функциональный интерфейс?](../java/functional.md#functional-interfaces) — *Junior*
- [Что такое ссылки на методы?](../java/functional.md#method-references) — *Junior*
- [Почему лямбда требует effectively final?](../java/functional.md#effectively-final) — *Middle*
- [Что такое `Optional` и как его создать?](../java/functional.md#optional-basics) — *Junior*
- [Чем `orElse` отличается от `orElseGet`?](../java/functional.md#orelse) — *Middle*
- [Как правильно работать с `Optional`?](../java/functional.md#optional-chains) — *Middle*

### IO / NIO { #io-nio }

- [Чем `java.io` отличается от `java.nio`?](../java/io-nio.md#io-vs-nio-diff) — *Junior*
- [Как устроены потоки `java.io`?](../java/io-nio.md#io-streams) — *Junior*
- [Как в `java.io` используется паттерн Декоратор?](../java/io-nio.md#io-decorator) — *Middle*
- [Зачем нужны `Buffered`-потоки?](../java/io-nio.md#buffered) — *Middle*
- [Чем `Path` лучше `File`?](../java/io-nio.md#path) — *Junior*
- [Как читать и писать файлы через `Files`?](../java/io-nio.md#files-read-write) — *Junior*
- [Какие операции с файлами и директориями есть в `Files`?](../java/io-nio.md#files-ops) — *Junior*
- [Как обойти директорию?](../java/io-nio.md#walk) — *Middle*
- [Как читать атрибуты файла?](../java/io-nio.md#attributes) — *Middle*
- [Как обработать большой CSV построчно?](../java/io-nio.md#big-files) — *Middle*
- [Как скопировать файл?](../java/io-nio.md#copy) — *Junior*
- [Как работать с properties-файлами?](../java/io-nio.md#properties) — *Junior*

## Многопоточность { #concurrency }

### Потоки и ThreadLocal { #threads }

- [Чем поток отличается от процесса?](../concurrency/threads.md#thread-vs-process) — *Junior*
- [Как создать поток: `Thread` или `Runnable`?](../concurrency/threads.md#thread-vs-runnable) — *Junior*
- [Какие состояния есть у потока?](../concurrency/threads.md#thread-states) — *Junior*
- [Как работают `join`, `sleep` и `yield`?](../concurrency/threads.md#join-sleep-yield) — *Junior*
- [Как правильно остановить поток?](../concurrency/threads.md#interrupt) — *Middle*
- [Как работает `ThreadLocal` и почему он течёт в пуле потоков?](../concurrency/threads.md#thread-local) — *Middle*

### Блокировки и синхронизаторы { #locks }

- [Как работает `synchronized`?](../concurrency/locks.md#synchronized) — *Junior*
- [Зачем `wait()` вызывают в цикле `while`?](../concurrency/locks.md#wait-notify) — *Middle*
- [Чем `ReentrantLock` лучше `synchronized`?](../concurrency/locks.md#reentrantlock) — *Middle*
- [Зачем нужны `ReadWriteLock`, `StampedLock` и `Condition`?](../concurrency/locks.md#rwlock-condition) — *Middle*
- [Чем `CountDownLatch` отличается от `CyclicBarrier`?](../concurrency/locks.md#latch-barrier) — *Middle*
- [Как `Semaphore` ограничивает доступ?](../concurrency/locks.md#semaphore) — *Middle*
- [Как устроен AQS?](../concurrency/locks.md#aqs) — *Senior*
- [Чем `LockSupport.park()` отличается от `wait()`?](../concurrency/locks.md#park-unpark) — *Senior*

### JMM, volatile и атомики { #jmm }

- [Какие три проблемы решает JMM?](../concurrency/jmm.md#jmm-basics) — *Middle*
- [Что такое happens-before?](../concurrency/jmm.md#happens-before) — *Middle*
- [Что гарантирует `volatile`, а что нет?](../concurrency/jmm.md#volatile) — *Middle*
- [Как `final`-поля помогают безопасной публикации?](../concurrency/jmm.md#final-fields) — *Senior*
- [Как работают атомики?](../concurrency/jmm.md#atomics) — *Middle*
- [Что такое CAS и проблема ABA?](../concurrency/jmm.md#cas-aba) — *Senior*
- [Почему `LongAdder` быстрее `AtomicLong` под нагрузкой?](../concurrency/jmm.md#longadder) — *Senior*
- [Что такое false sharing?](../concurrency/jmm.md#false-sharing) — *Senior*

### Deadlock, livelock, starvation { #deadlock }

- [Что такое deadlock и как он возникает?](../concurrency/deadlock.md#deadlock) — *Middle*
- [Как найти дедлок в работающем приложении?](../concurrency/deadlock.md#deadlock-detection) — *Middle*
- [Как избежать дедлока?](../concurrency/deadlock.md#deadlock-prevention) — *Middle*
- [Чем livelock и starvation отличаются от deadlock?](../concurrency/deadlock.md#livelock-starvation) — *Middle*

### Пулы потоков и CompletableFuture { #executors }

- [Зачем пулы, если есть `new Thread()`?](../concurrency/executors.md#why-pools) — *Junior*
- [Как `ThreadPoolExecutor` решает, что делать с задачей?](../concurrency/executors.md#thread-pool-executor) — *Middle*
- [Чем опасны фабрики `Executors`?](../concurrency/executors.md#executors-factories) — *Middle*
- [Как устроен `ForkJoinPool`?](../concurrency/executors.md#forkjoinpool) — *Senior*
- [Чем плох `Future`?](../concurrency/executors.md#future) — *Junior*
- [Как строить цепочки на `CompletableFuture`?](../concurrency/executors.md#completablefuture) — *Middle*
- [Как обрабатывать ошибки в `CompletableFuture`?](../concurrency/executors.md#cf-errors) — *Middle*

### Потокобезопасные коллекции { #concurrent-collections }

- [Чем плохи `Hashtable` и `Vector`?](../concurrency/concurrent-collections.md#hashtable-vector) — *Junior*
- [Как `ConcurrentHashMap` обходится почти без блокировок?](../concurrency/concurrent-collections.md#concurrenthashmap) — *Senior*
- [Когда нужен `CopyOnWriteArrayList`?](../concurrency/concurrent-collections.md#copyonwritearraylist) — *Middle*

### Виртуальные потоки { #virtual-threads }

- [Чем виртуальные потоки отличаются от платформенных?](../concurrency/virtual-threads.md#virtual-threads) — *Middle*
- [Что такое pinning?](../concurrency/virtual-threads.md#pinning) — *Senior*
- [Что такое Structured Concurrency?](../concurrency/virtual-threads.md#structured-concurrency) — *Senior*

## Дизайн кода { #design }

### Композиция и зацепление { #composition }

- [Почему наследование нарушает инкапсуляцию?](../design/composition.md#fragile-base-class) — *Middle*
- [Когда наследование всё-таки уместно?](../design/composition.md#when-inherit) — *Middle*
- [Что такое high cohesion и low coupling?](../design/composition.md#cohesion-coupling) — *Middle*

### SOLID { #solid }

- [Что такое Single Responsibility Principle?](../design/solid.md#srp) — *Junior*
- [Что такое Open/Closed Principle?](../design/solid.md#ocp) — *Junior*
- [Что такое Liskov Substitution Principle?](../design/solid.md#lsp) — *Middle*
- [Что такое Interface Segregation Principle?](../design/solid.md#isp) — *Junior*
- [Что такое Dependency Inversion Principle?](../design/solid.md#dip) — *Middle*

### Порождающие паттерны { #creational-patterns }

- [Как написать потокобезопасный Singleton?](../design/creational-patterns.md#singleton) — *Middle*
- [Почему Enum Singleton считается самым надёжным?](../design/creational-patterns.md#enum-singleton) — *Middle*
- [Зачем нужен Builder?](../design/creational-patterns.md#builder) — *Junior*
- [Что такое Factory Method и чем он отличается от Simple Factory?](../design/creational-patterns.md#factory-method) — *Middle*

### Структурные паттерны { #structural-patterns }

- [Что такое Decorator?](../design/structural-patterns.md#decorator) — *Middle*

### Поведенческие паттерны { #behavioral-patterns }

- [Что такое Strategy?](../design/behavioral-patterns.md#strategy) — *Junior*
- [Что такое Observer?](../design/behavioral-patterns.md#observer) — *Middle*

## Spring { #spring }

### Core (IoC, DI, AOP) { #spring-core }

- [Что такое IoC и чем он отличается от DI?](../spring/spring-core.md#ioc-vs-di) — *Junior*
- [Почему внедрение через конструктор лучше, чем через поле?](../spring/spring-core.md#constructor-injection) — *Junior*
- [Что будет при циклической зависимости бинов?](../spring/spring-core.md#circular-dependencies) — *Middle*
- [Чем `ApplicationContext` отличается от `BeanFactory`?](../spring/spring-core.md#applicationcontext-vs-beanfactory) — *Junior*
- [Через какие этапы проходит бин?](../spring/spring-core.md#bean-lifecycle-phases) — *Middle*
- [Чем `BeanFactoryPostProcessor` отличается от `BeanPostProcessor`?](../spring/spring-core.md#bfpp-vs-bpp) — *Middle*
- [На каком этапе создаётся прокси?](../spring/spring-core.md#proxy-creation) — *Middle*
- [Какие бывают скоупы бинов?](../spring/spring-core.md#bean-scopes) — *Junior*
- [Что будет, если внедрить prototype в singleton?](../spring/spring-core.md#prototype-in-singleton) — *Middle*
- [Как получать новый prototype при каждом вызове?](../spring/spring-core.md#fresh-prototype) — *Middle*
- [Зачем нужен AOP?](../spring/spring-core.md#why-aop) — *Junior*
- [Как Spring оборачивает бины в прокси?](../spring/spring-core.md#proxy) — *Middle*
- [Чем JDK Dynamic Proxy отличается от CGLIB?](../spring/spring-core.md#jdk-proxy-vs-cglib) — *Middle*
- [Почему не срабатывает `@Transactional` при вызове метода через `this`?](../spring/spring-core.md#self-invocation) — *Middle*

### Spring Boot { #spring-boot }

- [Зачем Spring Boot, если есть Spring?](../spring/spring-boot.md#boot-vs-spring) — *Junior*
- [Что внутри `@SpringBootApplication`?](../spring/spring-boot.md#springbootapplication) — *Junior*
- [Как работает автоконфигурация?](../spring/spring-boot.md#how-autoconfig) — *Middle*
- [Как отключить или переопределить автоконфигурацию?](../spring/spring-boot.md#override-autoconfig) — *Middle*
- [Что такое стартер?](../spring/spring-boot.md#starters) — *Junior*
- [Почему в зависимостях Spring Boot не пишут `<version>`?](../spring/spring-boot.md#bom) — *Middle*
- [Чем стартер отличается от автоконфигурации?](../spring/spring-boot.md#starter-vs-autoconfig) — *Middle*
- [В каком порядке Spring Boot читает настройки?](../spring/spring-boot.md#config-priority) — *Junior*
- [Как работают профили?](../spring/spring-boot.md#profiles) — *Junior*
- [`@Value` или `@ConfigurationProperties`?](../spring/spring-boot.md#value-vs-configprops) — *Middle*

### Spring MVC и WebFlux { #spring-mvc }

- [Как `DispatcherServlet` обрабатывает запрос?](../spring/spring-mvc.md#dispatcherservlet) — *Middle*
- [Зачем нужен `HandlerAdapter`?](../spring/spring-mvc.md#handler-adapter) — *Senior*
- [Какие аннотации извлекают данные из запроса?](../spring/spring-mvc.md#controller-annotations) — *Junior*
- [Как управлять статусом и заголовками ответа?](../spring/spring-mvc.md#response-entity) — *Junior*
- [Как централизованно обработать исключения?](../spring/spring-mvc.md#controller-advice) — *Junior*
- [Как Spring выбирает обработчик исключения?](../spring/spring-mvc.md#handler-resolution) — *Middle*
- [Что такое `ProblemDetail`?](../spring/spring-mvc.md#problem-detail) — *Middle*
- [Чем Filter отличается от Interceptor?](../spring/spring-mvc.md#filter-vs-interceptor) — *Middle*
- [Как написать фильтр?](../spring/spring-mvc.md#filter) — *Middle*
- [Как написать интерсептор?](../spring/spring-mvc.md#interceptor) — *Middle*
- [Как работает `@Valid`?](../spring/spring-mvc.md#valid) — *Junior*
- [Как настроить CORS?](../spring/spring-mvc.md#cors) — *Junior*
- [Зачем нужен реактивный подход?](../spring/spring-mvc.md#why-reactive) — *Middle*
- [Что такое `Mono` и `Flux`?](../spring/spring-mvc.md#mono-flux) — *Middle*
- [Когда выбирать WebFlux, а когда MVC?](../spring/spring-mvc.md#webflux-vs-mvc) — *Senior*

### Spring Security { #spring-security }

- [Как устроен Spring Security?](../spring/spring-security.md#security-filter-chain) — *Middle*
- [Как проходит аутентификация?](../spring/spring-security.md#authentication) — *Middle*
- [Как настроить авторизацию?](../spring/spring-security.md#authorization) — *Junior*
- [Как учитывать безопасность в дизайне?](../spring/spring-security.md#sessions-vs-jwt) — *Middle*
- [Как встроить JWT в Spring Security?](../spring/spring-security.md#jwt-filter) — *Middle*
- [Почему теряется `SecurityContext` в асинхронном коде?](../spring/spring-security.md#security-context-async) — *Senior*
- [Как сделать logout, если используется JWT?](../spring/spring-security.md#jwt-logout) — *Senior*

### Транзакции в Spring { #spring-transactions }

- [Что происходит при вызове `@Transactional`-метода?](../spring/spring-transactions.md#transactional-flow) — *Middle*
- [При каких исключениях Spring откатывает транзакцию?](../spring/spring-transactions.md#rollback-rules) — *Junior*
- [Чем опасен самовызов для транзакций?](../spring/spring-transactions.md#self-invocation-transactions) — *Middle*
- [Как работает `REQUIRED` и откуда берётся `UnexpectedRollbackException`?](../spring/spring-transactions.md#required) — *Senior*
- [Когда нужен `REQUIRES_NEW`?](../spring/spring-transactions.md#requires-new) — *Middle*
- [Чем `NESTED` отличается от `REQUIRES_NEW`?](../spring/spring-transactions.md#nested) — *Senior*
- [Какие ещё бывают типы propagation?](../spring/spring-transactions.md#other-propagation) — *Junior*
- [Как задать уровень изоляции в Spring?](../spring/spring-transactions.md#isolation) — *Middle*

### Spring Data JPA и Hibernate { #spring-data-jpa }

- [Что такое проблема N+1 и как её решить?](../spring/spring-data-jpa.md#n-plus-one) — *Middle*
- [Какие состояния бывают у Entity?](../spring/spring-data-jpa.md#entity-lifecycle) — *Middle*
- [Что такое dirty checking?](../spring/spring-data-jpa.md#dirty-checking) — *Middle*
- [Чем `save()` отличается от `saveAndFlush()`?](../spring/spring-data-jpa.md#save-vs-saveandflush) — *Middle*
- [Чем кэш первого уровня отличается от второго?](../spring/spring-data-jpa.md#hibernate-cache) — *Middle*

### Кэширование { #spring-caching }

- [Как работает `@Cacheable`?](../spring/spring-caching.md#cacheable) — *Junior*
- [Как вручную реализовать Cache-Aside на Redis?](../spring/spring-caching.md#cache-aside) — *Middle*
- [Как настроить Redis-кэш с TTL?](../spring/spring-caching.md#redis-cache-config) — *Middle*
- [Чем `condition` отличается от `unless`?](../spring/spring-caching.md#condition-vs-unless) — *Middle*

### Тестирование { #spring-testing }

- [Какой тестовый срез выбрать?](../spring/spring-testing.md#test-slices) — *Junior*
- [Как написать юнит-тест без Spring?](../spring/spring-testing.md#unit-tests) — *Junior*
- [Как протестировать контроллер без БД?](../spring/spring-testing.md#webmvctest) — *Middle*
- [Как протестировать репозиторий?](../spring/spring-testing.md#datajpatest) — *Middle*
- [Зачем нужны Testcontainers?](../spring/spring-testing.md#testcontainers) — *Middle*

### Actuator и Micrometer { #spring-actuator }

- [Что даёт Actuator и как его защитить?](../spring/spring-actuator.md#actuator) — *Junior*
- [Как писать свои метрики в Micrometer?](../spring/spring-actuator.md#micrometer) — *Middle*
- [Как подключить Prometheus и Grafana?](../spring/spring-actuator.md#prometheus) — *Middle*

## Данные { #data }

### SQL и индексы { #sql }

- [Как индекс ускоряет поиск?](../database/sql.md#how-index) — *Junior*
- [Какие типы индексов есть в PostgreSQL?](../database/sql.md#index-types) — *Middle*
- [Когда индекс не помогает?](../database/sql.md#index-not-used) — *Middle*
- [Как читать `EXPLAIN ANALYZE`?](../database/sql.md#explain) — *Middle*
- [Чем отличаются виды `JOIN`?](../database/sql.md#joins) — *Junior*
- [Чем `WHERE` отличается от `HAVING`?](../database/sql.md#group-by) — *Junior*
- [Как работают оконные функции?](../database/sql.md#window-functions) — *Middle*
- [Что такое CTE?](../database/sql.md#cte) — *Middle*
- [Что такое нормальные формы?](../database/sql.md#normal-forms) — *Junior*
- [Когда денормализовать?](../database/sql.md#denormalization) — *Middle*

### Транзакции и MVCC { #transactions }

- [Что такое ACID?](../database/transactions.md#acid-properties) — *Junior*
- [Как БД гарантирует долговечность?](../database/transactions.md#wal) — *Middle*
- [Какие бывают аномалии чтения?](../database/transactions.md#read-anomalies) — *Junior*
- [Какие бывают уровни изоляции?](../database/transactions.md#isolation-levels) — *Middle*
- [Почему не ставить `SERIALIZABLE` везде?](../database/transactions.md#serializable) — *Senior*
- [Как работает MVCC?](../database/transactions.md#mvcc-how) — *Middle*
- [Как MVCC реализует уровни изоляции?](../database/transactions.md#mvcc-isolation) — *Senior*
- [Что такое table bloat и autovacuum?](../database/transactions.md#vacuum) — *Senior*
- [Чем MVCC в PostgreSQL отличается от MySQL?](../database/transactions.md#mvcc-postgres-vs-mysql) — *Senior*

### Блокировки и конкурентные обновления { #locking }

- [Что такое lost update и как его избежать?](../database/locking.md#lost-update) — *Middle*
- [Что такое write skew и почему от него не спасает `REPEATABLE READ`?](../database/locking.md#write-skew) — *Senior*
- [Как работает оптимистичная блокировка?](../database/locking.md#optimistic-locking) — *Middle*
- [Как работает пессимистичная блокировка?](../database/locking.md#pessimistic-locking) — *Middle*

### NoSQL { #nosql }

- [Зачем NoSQL, если есть SQL?](../database/nosql.md#nosql-vs-sql) — *Junior*
- [Что такое документная БД?](../database/nosql.md#document-store) — *Junior*
- [Что такое key-value хранилище?](../database/nosql.md#key-value) — *Junior*
- [Redis, Memcached или Hazelcast?](../database/nosql.md#redis-cluster) — *Senior*
- [Как устроены wide-column БД?](../database/nosql.md#wide-column) — *Middle*
- [Когда нужна графовая БД?](../database/nosql.md#graph) — *Middle*
- [Как сравнить четыре семейства?](../database/nosql.md#comparison) — *Middle*
- [Что такое polyglot persistence?](../database/nosql.md#polyglot) — *Middle*

## Kafka { #kafka }

### Физика брокера { #kafka-broker }

- [Чем Kafka отличается от RabbitMQ?](../kafka/kafka.md#kafka-vs-rabbitmq) — *Junior*
- [Что такое топик и партиция?](../kafka/kafka.md#topic-partition) — *Junior*
- [Почему партиция — единица масштабирования?](../kafka/kafka.md#partition-scaling) — *Middle*
- [Что такое оффсет партиции и оффсет консьюмера?](../kafka/kafka.md#offset) — *Junior*
- [Где Kafka хранит оффсеты консьюмеров?](../kafka/kafka.md#consumer-offsets) — *Senior*
- [Почему Kafka не удаляет сообщения по одному?](../kafka/kafka.md#no-single-delete) — *Middle*
- [Как Kafka удаляет старые данные?](../kafka/kafka.md#segments) — *Middle*
- [Зачем хранить сообщения неделями?](../kafka/kafka.md#why-retention) — *Junior*
- [Что такое log compaction?](../kafka/kafka.md#log-compaction) — *Senior*

### Consumer и Producer { #kafka-consumer-producer }

- [Почему Kafka не гарантирует глобальный порядок?](../kafka/kafka-consumer-producer.md#no-global-order) — *Junior*
- [Что будет, если отправить сообщение без ключа?](../kafka/kafka-consumer-producer.md#null-key) — *Junior*
- [Как ключ гарантирует порядок?](../kafka/kafka-consumer-producer.md#key-hashing) — *Middle*
- [Что будет с порядком, если добавить партиции?](../kafka/kafka-consumer-producer.md#repartitioning) — *Senior*
- [Что такое consumer group?](../kafka/kafka-consumer-producer.md#consumer-group) — *Junior*
- [Что будет, если консьюмеров больше, чем партиций?](../kafka/kafka-consumer-producer.md#idle-consumers) — *Middle*
- [Как несколько групп читают один топик?](../kafka/kafka-consumer-producer.md#multiple-groups) — *Middle*
- [Что такое ребаланс и когда он происходит?](../kafka/kafka-consumer-producer.md#rebalance-triggers) — *Middle*
- [Как Kafka понимает, что консьюмер умер?](../kafka/kafka-consumer-producer.md#heartbeats) — *Senior*
- [Кто распределяет партиции при ребалансе?](../kafka/kafka-consumer-producer.md#group-leader) — *Senior*
- [Чем cooperative rebalancing лучше eager?](../kafka/kafka-consumer-producer.md#cooperative-rebalance) — *Senior*

### Гарантии доставки { #kafka-reliability }

- [Что задаёт параметр `acks` у продюсера?](../kafka/kafka-reliability.md#acks) — *Middle*
- [Как работают replication factor и ISR?](../kafka/kafka-reliability.md#replication-isr) — *Middle*
- [Чем отличаются at-most-once, at-least-once и exactly-once?](../kafka/kafka-reliability.md#delivery-guarantees) — *Middle*
- [Почему exactly-once называют «мифическим»?](../kafka/kafka-reliability.md#exactly-once) — *Senior*
- [Почему авто-коммит опасен и как коммитить вручную?](../kafka/kafka-reliability.md#offset-commit) — *Middle*
- [Как сделать консьюмер идемпотентным?](../kafka/kafka-reliability.md#idempotent-consumer) — *Middle*
- [Что делать с «ядовитым» сообщением?](../kafka/kafka-reliability.md#dlq) — *Middle*

### Kafka в Spring { #spring-kafka }

- [Как работает `@KafkaListener`?](../kafka/spring-kafka.md#kafka-listener) — *Middle*
- [Как настроить коммит оффсетов и обработку ошибок листенера?](../kafka/spring-kafka.md#listener-config) — *Middle*

## System Design { #system-design }

### Интервью и оценка нагрузки { #interview }

- [Какими метриками описывают систему?](../system-design/interview.md#metrics) — *Junior*
- [Как оценить нагрузку «на салфетке»?](../system-design/interview.md#estimation) — *Middle*
- [Как масштабировать сервис?](../system-design/interview.md#scaling) — *Junior*
- [Как проходить интервью по system design?](../system-design/interview.md#methodology) — *Middle*
- [Как спроектировать URL shortener?](../system-design/interview.md#url-shortener) — *Senior*
- [Ради чего спрашивают классические задачи?](../system-design/interview.md#classic-tasks) — *Middle*
- [Почему Round Robin убивает один сервер?](../system-design/interview.md#case-round-robin) — *Middle*
- [Что убило базу в 10:10, если Redis-узел сгорел в 10:05?](../system-design/interview.md#case-stampede) — *Senior*
- [Нужно ли шардировать таблицу на 100M строк?](../system-design/interview.md#case-sharding) — *Middle*
- [Что делать сервису «Избранное», когда перерубили кабель между ДЦ?](../system-design/interview.md#case-partition) — *Senior*
- [Почему письма теряются, дублируются и блокируют очередь?](../system-design/interview.md#case-emails) — *Senior*

### Строительные блоки { #building-blocks }

- [Чем L4-балансировщик отличается от L7?](../system-design/building-blocks.md#l4-l7) — *Middle*
- [Какие есть алгоритмы балансировки?](../system-design/building-blocks.md#lb-algorithms) — *Middle*
- [Почему sticky sessions — антипаттерн?](../system-design/building-blocks.md#sticky-sessions) — *Junior*
- [Где и как кэшировать?](../system-design/building-blocks.md#caching) — *Middle*
- [Как кэш вытесняет и инвалидирует данные?](../system-design/building-blocks.md#eviction) — *Junior*
- [Что такое cache stampede и как его лечить?](../system-design/building-blocks.md#cache-stampede) — *Senior*
- [Зачем нужны очереди сообщений?](../system-design/building-blocks.md#message-queues) — *Junior*
- [Что даёт CDN?](../system-design/building-blocks.md#cdn) — *Junior*

### Распределённые данные { #distributed-data }

- [Как масштабировать БД репликацией?](../system-design/distributed-data.md#replication) — *Middle*
- [Чем партиционирование отличается от шардирования?](../system-design/distributed-data.md#partitioning) — *Middle*
- [Как шардировать и выбрать shard key?](../system-design/distributed-data.md#sharding) — *Senior*
- [Что такое consistent hashing?](../system-design/distributed-data.md#consistent-hashing) — *Senior*
- [Что утверждает CAP-теорема?](../system-design/distributed-data.md#cap) — *Middle*
- [Что добавляет PACELC?](../system-design/distributed-data.md#pacelc) — *Senior*
- [Какие бывают модели согласованности?](../system-design/distributed-data.md#consistency-models) — *Senior*
- [Как узлы договариваются: Raft и Paxos?](../system-design/distributed-data.md#consensus) — *Senior*

## Архитектура { #architecture }

### DDD, CQRS и Event Sourcing { #ddd }

- [Что такое Ubiquitous Language?](../architecture/ddd.md#ubiquitous-language) — *Junior*
- [Что такое Bounded Context?](../architecture/ddd.md#bounded-context) — *Middle*
- [Как связываются контексты?](../architecture/ddd.md#context-mapping) — *Senior*
- [Что такое Entity и Aggregate?](../architecture/ddd.md#aggregate) — *Middle*
- [Где должна жить бизнес-логика?](../architecture/ddd.md#rich-domain-model) — *Middle*
- [Что такое Value Object?](../architecture/ddd.md#value-object) — *Junior*
- [Что такое доменные события?](../architecture/ddd.md#domain-events) — *Middle*
- [Что такое CQRS?](../architecture/ddd.md#cqrs) — *Senior*
- [Что такое Event Sourcing?](../architecture/ddd.md#event-sourcing) — *Senior*

### Слоистая и гексагональная архитектура { #hexagonal }

- [Чем плоха классическая слоистая архитектура?](../architecture/hexagonal.md#layered) — *Middle*
- [Как устроена гексагональная архитектура?](../architecture/hexagonal.md#hexagonal) — *Middle*
- [Layered или Hexagonal?](../architecture/hexagonal.md#layered-vs-hexagonal) — *Middle*
- [В каких слоях живут аннотации Spring?](../architecture/hexagonal.md#where-annotations) — *Middle*
- [Как адаптеры и конфигурация связывают ядро со Spring?](../architecture/hexagonal.md#adapters-config) — *Middle*
- [Где ставить `@Transactional`, если в ядре нет Spring?](../architecture/hexagonal.md#transactional-ddd) — *Senior*
- [Зачем маппить доменную модель в отдельную JPA Entity?](../architecture/hexagonal.md#double-entities) — *Senior*

### Микросервисы и отказоустойчивость { #microservices }

- [Монолит или микросервисы?](../architecture/microservices.md#monolith-vs-microservices) — *Middle*
- [Что такое модульный монолит?](../architecture/microservices.md#modular-monolith) — *Middle*
- [Как high cohesion и low coupling работают в микросервисах?](../architecture/microservices.md#service-boundaries) — *Senior*
- [Синхронно или асинхронно?](../architecture/microservices.md#sync-async) — *Junior*
- [Зачем нужны API Gateway, BFF и Service Discovery?](../architecture/microservices.md#api-gateway) — *Middle*
- [Как работает rate limiting?](../architecture/microservices.md#rate-limiting) — *Middle*
- [Зачем нужны timeout и retry с backoff?](../architecture/microservices.md#timeout-retry) — *Middle*
- [Как работает circuit breaker?](../architecture/microservices.md#circuit-breaker) — *Middle*
- [Что такое bulkhead и graceful degradation?](../architecture/microservices.md#bulkhead) — *Middle*

### Распределённые транзакции { #distributed-transactions }

- [Какие бывают гарантии доставки и при чём тут идемпотентность?](../architecture/distributed-transactions.md#delivery-guarantees) — *Middle*
- [Почему 2PC почти не используют в микросервисах?](../architecture/distributed-transactions.md#two-phase-commit) — *Senior*
- [Как работает Saga?](../architecture/distributed-transactions.md#saga) — *Senior*
- [Что такое Transactional Outbox?](../architecture/distributed-transactions.md#outbox) — *Senior*

## Инфраструктура { #infrastructure }

### Docker и Compose { #docker }

- [Какую проблему решает Docker?](../infrastructure/docker.md#why-docker) — *Junior*
- [Чем контейнер отличается от виртуальной машины?](../infrastructure/docker.md#container-vs-vm) — *Junior*
- [Чем Dockerfile, образ и контейнер отличаются?](../infrastructure/docker.md#image-container) — *Junior*
- [На чём держится изоляция контейнера?](../infrastructure/docker.md#namespaces-cgroups) — *Middle*
- [Как написать хороший Dockerfile для Java?](../infrastructure/docker.md#dockerfile) — *Middle*
- [Какой базовый образ выбрать?](../infrastructure/docker.md#base-images) — *Middle*
- [Почему контейнер нельзя запускать под root?](../infrastructure/docker.md#non-root) — *Junior*
- [Как сервисы в Compose находят друг друга?](../infrastructure/docker.md#compose-dns) — *Junior*
- [Как дождаться готовности базы при старте?](../infrastructure/docker.md#healthcheck) — *Junior*
- [Как запускать тяжёлые сервисы только по запросу?](../infrastructure/docker.md#compose-profiles) — *Junior*
- [Как поднять Kafka в Compose без ZooKeeper?](../infrastructure/docker.md#kraft) — *Middle*
- [Какие сети бывают в Docker?](../infrastructure/docker.md#docker-networks) — *Middle*
- [Как Docker хранит данные?](../infrastructure/docker.md#volumes) — *Middle*

### CI/CD и миграции БД { #cicd }

- [Чем CI отличается от Continuous Delivery и Continuous Deployment?](../infrastructure/cicd.md#ci-cd) — *Junior*
- [Из каких стадий состоит Java-пайплайн?](../infrastructure/cicd.md#pipeline) — *Middle*
- [Какие есть стратегии деплоя?](../infrastructure/cicd.md#deploy-strategies) — *Middle*
- [Зачем нужны Flyway и Liquibase?](../infrastructure/cicd.md#flyway) — *Junior*
- [Как запускать миграции в CI/CD?](../infrastructure/cicd.md#migrations-cicd) — *Middle*
- [Что будет, если изменить уже применённую миграцию?](../infrastructure/cicd.md#flyway-checksum) — *Middle*
- [Что, если пять инстансов одновременно начнут миграцию?](../infrastructure/cicd.md#flyway-lock) — *Senior*
- [Как мигрировать схему без простоя?](../infrastructure/cicd.md#zero-downtime) — *Senior*

### Kubernetes { #kubernetes }

- [Что даёт Kubernetes?](../infrastructure/kubernetes.md#k8s-basics) — *Junior*
- [Чем liveness отличается от readiness?](../infrastructure/kubernetes.md#health-checks) — *Junior*
- [Что такое sidecar?](../infrastructure/kubernetes.md#sidecar) — *Middle*
- [Зачем нужен reverse proxy?](../infrastructure/kubernetes.md#reverse-proxy) — *Junior*

### Observability { #observability }

- [Что такое observability?](../infrastructure/observability.md#observability) — *Middle*

## Computer Science { #cs }

### Big O и структуры данных { #algorithms }

- [Что такое Big O?](../algorithms/algorithms.md#big-o-basics) — *Junior*
- [Как упрощать Big O?](../algorithms/algorithms.md#simplification) — *Junior*
- [Что такое сложность по памяти?](../algorithms/algorithms.md#space-complexity) — *Junior*
- [Какая сложность у массива и связного списка?](../algorithms/algorithms.md#array-linkedlist) — *Junior*
- [Как оценивать HashMap и HashSet в задачах?](../algorithms/algorithms.md#hash-structures) — *Junior*
- [Чем пользоваться для стека и очереди?](../algorithms/algorithms.md#stack-queue) — *Junior*
- [Как работает куча (PriorityQueue)?](../algorithms/algorithms.md#heap) — *Middle*
- [Как устроено BST и как обходить дерево?](../algorithms/algorithms.md#tree-traversal) — *Junior*
- [Как обойти дерево по уровням?](../algorithms/algorithms.md#tree-bfs) — *Junior*
- [Что такое красно-чёрное дерево?](../algorithms/algorithms.md#red-black-tree) — *Middle*
- [Какая сложность у операций основных структур?](../algorithms/algorithms.md#structures-complexity) — *Junior*
- [Какую сложность у основных алгоритмов назвать сразу?](../algorithms/algorithms.md#algorithms-complexity) — *Junior*

### Сортировки и графы { #sorting-graphs }

- [Какие сортировки нужно знать?](../algorithms/sorting-graphs.md#sorting-overview) — *Middle*
- [Как работает Merge Sort?](../algorithms/sorting-graphs.md#merge-sort) — *Middle*
- [Как работает Quick Sort?](../algorithms/sorting-graphs.md#quick-sort) — *Middle*
- [Как хранить граф?](../algorithms/sorting-graphs.md#graph-representation) — *Junior*
- [Как найти кратчайший путь в невзвешенном графе?](../algorithms/sorting-graphs.md#graph-bfs) — *Middle*
- [Как работает DFS?](../algorithms/sorting-graphs.md#graph-dfs) — *Middle*
- [Как работает алгоритм Дейкстры?](../algorithms/sorting-graphs.md#dijkstra) — *Senior*

### Задачи: массивы и строки { #leetcode-patterns }

- [Как решать задачу на собесе?](../algorithms/leetcode-patterns.md#framework) — *Junior*
- [Какие edge cases проверять всегда?](../algorithms/leetcode-patterns.md#edge-cases) — *Junior*
- [Когда применять два указателя?](../algorithms/leetcode-patterns.md#two-pointers-basics) — *Junior*
- [Как найти все тройки с нулевой суммой (3Sum)?](../algorithms/leetcode-patterns.md#three-sum) — *Middle*
- [Как работает скользящее окно?](../algorithms/leetcode-patterns.md#sliding-window-basics) — *Junior*
- [Как найти самую длинную подстроку без повторов?](../algorithms/leetcode-patterns.md#longest-substring) — *Middle*
- [Как найти минимальное окно, покрывающее шаблон?](../algorithms/leetcode-patterns.md#min-window) — *Senior*
- [Как посчитать сумму отрезка за O(1)?](../algorithms/leetcode-patterns.md#prefix-sum-basics) — *Junior*
- [Как найти два числа с заданной суммой (Two Sum)?](../algorithms/leetcode-patterns.md#two-sum) — *Junior*
- [Как сгруппировать анаграммы?](../algorithms/leetcode-patterns.md#group-anagrams) — *Middle*
- [Как искать в повёрнутом отсортированном массиве?](../algorithms/leetcode-patterns.md#rotated-array) — *Middle*
- [Как проверить скобочную последовательность?](../algorithms/leetcode-patterns.md#valid-parentheses) — *Junior*
- [Как найти следующий больший элемент (монотонный стек)?](../algorithms/leetcode-patterns.md#monotonic-stack) — *Middle*

### Задачи: деревья, графы, ДП { #leetcode-trees-dp }

- [Как проверить, что дерево — валидное BST?](../algorithms/leetcode-trees-dp.md#validate-bst) — *Middle*
- [Как посчитать количество островов?](../algorithms/leetcode-trees-dp.md#islands) — *Middle*
- [Как найти кратчайший путь в лабиринте?](../algorithms/leetcode-trees-dp.md#maze) — *Middle*
- [Что такое динамическое программирование?](../algorithms/leetcode-trees-dp.md#dp-basics) — *Middle*
- [Как найти подмассив с максимальной суммой (Kadane)?](../algorithms/leetcode-trees-dp.md#kadane) — *Middle*
- [Как набрать сумму минимальным числом монет (Coin Change)?](../algorithms/leetcode-trees-dp.md#coin-change) — *Middle*
- [Как найти наибольшую общую подпоследовательность (LCS)?](../algorithms/leetcode-trees-dp.md#lcs) — *Middle*

### HTTP, TCP, REST, gRPC { #networks }

- [На каких уровнях живут протоколы, которыми ты пользуешься?](../networks/networks.md#osi-tcpip) — *Junior*
- [Чем TCP отличается от UDP?](../networks/networks.md#tcp-vs-udp) — *Junior*
- [Как TCP устанавливает и закрывает соединение?](../networks/networks.md#tcp-handshake) — *Junior*
- [Можно ли сделать надёжную передачу поверх UDP?](../networks/networks.md#reliable-udp) — *Middle*
- [Как выглядят HTTP-запрос и ответ?](../networks/networks.md#http-message) — *Junior*
- [Как HTTP эволюционировал от 1.0 до 3?](../networks/networks.md#http-versions) — *Middle*
- [Какие коды статусов нужно знать?](../networks/networks.md#status-codes) — *Junior*
- [Какие HTTP-методы идемпотентны?](../networks/networks.md#http-methods) — *Junior*
- [Что даёт TLS?](../networks/networks.md#tls-basics) — *Junior*
- [Как проходит TLS handshake?](../networks/networks.md#tls-handshake) — *Middle*
- [Как клиент проверяет сертификат?](../networks/networks.md#pki) — *Middle*
- [Что происходит, когда вводишь URL в браузере?](../networks/networks.md#url-flow) — *Junior*
- [Как имя превращается в IP?](../networks/networks.md#dns-resolution) — *Junior*
- [Какие бывают DNS-записи?](../networks/networks.md#dns-records) — *Junior*
- [Что такое REST?](../networks/networks.md#rest) — *Junior*
- [Как устроен gRPC?](../networks/networks.md#grpc) — *Middle*
- [REST, gRPC или GraphQL?](../networks/networks.md#rest-vs-grpc) — *Middle*
- [Когда нужен WebSocket и чем он отличается от SSE?](../networks/networks.md#websocket) — *Middle*
