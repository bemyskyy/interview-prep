---
hide:
  - navigation
  - toc
---

<div class="ip-hero" markdown>

<div class="ip-hero__intro" markdown>

# Подготовка к собеседованию на Java backend { #start }

<p class="ip-hero__lead" markdown>Язык, Spring, базы данных, Kafka, алгоритмы, сети и системный дизайн. Каждая тема — вопрос, как его задают на собесе, короткий ответ вслух и разбор с кодом: **почему** это работает именно так.</p>

<p class="ip-hero__actions" markdown>[Начать с основ Java](java/basics.md){ .md-button .md-button--primary } [Все разделы](#sections){ .md-button }</p>

</div>

<div class="ip-hero__quiz" markdown>

<p class="ip-hero__label">Вопрос с собеседования: что выведет код?</p>

```java
Integer a = 127, b = 127;
Integer c = 128, d = 128;

System.out.println(a == b);
System.out.println(c == d);
```

??? question "Ответ"
    `true`, затем `false`. При автоупаковке компилятор вызывает `Integer.valueOf()`, а он отдаёт готовые объекты из кэша для значений от -128 до 127. `a` и `b` ссылаются на один объект из кэша, `c` и `d` — на два разных, а `==` сравнивает ссылки. Обёртки сравнивай через `equals()`. Подробнее — в [ловушках автоупаковки](java/basics.md#autoboxing-traps).

</div>

</div>

## Разделы { #sections }

<div class="ip-sections" markdown>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Язык Java](java/jvm.md) <span class="ip-section__count">12 страниц</span></p>
<p class="ip-section__topics" markdown>JVM и память, коллекции, ООП, дженерики, Stream API</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Многопоточность](concurrency/threads.md) <span class="ip-section__count">7 страниц</span></p>
<p class="ip-section__topics" markdown>Потоки, `ThreadLocal`, `synchronized` и `ReentrantLock`, JMM и `volatile`, атомики и CAS, дедлоки, пулы потоков, `CompletableFuture`, виртуальные потоки</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Дизайн кода](design/solid.md) <span class="ip-section__count">5 страниц</span></p>
<p class="ip-section__topics" markdown>SOLID, композиция и наследование, связность и зацепление, паттерны GoF</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Spring](spring/spring-core.md) <span class="ip-section__count">9 страниц</span></p>
<p class="ip-section__topics" markdown>IoC и DI, AOP, Spring Boot, MVC и REST, Data JPA и транзакции, Security, тестирование</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Данные](database/sql.md) <span class="ip-section__count">4 страницы</span></p>
<p class="ip-section__topics" markdown>ACID, уровни изоляции, MVCC, индексы, оконные функции, NoSQL, Redis, Cassandra</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Kafka](kafka/kafka.md) <span class="ip-section__count">4 страницы</span></p>
<p class="ip-section__topics" markdown>Партиции, оффсеты, consumer groups, ребаланс, ISR, `acks`, exactly-once, DLQ</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[System Design](system-design/interview.md) <span class="ip-section__count">3 страницы</span></p>
<p class="ip-section__topics" markdown>Оценка нагрузки, балансировка, кэши, очереди, CDN, репликация и шардирование, CAP, консенсус, разбор кейсов</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Архитектура](architecture/ddd.md) <span class="ip-section__count">4 страницы</span></p>
<p class="ip-section__topics" markdown>DDD, гексагональная архитектура, CQRS и Event Sourcing, микросервисы, circuit breaker, Saga и Outbox</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Инфраструктура](infrastructure/docker.md) <span class="ip-section__count">4 страницы</span></p>
<p class="ip-section__topics" markdown>Docker и Compose, CI/CD, миграции БД, Kubernetes, пробы и sidecar, observability</p>
</div>

