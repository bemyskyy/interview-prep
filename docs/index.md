# Подготовка к техническому собеседованию

База знаний для backend-разработчика на Java: язык, Spring, базы данных, Kafka, алгоритмы, сети, системный дизайн и архитектура. Каждая тема — вопрос, как его задают на собесе, короткий ответ вслух и разбор с кодом: **почему** это работает именно так.

## Как пользоваться базой { #how-to-use }

- **Темы.** Заголовок темы — вопрос с собеса. Под ним метка уровня, блок «Ответ вслух» на 2–3 предложения, разбор с кодом, ловушки и свёрнутый блок «Проверь себя».
- **Коротко / Подробно.** В длинных темах ответ и разбор разнесены по вкладкам. Выбор вкладки запоминается и действует на всех страницах.
- **Глоссарий.** Наведи курсор на сокращение вроде JMM, MVCC или ISR — появится расшифровка.
- **Поиск** понимает русский и ищет по всем страницам: `volatile`, `PECS`, `N+1`, `Circuit Breaker`.
- **Теги** под заголовком страницы показывают уровень и тему. [Все теги](prep/tags.md) собирают страницы по уровню или сквозной теме, например «Транзакции».
- **Повторение.** [Вопросы собеса](prep/questions.md) — все вопросы базы списком для самопроверки. [За час до собеса](prep/last-hour.md) — все шпаргалки на одной странице.

## Маршрут подготовки { #route }

Выбери свой уровень и иди по шагам сверху вниз. Каждый уровень включает предыдущий: Middle сначала проходит маршрут Junior, но может читать его быстрее — только «Ответ вслух» и ловушки.

=== "Junior"

    Цель — уверенно объяснить, что это, зачем и как этим пользоваться.

    1. **Язык.** [Основы языка](java/basics.md) → [Строки](java/strings.md) → [ООП](java/oop.md) → [Исключения](java/exceptions.md).
    2. **Коллекции и стримы.** [Коллекции](java/collections.md) до раздела [HashMap](java/collections.md#hashmap) включительно → [Дженерики: основы](java/generics.md#basics) → [Stream API](java/streams.md) → [Современная Java](java/modern-java.md).
    3. **Платформа.** [JVM: платформа](java/jvm.md#platform) → [Сборка мусора](java/jvm.md#gc) → [Stack и Heap](java/jvm.md#memory) → [Многопоточность: основы](java/multithreading.md#basics) и [мониторы](java/multithreading.md#monitors).
    4. **Базы данных.** [ACID](database/sql.md#acid) → [SQL-запросы](database/sql.md#queries) → [Индексы](database/sql.md#indexes).
    5. **Spring.** [Core: IoC и DI](spring/spring-core.md) → [Spring Boot](spring/spring-boot.md) → [MVC / REST](spring/spring-mvc.md) → [Data JPA: `@Transactional`](spring/spring-data-jpa.md#transactional).
    6. **Сети.** [TCP и UDP](networks/networks.md#tcp-udp) → [HTTP](networks/networks.md#http) → [REST](networks/networks.md#rest).
    7. **Алгоритмы.** [Big O](algorithms/algorithms.md#big-o) → [Структуры данных](algorithms/algorithms.md#data-structures) → [Подход к задаче](algorithms/leetcode-patterns.md#approach) → [Two Pointers](algorithms/leetcode-patterns.md#two-pointers) и [HashMap в задачах](algorithms/leetcode-patterns.md#hashmap).
    8. **Окружение.** [Docker](infrastructure/infrastructure.md#docker) → [Docker Compose](infrastructure/infrastructure.md#compose).

    Для самопроверки ищи в [Вопросах собеса](prep/questions.md) пометку *Junior*.

=== "Middle"

    Цель — объяснить, как это устроено внутри, назвать сложность операций и типичные ошибки.

    1. **Java целиком.** [Коллекции](java/collections.md), включая потокобезопасные → [Многопоточность](java/multithreading.md): JMM, блокировки, executors, `CompletableFuture` → [JVM и память](java/jvm.md) → [Дженерики](java/generics.md): PECS и стирание типов → [IO / NIO](java/io-nio.md).
    2. **Дизайн кода.** [SOLID](java/solid.md) → [Паттерны проектирования](java/patterns.md).
    3. **Spring изнутри.** [Жизненный цикл бина и AOP](spring/spring-core.md#bean-lifecycle) → [Propagation и блокировки](spring/spring-data-jpa.md#propagation) → [Hibernate и N+1](spring/spring-data-jpa.md#hibernate) → [Тестирование и инструменты](spring/spring-tools.md) → [Security и Spring Kafka](spring/spring-ecosystem.md).
    4. **Базы данных.** [Изоляция транзакций](database/sql.md#isolation) → [MVCC](database/sql.md#mvcc) → [`EXPLAIN ANALYZE`](database/sql.md#explain) → [NoSQL](database/nosql.md).
    5. **Kafka.** [Физика брокера](kafka/kafka.md) → [Consumer и Producer](kafka/kafka-consumer-producer.md) → [Гарантии доставки](kafka/kafka-reliability.md).
    6. **Сети.** [TLS](networks/networks.md#tls) → [gRPC и выбор стиля API](networks/networks.md#grpc) → [WebSocket и SSE](networks/networks.md#websocket).
    7. **Основы System Design.** [Строительные блоки](system-design/system-design.md#building-blocks) → [Надёжность и эксплуатация](system-design/system-design.md#reliability) → [CI/CD](infrastructure/infrastructure.md#cicd) → [Миграции БД](infrastructure/infrastructure.md#migrations).
    8. **Алгоритмы.** Все паттерны из [Паттернов задач](algorithms/leetcode-patterns.md), включая [динамическое программирование](algorithms/leetcode-patterns.md#dp) → [Графы](algorithms/algorithms.md#graphs).

=== "Senior"

    Цель — граничные случаи, производительность, распределённые системы и обоснованный выбор архитектуры.

    1. **JVM и конкурентность в глубину.** [Выбор сборщика мусора](java/jvm.md#collectors) → [Расследование OOM](java/jvm.md#oom-investigation) → [Многопоточность под капотом](java/multithreading.md#under-the-hood): CAS, AQS, false sharing → [Виртуальные потоки](java/multithreading.md#loom).
    2. **Данные под нагрузкой.** [MVCC в PostgreSQL и MySQL](database/sql.md#mvcc-postgres-vs-mysql) → [Почему не `SERIALIZABLE` везде](database/sql.md#serializable) → [Блокировки JPA](spring/spring-data-jpa.md#isolation-locking).
    3. **Kafka в проде.** [Ребаланс](kafka/kafka-consumer-producer.md#rebalancing) → [Exactly-once](kafka/kafka-reliability.md#exactly-once) → [Log compaction](kafka/kafka.md#log-compaction).
    4. **Распределённые системы.** [Теория распределённых систем](system-design/system-design.md#distributed): CAP, консенсус, Saga, Outbox → [Микросервисы](system-design/system-design.md#microservices).
    5. **Архитектура.** [DDD](architecture/architecture.md#ddd) → [Архитектурные стили](architecture/architecture.md#styles) → [CQRS и Event Sourcing](architecture/architecture.md#cqrs-es) → [DDD в Spring-приложении](spring/spring-ecosystem.md#spring-ddd).
    6. **Интервью по System Design.** [Методология](system-design/system-design.md#methodology) → [Разбор кейсов](system-design/system-design.md#cases).
    7. **Эксплуатация.** [Миграции без простоя](infrastructure/infrastructure.md#zero-downtime) → [Стратегии деплоя](infrastructure/infrastructure.md#deploy-strategies) → [Kubernetes](infrastructure/infrastructure.md#kubernetes).

!!! tip "Перед звонком"
    За день до собеса не пытайся прочитать всё. Открой [За час до собеса](prep/last-hour.md) и пройди шпаргалки своего стека, а непонятные строки добери по ссылке на полный разбор.

## Что внутри { #contents }

| Раздел | Темы |
|---|---|
| **Язык Java** | JVM и память, многопоточность, основы языка, строки, ООП, коллекции, исключения, дженерики, Stream API, IO / NIO, SOLID, паттерны |
| **Spring** | IoC, DI, AOP, Spring Boot, MVC и REST, Data JPA и транзакции, Security, Spring Kafka, тестирование, кэширование, WebFlux |
| **Данные** | ACID, уровни изоляции, MVCC, индексы, оконные функции, четыре семейства NoSQL, Redis, Cassandra |
| **Kafka** | Партиции, оффсеты, consumer groups, ребаланс, ISR, `acks`, семантики доставки, DLQ |
| **Computer Science** | Big O, структуры данных, сортировки, графы, паттерны LeetCode, TCP, HTTP, TLS, DNS, REST и gRPC |
| **Проектирование** | Масштабирование, кэширование, очереди, CAP, Saga, микросервисы, DDD, CQRS, Docker, CI/CD, Kubernetes |

## Вклад в проект { #contributing }

База открыта для дополнений. Нашёл ошибку, знаешь тему глубже или завалили вопросом, которого здесь нет, — присылай pull request или открой [issue](https://github.com/bemyskyy/interview-prep/issues). Как добавить страницу — в [README](https://github.com/bemyskyy/interview-prep#readme).