<div class="ip-section" markdown>
<p class="ip-section__head" markdown>[Computer Science](algorithms/algorithms.md) <span class="ip-section__count">5 страниц</span></p>
<p class="ip-section__topics" markdown>Big O, структуры данных, сортировки, графы, паттерны LeetCode, TCP, HTTP, TLS, gRPC</p>
</div>


</div>

## Маршрут подготовки { #route }

Выбери свой уровень и иди по шагам сверху вниз. Каждый уровень включает предыдущий: Middle сначала проходит маршрут Junior, но может читать его быстрее — только «Ответ вслух» и ловушки.

=== "Junior"

    Цель — уверенно объяснить, что это, зачем и как этим пользоваться.

    1. **Язык.** [Основы языка](java/basics.md) → [Строки](java/strings.md) → [ООП](java/oop.md) → [Исключения](java/exceptions.md).
    2. **Коллекции и стримы.** [Коллекции](java/collections.md) → [HashMap](java/hashmap.md) → [Дженерики: основы](java/generics.md#basics) → [Stream API](java/streams.md) → [Лямбды и Optional](java/functional.md) → [Современная Java](java/modern-java.md).
    3. **Платформа.** [JVM: платформа](java/jvm.md#platform) → [Сборка мусора](java/jvm.md#gc) → [Stack и Heap](java/jvm.md#memory) → [Потоки](concurrency/threads.md) и [`synchronized`](concurrency/locks.md#monitors).
    4. **Базы данных.** [ACID](database/transactions.md#acid) → [SQL-запросы](database/sql.md#queries) → [Индексы](database/sql.md#indexes).
    5. **Spring.** [Core: IoC и DI](spring/spring-core.md) → [Spring Boot](spring/spring-boot.md) → [MVC / REST](spring/spring-mvc.md) → [Транзакции: `@Transactional`](spring/spring-transactions.md#transactional).
    6. **Сети.** [TCP и UDP](networks/networks.md#tcp-udp) → [HTTP](networks/networks.md#http) → [REST](networks/networks.md#rest).
    7. **Алгоритмы.** [Big O](algorithms/algorithms.md#big-o) → [Структуры данных](algorithms/algorithms.md#data-structures) → [Подход к задаче](algorithms/leetcode-patterns.md#approach) → [Two Pointers](algorithms/leetcode-patterns.md#two-pointers) и [HashMap в задачах](algorithms/leetcode-patterns.md#hashmap).
    8. **Окружение.** [Docker](infrastructure/docker.md#docker) → [Docker Compose](infrastructure/docker.md#compose).

    Для самопроверки ищи в [Вопросах собеса](prep/questions.md) пометку *Junior*.

=== "Middle"

    Цель — объяснить, как это устроено внутри, назвать сложность операций и типичные ошибки.

    1. **Java целиком.** [Коллекции](java/collections.md) и [потокобезопасные коллекции](concurrency/concurrent-collections.md) → Многопоточность: [JMM и `volatile`](concurrency/jmm.md) → [блокировки](concurrency/locks.md) → [пулы потоков и `CompletableFuture`](concurrency/executors.md) → [дедлоки](concurrency/deadlock.md) → [JVM и память](java/jvm.md) → [Дженерики](java/generics.md): PECS и стирание типов → [IO / NIO](java/io-nio.md).
    2. **Дизайн кода.** [SOLID](design/solid.md) → паттерны: [порождающие](design/creational-patterns.md), [структурные](design/structural-patterns.md) и [поведенческие](design/behavioral-patterns.md).
    3. **Spring изнутри.** [Жизненный цикл бина и AOP](spring/spring-core.md#bean-lifecycle) → [Propagation](spring/spring-transactions.md#propagation) → [Блокировки](database/locking.md) → [Hibernate и N+1](spring/spring-data-jpa.md#hibernate) → [Тестирование](spring/spring-testing.md) → [Кэширование](spring/spring-caching.md) → [Actuator и Micrometer](spring/spring-actuator.md) → [Spring Security](spring/spring-security.md) → [Kafka в Spring](kafka/spring-kafka.md).
    4. **Базы данных.** [Изоляция транзакций](database/transactions.md#isolation) → [MVCC](database/transactions.md#mvcc) → [`EXPLAIN ANALYZE`](database/sql.md#explain) → [NoSQL](database/nosql.md).
    5. **Kafka.** [Физика брокера](kafka/kafka.md) → [Consumer и Producer](kafka/kafka-consumer-producer.md) → [Гарантии доставки](kafka/kafka-reliability.md).
    6. **Сети.** [TLS](networks/networks.md#tls) → [gRPC и выбор стиля API](networks/networks.md#grpc) → [WebSocket и SSE](networks/networks.md#websocket).
    7. **Основы System Design.** [Строительные блоки](system-design/building-blocks.md#building-blocks) → [Надёжность микросервисов](architecture/microservices.md#reliability) → [Observability](infrastructure/observability.md) → [CI/CD](infrastructure/cicd.md#cicd) → [Миграции БД](infrastructure/cicd.md#migrations).
    8. **Алгоритмы.** Все паттерны из [задач на массивы и строки](algorithms/leetcode-patterns.md) и [на деревья, графы и ДП](algorithms/leetcode-trees-dp.md), включая [динамическое программирование](algorithms/leetcode-trees-dp.md#dp) → [Графы](algorithms/sorting-graphs.md#graphs).

=== "Senior"

    Цель — граничные случаи, производительность, распределённые системы и обоснованный выбор архитектуры.

    1. **JVM и конкурентность в глубину.** [Выбор сборщика мусора](java/jvm.md#collectors) → [Расследование OOM](java/jvm.md#oom-investigation) → Многопоточность под капотом: [CAS](concurrency/jmm.md#cas-aba), [AQS](concurrency/locks.md#aqs), [false sharing](concurrency/jmm.md#false-sharing) → [Виртуальные потоки](concurrency/virtual-threads.md#loom).
    2. **Данные под нагрузкой.** [MVCC в PostgreSQL и MySQL](database/transactions.md#mvcc-postgres-vs-mysql) → [Почему не `SERIALIZABLE` везде](database/transactions.md#serializable) → [Lost update и write skew](database/locking.md#write-anomalies) → [Блокировки JPA](database/locking.md#row-locking).
    3. **Kafka в проде.** [Ребаланс](kafka/kafka-consumer-producer.md#rebalancing) → [Exactly-once](kafka/kafka-reliability.md#exactly-once) → [Log compaction](kafka/kafka.md#log-compaction).
    4. **Распределённые системы.** [Распределённые данные](system-design/distributed-data.md): репликация, CAP, консенсус → [Распределённые транзакции](architecture/distributed-transactions.md): Saga, Outbox → [Микросервисы](architecture/microservices.md#microservices).
    5. **Архитектура.** [DDD](architecture/ddd.md#ddd) → [Слоистая и гексагональная архитектура](architecture/hexagonal.md#styles) → [CQRS и Event Sourcing](architecture/ddd.md#cqrs-es) → [DDD в Spring-приложении](architecture/hexagonal.md#spring-ddd).
    6. **Интервью по System Design.** [Методология](system-design/interview.md#methodology) → [Разбор кейсов](system-design/interview.md#cases).
    7. **Эксплуатация.** [Миграции без простоя](infrastructure/cicd.md#zero-downtime) → [Стратегии деплоя](infrastructure/cicd.md#deploy-strategies) → [Kubernetes](infrastructure/kubernetes.md#kubernetes).

!!! tip "За день до собеседования"
    Не пытайся прочитать всё. Открой [За час до собеса](prep/last-hour.md) — там шпаргалки всех тем на одной странице. Пройди шпаргалки своего стека, а непонятные строки добери по ссылке на полный разбор. Для самопроверки — [все вопросы базы](prep/questions.md) списком.
