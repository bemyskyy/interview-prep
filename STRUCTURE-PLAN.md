# План новой структуры базы

Документ — план реструктуризации `docs/`, контент в этом шаге не переносится. Числа строк посчитаны по текущему `main`: размер темы — от её заголовка до следующего заголовка того же или более высокого уровня.

Что внутри:

1. [Карта текущей базы](#1-карта-текущей-базы) — страницы, разделы, темы и их размеры, пересечения.
2. [Проблемы структуры](#2-проблемы-структуры).
3. [Новая навигация](#3-новая-навигация) — дерево, отступления от ориентира, черновик `nav`.
4. [Переезды](#4-переезды-старый-путьid--новый-путьid) — куда уходит каждая страница и тема, что сливается и что делится, порядок миграции.
5. [Что добавить](#5-что-добавить) — новые темы с приоритетом.

## Коротко

- **30 страниц тем → 58 после деления**, плюс 2 новые: «Загрузка классов и JIT» и «Что выведет код?». Средний размер падает с 634 до ~330 строк, страниц больше 700 строк не остаётся.
- **6 тематических вкладок → 10** по этапам Java-собеса (плюс «Старт» и «Подготовка»): Java, Многопоточность, Дизайн кода, Spring, Данные, Kafka, System Design, Архитектура, Инфраструктура, Computer Science.
- **Расформировываются** `multithreading.md` (7 страниц), `system-design.md` (3 страницы + 4 вкладки получают его темы), `spring-ecosystem.md`, `spring-tools.md`, `infrastructure.md`.
- **Убираются 8 дублей**: CAP, SQL vs NoSQL, polyglot persistence, rate limiting, наследование в ООП, гарантии доставки, таблица потокобезопасных коллекций, observability. Пять разделов-заглушек удаляются.
- **id якорей сохраняются**: из ~440 тем меняют id только 8 (слияния и коллизии), список — в [разделе 4.3](#43-какие-id-меняются).

---

## 1. Карта текущей базы

### 1.1. Страницы

Сгенерированные страницы (`index.md`, `prep/*`) не считаются. 🔴 — больше 1000 строк, 🟠 — больше 700.

| Страница | Строк | Разделов `##` | Вопросов `###` | Junior / Middle / Senior | Входящих ссылок с других страниц |
|---|---:|---:|---:|---|---:|
| `java/jvm.md` | 513  | 4 | 13 | 4 / 5 / 4 | 12 |
| `java/multithreading.md` | 1522 🔴 >1000 | 11 | 35 | 7 / 19 / 9 | 9 |
| `java/basics.md` | 652  | 2 | 11 | 7 / 4 / 0 | 8 |
| `java/strings.md` | 216  | 2 | 5 | 3 / 1 / 1 | 1 |
| `java/modern-java.md` | 258  | 2 | 6 | 3 / 2 / 1 | 5 |
| `java/oop.md` | 718 🟠 >700 | 5 | 15 | 7 / 7 / 1 | 1 |
| `java/collections.md` | 872 🟠 >700 | 6 | 21 | 11 / 7 / 3 | 15 |
| `java/exceptions.md` | 380  | 3 | 7 | 3 / 4 / 0 | 5 |
| `java/generics.md` | 582  | 5 | 13 | 2 / 8 / 3 | 2 |
| `java/streams.md` | 793 🟠 >700 | 6 | 18 | 8 / 9 / 1 | 2 |
| `java/io-nio.md` | 556  | 4 | 12 | 7 / 5 / 0 | 2 |
| `java/solid.md` | 510  | 1 | 5 | 3 / 2 / 0 | 9 |
| `java/patterns.md` | 594  | 3 | 7 | 2 / 5 / 0 | 11 |
| `spring/spring-core.md` | 556  | 5 | 14 | 5 / 9 / 0 | 10 |
| `spring/spring-boot.md` | 474  | 5 | 10 | 5 / 5 / 0 | 3 |
| `spring/spring-mvc.md` | 569  | 4 | 12 | 5 / 6 / 1 | 6 |
| `spring/spring-data-jpa.md` | 665  | 4 | 15 | 2 / 11 / 2 | 9 |
| `spring/spring-ecosystem.md` | 666  | 3 | 12 | 1 / 7 / 4 | 7 |
| `spring/spring-tools.md` | 654  | 4 | 14 | 4 / 9 / 1 | 10 |
| `database/sql.md` | 680  | 6 | 19 | 6 / 9 / 4 | 13 |
| `database/nosql.md` | 587  | 4 | 10 | 3 / 7 / 0 | 6 |
| `kafka/kafka.md` | 303  | 3 | 9 | 4 / 3 / 2 | 6 |
| `kafka/kafka-consumer-producer.md` | 333  | 3 | 11 | 3 / 4 / 4 | 7 |
| `kafka/kafka-reliability.md` | 391  | 4 | 7 | 0 / 6 / 1 | 11 |
| `algorithms/algorithms.md` | 791 🟠 >700 | 7 | 19 | 11 / 7 / 1 | 8 |
| `algorithms/leetcode-patterns.md` | 916 🟠 >700 | 10 | 20 | 7 / 12 / 1 | 14 |
| `networks/networks.md` | 747 🟠 >700 | 7 | 18 | 11 / 7 / 0 | 14 |
| `system-design/system-design.md` | 1410 🔴 >1000 | 8 | 45 | 9 / 22 / 14 | 36 |
| `architecture/architecture.md` | 453  | 3 | 13 | 2 / 8 / 3 | 8 |
| `infrastructure/infrastructure.md` | 661  | 7 | 23 | 11 / 10 / 2 | 7 |
| **Итого: 30 страниц** | **19022** | **141** | **439** | **156 / 220 / 63** | **257** |

Всего тем-заголовков `###` 439, из них 156 Junior, 220 Middle и 63 Senior. Больше всего ссылок ведёт на `system-design.md` (36) — его разделение затронет больше всего страниц.

### 1.2. Темы по страницам

Разделы `##` с id, их размер и темы `###` внутри. ⚠️ заглушка — раздел из одной ссылки на другую страницу.

<details>
<summary>Развернуть карту тем (30 страниц)</summary>

#### `algorithms/algorithms.md` — 791 строк, 19 вопросов (11 J / 7 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Big O `#big-o` | 108 | `big-o-basics` (50), `simplification` (21), `space-complexity` (35) |
| Структуры данных `#data-structures` | 187 | `array-linkedlist` (54), `hash-structures` (49), `stack-queue` (38), `heap` (44) |
| Деревья `#trees` | 113 | `tree-traversal` (54), `tree-bfs` (36), `red-black-tree` (21) |
| Сортировки `#sorting` | 119 | `sorting-overview` (28), `merge-sort` (50), `quick-sort` (39) |
| Графы `#graphs` | 173 | `graph-representation` (27), `graph-bfs` (45), `graph-dfs` (51), `dijkstra` (48) |
| Техники решения задач `#techniques` ⚠️ заглушка | 4 | — |
| Сводные таблицы `#summary` | 52 | `structures-complexity` (26), `algorithms-complexity` (24) |

#### `algorithms/leetcode-patterns.md` — 916 строк, 20 вопросов (7 J / 12 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Подход к задаче `#approach` | 65 | `framework` (31), `edge-cases` (32) |
| Two Pointers (два указателя) `#two-pointers` | 107 | `two-pointers-basics` (50), `three-sum` (55) |
| Sliding Window (скользящее окно) `#sliding-window` | 150 | `sliding-window-basics` (52), `longest-substring` (42), `min-window` (54) |
| Prefix Sum (префиксные суммы) `#prefix-sum` | 33 | `prefix-sum-basics` (31) |
| HashMap для частот и индексов `#hashmap` | 75 | `two-sum` (37), `group-anagrams` (36) |
| Бинарный поиск `#binary-search` | 53 | `rotated-array` (51) |
| DFS на дереве и графе `#dfs` | 84 | `validate-bst` (34), `islands` (48) |
| BFS — кратчайший путь `#bfs` | 53 | `maze` (51) |
| Динамическое программирование `#dp` | 185 | `dp-basics` (71), `kadane` (35), `coin-change` (38), `lcs` (39) |
| Стек для скобок и монотонных задач `#stack` | 83 | `valid-parentheses` (42), `monotonic-stack` (39) |

#### `architecture/architecture.md` — 453 строк, 13 вопросов (2 J / 8 M / 3 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Domain-Driven Design (DDD) `#ddd` | 224 | `ubiquitous-language` (18), `bounded-context` (32), `context-mapping` (27), `aggregate` (44), `rich-domain-model` (28), `value-object` (36), `domain-events` (37) |
| Архитектурные стили `#styles` | 111 | `layered` (26), `hexagonal` (43), `layered-vs-hexagonal` (23), `modular-monolith` (17) |
| CQRS и Event Sourcing `#cqrs-es` | 83 | `cqrs` (41), `event-sourcing` (40) |

#### `database/nosql.md` — 587 строк, 10 вопросов (3 J / 7 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Зачем NoSQL `#why-nosql` | 26 | `nosql-vs-sql` (24) |
| Семейства NoSQL `#families` | 354 | `document-store` (81), `key-value` (111), `wide-column` (78), `graph` (56), `comparison` (26) |
| CAP-теорема `#cap` | 38 | `cap-theorem` (36) |
| Redis в Spring Boot `#redis-patterns` | 138 | `cache-aside` (51), `polyglot` (43), `rate-limiting` (42) |

#### `database/sql.md` — 680 строк, 19 вопросов (6 J / 9 M / 4 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| ACID `#acid` | 67 | `acid-properties` (42), `wal` (23) |
| Изоляция транзакций `#isolation` | 112 | `read-anomalies` (36), `isolation-levels` (41), `serializable` (33) |
| MVCC `#mvcc` | 116 | `mvcc-how` (46), `mvcc-isolation` (18), `vacuum` (26), `mvcc-postgres-vs-mysql` (24) |
| Индексы `#indexes` | 126 | `how-index` (33), `index-types` (23), `index-not-used` (33), `explain` (35) |
| SQL-запросы `#queries` | 157 | `joins` (34), `group-by` (29), `window-functions` (45), `cte` (47) |
| Нормализация `#normalization` | 65 | `normal-forms` (42), `denormalization` (21) |

#### `infrastructure/infrastructure.md` — 661 строк, 23 вопросов (11 J / 10 M / 2 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Docker `#docker` | 184 | `why-docker` (19), `container-vs-vm` (25), `image-container` (23), `namespaces-cgroups` (18), `dockerfile` (52), `base-images` (23), `non-root` (22) |
| Docker Compose `#compose` | 173 | `compose-dns` (27), `healthcheck` (30), `compose-profiles` (23), `kraft` (17), `docker-networks` (38), `volumes` (36) |
| CI/CD `#cicd` | 88 | `ci-cd` (19), `pipeline` (29), `deploy-strategies` (38) |
| Миграции БД `#migrations` | 125 | `flyway` (28), `migrations-cicd` (23), `flyway-checksum` (17), `flyway-lock` (30), `zero-downtime` (25) |
| Kubernetes `#kubernetes` | 23 | `k8s-basics` (21) |
| Observability `#observability` ⚠️ заглушка | 4 | — |
| Reverse proxy и API Gateway `#proxy-gateway` | 19 | `reverse-proxy` (17) |

#### `java/basics.md` — 652 строк, 11 вопросов (7 J / 4 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Типы данных `#types` | 160 | `primitives` (45), `pass-by-value` (34), `autoboxing` (30), `autoboxing-traps` (49) |
| Объекты `#objects` | 463 | `equals-hashcode` (83), `final-finally-finalize` (51), `static` (45), `init-order` (55), `default-values` (52), `enum` (107), `access-modifiers` (68) |

#### `java/collections.md` — 872 строк, 21 вопросов (11 J / 7 M / 3 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Иерархия и интерфейсы `#hierarchy` | 94 | `collection-hierarchy` (55), `map-not-collection` (37) |
| Списки: ArrayList и LinkedList `#lists` | 138 | `arraylist` (37), `linkedlist` (35), `insert-middle` (33), `cache-locality` (31) |
| HashMap `#hashmap` | 237 | `hashmap-internals` (37), `bucket-index` (55), `collisions` (29), `rehashing` (31), `treeify` (42), `map-choice` (41) |
| Множества `#sets` | 122 | `hashset` (29), `treeset` (36), `comparable-comparator` (55) |
| Очереди и стеки `#queues` | 84 | `stack-arraydeque` (46), `priorityqueue` (36) |
| Итераторы и потокобезопасные коллекции `#concurrent-collections` | 159 | `cme` (50), `hashtable-vector` (34), `concurrenthashmap` (41), `copyonwritearraylist` (32) |

#### `java/exceptions.md` — 380 строк, 7 вопросов (3 J / 4 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Иерархия `#hierarchy` | 101 | `throwable` (40), `checked-unchecked` (59) |
| Обработка `#handling` | 143 | `try-catch` (43), `finally` (42), `try-with-resources` (56) |
| Свои исключения `#custom` | 107 | `custom-exceptions` (51), `antipatterns` (54) |

#### `java/generics.md` — 582 строк, 13 вопросов (2 J / 8 M / 3 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Основы `#basics` | 127 | `why-generics` (35), `type-erasure` (35), `bridge-methods` (55) |
| Wildcards `#wildcards` | 136 | `extends` (33), `super` (32), `wildcard-vs-object` (33), `pecs` (36) |
| Ограничения типов `#bounds` | 83 | `upper-bound` (51), `generic-methods` (30) |
| Запреты дженериков `#restrictions` | 102 | `generics-restrictions` (100) |
| Raw types и heap pollution `#raw-types` | 103 | `raw` (27), `heap-pollution` (27), `safevarargs` (47) |

#### `java/io-nio.md` — 556 строк, 12 вопросов (7 J / 5 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| java.io и java.nio `#io-vs-nio` | 31 | `io-vs-nio-diff` (29) |
| java.io `#java-io` | 123 | `io-streams` (48), `io-decorator` (36), `buffered` (37) |
| java.nio.file `#nio` | 239 | `path` (41), `files-read-write` (71), `files-ops` (44), `walk` (52), `attributes` (29) |
| Практические задачи `#practice` | 129 | `big-files` (50), `copy` (47), `properties` (30) |

#### `java/jvm.md` — 513 строк, 13 вопросов (4 J / 5 M / 4 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Платформа `#platform` | 62 | `jvm-jre-jdk` (60) |
| Garbage Collector `#gc` | 171 | `gc-roots` (38), `generations` (42), `mark-sweep-compact` (31), `stw` (24), `collectors` (34) |
| Память JVM `#memory` | 142 | `stack-heap` (55), `metaspace` (30), `static-location` (30), `metaspace-gc` (25) |
| OutOfMemoryError `#oom` | 108 | `oom-basics` (25), `oom-types` (34), `oom-investigation` (47) |

#### `java/modern-java.md` — 258 строк, 6 вопросов (3 J / 2 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Синтаксис `#syntax` | 162 | `var` (39), `records` (47), `switch-expressions` (37), `pattern-matching` (37) |
| Иерархии типов `#hierarchies` | 72 | `sealed` (40), `sealed-switch` (30) |

#### `java/multithreading.md` — 1522 строк, 35 вопросов (7 J / 19 M / 9 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Фундамент `#basics` | 167 | `thread-vs-process` (33), `thread-vs-runnable` (33), `thread-states` (36), `join-sleep-yield` (26), `interrupt` (37) |
| Мониторы и `wait`/`notify` `#monitors` | 78 | `synchronized` (43), `wait-notify` (33) |
| Java Memory Model (JMM) `#jmm` | 144 | `jmm-basics` (37), `happens-before` (38), `volatile` (37), `final-fields` (30) |
| Блокировки и атомики `#locks-atomics` | 123 | `reentrantlock` (39), `rwlock-condition` (33), `atomics` (26), `longadder` (23) |
| Потокобезопасные коллекции `#concurrent-collections` ⚠️ заглушка | 12 | — |
| Синхронизаторы `#synchronizers` | 74 | `latch-barrier` (42), `semaphore` (30) |
| Deadlock, livelock, starvation `#liveness` | 320 | `deadlock` (87), `deadlock-detection` (91), `deadlock-prevention` (96), `livelock-starvation` (42) |
| Пулы потоков (Executors) `#executors` | 179 | `why-pools` (34), `thread-pool-executor` (54), `executors-factories` (32), `forkjoinpool` (57) |
| Асинхронность: `Future` и `CompletableFuture` `#async` | 128 | `future` (25), `completablefuture` (65), `cf-errors` (36) |
| Под капотом `#under-the-hood` | 120 | `cas-aba` (41), `aqs` (27), `park-unpark` (23), `false-sharing` (27) |
| Project Loom (Java 21+) `#loom` | 127 | `virtual-threads` (50), `pinning` (35), `structured-concurrency` (40) |

#### `java/oop.md` — 718 строк, 15 вопросов (7 J / 7 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Принципы ООП `#principles` | 202 | `what-is-oop` (40), `encapsulation` (43), `abstraction` (45), `polymorphism` (41), `inheritance` (31) |
| Интерфейсы и абстрактные классы `#interfaces` | 139 | `interface-vs-abstract` (47), `interface-methods` (57), `interface-state` (33) |
| Override и Overload `#override-overload` | 129 | `signature` (30), `overload-vs-override` (59), `covariant-return` (38) |
| Композиция и наследование `#composition` | 126 | `fragile-base-class` (88), `when-inherit` (36) |
| Связность и зацепление `#coupling-cohesion` | 93 | `cohesion-coupling` (61), `microservices` (30) |

#### `java/patterns.md` — 594 строк, 7 вопросов (2 J / 5 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Порождающие паттерны `#creational` | 302 | `singleton` (63), `enum-singleton` (36), `builder` (81), `factory-method` (118) |
| Структурные паттерны `#structural` | 86 | `decorator` (82) |
| Поведенческие паттерны `#behavioral` | 180 | `strategy` (77), `observer` (99) |

#### `java/solid.md` — 510 строк, 5 вопросов (3 J / 2 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Принципы SOLID `#principles` | 486 | `srp` (86), `ocp` (76), `lsp` (101), `isp` (114), `dip` (107) |

#### `java/streams.md` — 793 строк, 18 вопросов (8 J / 9 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Основы `#basics` | 124 | `what-is-stream` (40), `intermediate-terminal` (49), `map-flatmap` (33) |
| Как работает конвейер `#pipeline` | 134 | `vertical` (35), `short-circuit` (32), `primitive-streams` (34), `parallel` (31) |
| Collectors `#collectors` | 164 | `to-list` (27), `to-map` (36), `grouping` (71), `joining` (28) |
| Optional `#optional` | 116 | `optional-basics` (32), `orelse` (25), `optional-chains` (57) |
| Функциональные интерфейсы `#functional` | 151 | `functional-interfaces` (78), `method-references` (35), `effectively-final` (36) |
| Задачи с собесов `#tasks` | 73 | `stream-tasks` (71) |

#### `java/strings.md` — 216 строк, 5 вопросов (3 J / 1 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| String и его родственники `#string-family` | 113 | `string-immutable` (29), `stringbuilder` (46), `concat-indy` (36) |
| String Pool `#pool` | 79 | `string-pool` (41), `intern` (36) |

#### `kafka/kafka-consumer-producer.md` — 333 строк, 11 вопросов (3 J / 4 M / 4 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Ключи и порядок сообщений `#message-keys` | 105 | `no-global-order` (21), `null-key` (32), `key-hashing` (26), `repartitioning` (24) |
| Consumer Groups `#consumer-groups` | 84 | `consumer-group` (22), `idle-consumers` (30), `multiple-groups` (30) |
| Ребаланс `#rebalancing` | 115 | `rebalance-triggers` (21), `heartbeats` (24), `group-leader` (36), `cooperative-rebalance` (32) |

#### `kafka/kafka-reliability.md` — 391 строк, 7 вопросов (6 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Продюсер и репликация `#producer-replication` | 88 | `acks` (47), `replication-isr` (39) |
| Семантики доставки `#delivery-semantics` | 72 | `delivery-guarantees` (51), `exactly-once` (19) |
| Оффсеты и идемпотентность `#offsets-idempotency` | 127 | `offset-commit` (73), `idempotent-consumer` (52) |
| Dead Letter Queue `#dead-letter-queue` | 74 | `dlq` (72) |

#### `kafka/kafka.md` — 303 строк, 9 вопросов (4 J / 3 M / 2 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Топики и партиции `#topics-partitions` | 104 | `kafka-vs-rabbitmq` (35), `topic-partition` (29), `partition-scaling` (38) |
| Оффсеты `#offsets` | 65 | `offset` (35), `consumer-offsets` (28) |
| Хранение и удаление данных `#retention` | 105 | `no-single-delete` (22), `segments` (34), `why-retention` (19), `log-compaction` (28) |

#### `networks/networks.md` — 747 строк, 18 вопросов (11 J / 7 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Модели OSI и TCP/IP `#models` | 47 | `osi-tcpip` (45) |
| TCP и UDP `#tcp-udp` | 116 | `tcp-vs-udp` (51), `tcp-handshake` (41), `reliable-udp` (22) |
| HTTP `#http` | 141 | `http-message` (38), `http-versions` (27), `status-codes` (44), `http-methods` (30) |
| HTTPS и TLS `#tls` | 120 | `tls-basics` (19), `tls-handshake` (35), `pki` (27), `url-flow` (37) |
| DNS `#dns` | 62 | `dns-resolution` (35), `dns-records` (25) |
| REST и gRPC `#api-styles` | 160 | `rest` (56), `grpc` (71), `rest-vs-grpc` (31) |
| Связь в реальном времени `#realtime` | 65 | `websocket` (63) |

#### `spring/spring-boot.md` — 474 строк, 10 вопросов (5 J / 5 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Зачем нужен Spring Boot `#why-boot` | 27 | `boot-vs-spring` (25) |
| Автоконфигурация `#auto-configuration` | 130 | `springbootapplication` (23), `how-autoconfig` (57), `override-autoconfig` (48) |
| Зависимости: стартеры и BOM `#dependencies` | 111 | `starters` (44), `bom` (40), `starter-vs-autoconfig` (25) |
| Конфигурация приложения `#configuration` | 173 | `config-priority` (25), `profiles` (63), `value-vs-configprops` (83) |
| Actuator и мониторинг `#actuator` ⚠️ заглушка | 4 | — |

#### `spring/spring-core.md` — 556 строк, 14 вопросов (5 J / 9 M)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| IoC и DI `#ioc-di` | 105 | `ioc-vs-di` (22), `constructor-injection` (55), `circular-dependencies` (26) |
| Контейнер `#container` | 45 | `applicationcontext-vs-beanfactory` (43) |
| Жизненный цикл бина `#bean-lifecycle` | 91 | `bean-lifecycle-phases` (47), `bfpp-vs-bpp` (23), `proxy-creation` (19) |
| Скоупы `#scopes` | 128 | `bean-scopes` (25), `prototype-in-singleton` (39), `fresh-prototype` (62) |
| AOP и прокси `#aop` | 159 | `why-aop` (19), `proxy` (30), `jdk-proxy-vs-cglib` (27), `self-invocation` (81) |

#### `spring/spring-data-jpa.md` — 665 строк, 15 вопросов (2 J / 11 M / 2 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Как работает `@Transactional` `#transactional` | 138 | `transactional-flow` (41), `rollback-rules` (30), `self-invocation-transactions` (65) |
| Propagation: распространение транзакций `#propagation` | 175 | `required` (64), `requires-new` (34), `nested` (55), `other-propagation` (20) |
| Изоляция и блокировки `#isolation-locking` | 120 | `isolation` (31), `optimistic-locking` (42), `pessimistic-locking` (45) |
| Hibernate под капотом `#hibernate` | 197 | `n-plus-one` (57), `entity-lifecycle` (33), `dirty-checking` (27), `save-vs-saveandflush` (45), `hibernate-cache` (33) |

#### `spring/spring-ecosystem.md` — 666 строк, 12 вопросов (1 J / 7 M / 4 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Spring Security `#security` | 274 | `security-filter-chain` (28), `authentication` (62), `authorization` (60), `jwt-filter` (63), `security-context-async` (30), `jwt-logout` (29) |
| Spring Kafka `#spring-kafka` | 75 | `kafka-listener` (38), `listener-config` (33) |
| Spring в гексагональной архитектуре `#spring-ddd` | 282 | `where-annotations` (132), `adapters-config` (92), `transactional-ddd` (35), `double-entities` (19) |

#### `spring/spring-mvc.md` — 569 строк, 12 вопросов (5 J / 6 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Путь запроса `#request-flow` | 138 | `dispatcherservlet` (46), `handler-adapter` (19), `controller-annotations` (40), `response-entity` (31) |
| Обработка исключений `#exception-handling` | 133 | `controller-advice` (80), `handler-resolution` (21), `problem-detail` (30) |
| Фильтры и интерсепторы `#filters-interceptors` | 175 | `filter-vs-interceptor` (43), `filter` (55), `interceptor` (75) |
| Валидация и CORS `#validation-cors` | 92 | `valid` (51), `cors` (39) |

#### `spring/spring-tools.md` — 654 строк, 14 вопросов (4 J / 9 M / 1 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Тестирование `#testing` | 241 | `test-slices` (28), `unit-tests` (60), `webmvctest` (60), `datajpatest` (48), `testcontainers` (43) |
| Кэширование `#caching` | 137 | `cacheable` (65), `redis-cache-config` (45), `condition-vs-unless` (23) |
| Actuator и Micrometer `#actuator-micrometer` | 141 | `actuator` (46), `micrometer` (53), `prometheus` (38) |
| Spring WebFlux `#webflux` | 101 | `why-reactive` (19), `mono-flux` (57), `webflux-vs-mvc` (23) |

#### `system-design/system-design.md` — 1410 строк, 45 вопросов (9 J / 22 M / 14 S)

| Раздел `##` | Строк | Темы `###` (строк) |
|---|---:|---|
| Сетевой фундамент `#network-basics` ⚠️ заглушка | 4 | — |
| Требования и оценки `#fundamentals` | 83 | `sync-async` (20), `metrics` (31), `estimation` (30) |
| Строительные блоки `#building-blocks` | 401 | `l4-l7` (29), `lb-algorithms` (19), `sticky-sessions` (17), `caching` (49), `eviction` (23), `cache-stampede` (34), `redis-hazelcast` (29), `sql-vs-nosql` (30), `replication` (32), `partitioning` (22), `sharding` (28), `consistent-hashing` (32), `message-queues` (34), `cdn` (21) |
| Теория распределённых систем `#distributed` | 273 | `cap` (26), `pacelc` (27), `consistency-models` (23), `consensus` (43), `delivery-guarantees` (25), `two-phase-commit` (35), `saga` (55), `outbox` (37) |
| Микросервисы `#microservices` | 78 | `monolith-vs-microservices` (20), `api-gateway` (31), `rate-limiting` (25) |
| Надёжность и эксплуатация `#reliability` | 233 | `timeout-retry` (31), `circuit-breaker` (44), `bulkhead` (18), `observability` (23), `health-checks` (17), `sidecar` (25), `scaling` (22), `polyglot-persistence` (22), `security` (27) |
| Собеседование `#interview` | 162 | `methodology` (70), `url-shortener` (55), `classic-tasks` (35) |
| Разбор кейсов `#cases` | 110 | `case-round-robin` (23), `case-stampede` (19), `case-sharding` (22), `case-partition` (21), `case-emails` (23) |

</details>

### 1.3. Пересечения тем

| Тема | Где лежит | Тип пересечения | Решение |
|---|---|---|---|
| CAP-теорема | `system-design.md#cap`, `nosql.md#cap-theorem` | **Полный дубль**: два «Ответа вслух», PACELC объяснён в обоих | Слить в `system-design/distributed-data.md#cap` |
| SQL или NoSQL | `system-design.md#sql-vs-nosql`, `nosql.md#nosql-vs-sql` | **Дубль**: оба отвечают «когда брать NoSQL», перечисляют четыре семейства | Слить в `database/nosql.md#nosql-vs-sql` |
| Polyglot persistence | `system-design.md#polyglot-persistence`, `nosql.md#polyglot` | **Дубль**: два «Ответа вслух» на один вопрос | Слить в `database/nosql.md#polyglot` |
| Rate limiting | `system-design.md#rate-limiting` (алгоритмы), `nosql.md#rate-limiting` (на Redis) | Одна тема в двух вкладках | Слить в `architecture/microservices.md#rate-limiting` |
| Наследование | `oop.md#inheritance`, `oop.md#fragile-base-class` | **Дубль на одной странице**: ответы вслух почти дословно совпадают | Слить в `design/composition.md#fragile-base-class` |
| Гарантии доставки | `system-design.md#delivery-guarantees`, `kafka-reliability.md#delivery-guarantees` | Частичный, **одинаковый id**: общие семантики и idempotency key против момента коммита оффсета | Общее — `architecture/distributed-transactions.md`, Kafka-специфика остаётся |
| Синхронно / асинхронно и очереди | `system-design.md#sync-async`, `system-design.md#message-queues` | Частичный, на одной странице: оба про развязку и буферизацию пиков | `sync-async` — к связи сервисов в архитектуре, очереди — строительный блок SD |
| Потокобезопасные коллекции | `multithreading.md#concurrent-collections`, `collections.md#concurrent-collections` | Заглушка со своей таблицей: `BlockingQueue` есть только в заглушке | Одна страница `concurrency/concurrent-collections.md` |
| Observability | `system-design.md#observability`, `infrastructure.md#observability` (заглушка), `spring-boot.md#actuator` (заглушка), `spring-tools.md#actuator-micrometer` | Одна тема в четырёх местах, две заглушки ссылаются друг на друга | Концепция — `infrastructure/observability.md`, Spring — `spring/spring-actuator.md` |
| Liveness и readiness | `system-design.md#health-checks` | Ссылка «подробно в Spring Boot → Actuator» ведёт на заглушку без содержимого | `infrastructure/kubernetes.md#health-checks` со ссылкой на Actuator |
| Кэширование | `system-design.md#caching`, `#eviction`, `#cache-stampede`, `#redis-hazelcast`; `nosql.md#cache-aside`; `spring-tools.md#cacheable` | Cache-Aside объяснён трижды (стратегия, ручной Redis, `@Cacheable`), Redis-кластер — в SD, а Redis — в NoSQL | Стратегии — `system-design/building-blocks.md`, всё на Spring и Redis — `spring/spring-caching.md`, кластер Redis — `nosql.md` |
| Гексагональная архитектура | `architecture.md#hexagonal`, `spring-ecosystem.md#spring-ddd` | Дополняют друг друга, но лежат в разных вкладках | Одна страница `architecture/hexagonal.md` |
| Микросервисы | `system-design.md#microservices`, `oop.md#microservices`; в навигации у `architecture.md` заявлены «микросервисы», на странице их нет | Тема размазана по трём вкладкам | `architecture/microservices.md` |
| Аутентификация | `system-design.md#security` (сессии vs JWT, OAuth), `spring-ecosystem.md#jwt-filter`, `#jwt-logout` | Частичный | `spring/spring-security.md#sessions-vs-jwt` |
| Куча, стек, HashMap, красно-чёрное дерево | `collections.md#priorityqueue`, `#stack-arraydeque`, `#hashmap`, `#treeify`; `algorithms.md#heap`, `#stack-queue`, `#hash-structures`, `#red-black-tree` | Частичный: устройство против применения в задачах, «Ответы вслух» повторяют друг друга | Устройство — дом в Java, в алгоритмах — сложность и применение со ссылкой; красно-чёрное дерево — дом в алгоритмах |
| Полиморфизм | `oop.md#polymorphism`, `oop.md#overload-vs-override` | Частичный: статический и динамический полиморфизм разобраны дважды | В `#polymorphism` — 2 предложения и ссылка |
| ThreadLocal | `jvm.md` (утечка ClassLoader), `spring-ecosystem.md` (`SecurityContextHolder`), `spring-mvc.md` (очистка в `afterCompletion`) | Упоминается в трёх местах, дома нет | Новая тема, см. [раздел 5](#5-что-добавить) |
| Паттерн Proxy | `spring-core.md#proxy`, `#jdk-proxy-vs-cglib`, `spring-data-jpa.md` | Spring-прокси разобраны, сам паттерн — нет | Новая тема, см. [раздел 5](#5-что-добавить) |

Пересечения, которые уже оформлены по правилу «один дом» и остаются: `basics.md#finally` → `exceptions.md#finally`, `spring-core.md#self-invocation` ↔ `spring-data-jpa.md#self-invocation-transactions`, `io-nio.md#io-decorator` → `patterns.md#decorator`.

---

## 2. Проблемы структуры

### 2.1. Страницы-гиганты

| Страница | Строк | Почему это проблема |
|---|---:|---|
| `java/multithreading.md` | 1522 | 35 вопросов от «поток vs процесс» до AQS и Loom. Оглавление не помещается на экран, «За час до собеса» показывает одну шпаргалку на 37 строк |
| `system-design/system-design.md` | 1410 | 45 вопросов из пяти разных областей: оценки, строительные блоки, распределённые системы, микросервисы, эксплуатация, интервью |
| `algorithms/leetcode-patterns.md` | 916 | Массивы и строки вперемешку с деревьями и ДП |
| `java/collections.md` | 872 | HashMap (237 строк) и потокобезопасные коллекции (159) — самостоятельные темы |
| `java/streams.md` | 793 | Optional и функциональные интерфейсы (267 строк) — не про стримы |
| `algorithms/algorithms.md` | 791 | Структуры данных и графы с сортировками |
| `networks/networks.md` | 747 | Транспорт и HTTP вместе со стилями API и WebSocket |
| `java/oop.md` | 718 | Язык (интерфейсы, перегрузка) вместе с дизайном (композиция, зацепление, микросервисы) |

### 2.2. Страницы со смешанными темами

| Страница | Что смешано |
|---|---|
| `spring/spring-ecosystem.md` | Spring Security (274 строки) + Spring Kafka (75) + Spring в гексагональной архитектуре (282). Общего — только слово «Spring» |
| `spring/spring-tools.md` | Тестирование (241) + кэширование (137) + Actuator и Micrometer (141) + WebFlux (101). WebFlux — не инструмент, а веб-стек |
| `system-design/system-design.md` | Помимо SD: микросервисы, Saga и Outbox (это архитектура), observability, sidecar и пробы (инфраструктура), безопасность (Spring Security), выбор и кластеризация БД (данные) |
| `infrastructure/infrastructure.md` | Docker, Compose, CI/CD, миграции БД, Kubernetes (одна тема на 21 строку), заглушка observability, reverse proxy |
| `spring/spring-data-jpa.md` | Транзакции Spring (`@Transactional`, propagation) + блокировки + Hibernate. На собесе это два разных блока |
| `database/sql.md` | Транзакции, изоляция и MVCC + запросы, индексы и нормализация |
| `database/nosql.md` | Семейства NoSQL + CAP + раздел «Redis в Spring Boot» (Spring-код в разделе «Данные») |

### 2.3. Темы не в своём разделе

| Тема | Сейчас | Где её ищут |
|---|---|---|
| Spring Kafka (`@KafkaListener`, коммит, обработка ошибок) | Spring → «Security, Kafka, DDD» | Kafka: вопрос задают в блоке про Kafka, рядом с коммитом оффсетов и DLQ |
| Spring в гексагональной архитектуре | Spring → «Security, Kafka, DDD» | Архитектура, рядом с `#hexagonal` |
| Saga, Outbox, 2PC, микросервисы, circuit breaker | «Масштабирование систем» | Архитектура: блок про микросервисы |
| Observability, liveness/readiness, sidecar | «Масштабирование систем» | Инфраструктура |
| Сессии vs JWT, OAuth | «Масштабирование систем» | Spring Security |
| Cohesion и coupling в микросервисах (`oop.md#microservices`) | ООП | Архитектура |
| Ручной Cache-Aside и rate limiting на Redis через `RedisTemplate` | Данные → NoSQL | Spring (кэширование) и архитектура (rate limiting) |
| SOLID и паттерны | Вкладка «Язык Java» | Дизайн кода: отдельный блок вопросов, не про язык |
| Многопоточность | Группа «Платформа и память» | Отдельный блок собеса, самая большая тема Java |

### 2.4. Неудачные названия в навигации

- **«Security, Kafka, DDD»** — перечисление трёх несвязанных тем вместо названия; H1 страницы при этом «Spring: экосистема и архитектура».
- **«Тестирование и инструменты»** — под «инструментами» спрятаны кэш, Actuator и WebFlux: по названию не найти ни одного из них.
- **«DDD, микросервисы, CQRS»** — микросервисов на странице нет, они в `system-design.md`.
- **«Масштабирование систем»** — масштабированию посвящена четверть страницы; остальное — теория распределённых систем, микросервисы, надёжность, интервью.
- **«Физика брокера»** — жаргон. **«Consumer и Producer»** — продюсеру посвящена одна тема (ключи), а `acks` продюсера — на странице «Гарантии доставки».
- **«Теория (Big O, структуры, сортировки)», «HTTP, TCP, REST, gRPC», «Docker, CI/CD, K8s»** — перечисления в скобках устаревают при росте страницы: в «Docker, CI/CD, K8s» нет миграций БД, а это 125 строк.
- **Вкладка «Язык Java»** содержит SOLID и паттерны, **«Проектирование»** — System Design (отдельный этап собеса) вместе с Docker и Kubernetes.
- **Подразделы из одной страницы** — «Реляционные», «Нереляционные», «Сети», «Системы», «Архитектура приложений», «Инфраструктура»: лишний уровень в боковом меню.
- **Навигация расходится с H1**: «Core (IoC, DI, AOP)» — «Spring Core», «Spring MVC / REST» — «Spring Web / MVC», «Коллекции» — «Collections», «Дженерики» — «Generics (Дженерики)», «SQL и транзакции» — «SQL и базы данных», «Docker, CI/CD, K8s» — «Инфраструктура (DevOps)».

### 2.5. Разделы-заглушки

Пять разделов `##` состоят из одной ссылки на другую страницу и занимают место в оглавлении: `system-design.md#network-basics`, `infrastructure.md#observability`, `spring-boot.md#actuator`, `algorithms.md#techniques`, `multithreading.md#concurrent-collections`. Последние два ещё и дублируют содержимое дома. После переезда ссылки ведут прямо на дом темы, а заглушки удаляются.

### 2.6. Что ещё устареет

- `STYLE.md` называет эталоном тона `multithreading.md` и `system-design.md`: обе страницы расформировываются, эталоном станут `concurrency/jmm.md` и `system-design/building-blocks.md`.
- Таблица «Один дом у темы» в `STYLE.md` указывает на старые пути (`collections.md` для потокобезопасных коллекций, `spring-tools.md` для `@Cacheable` и т. д.).

---

## 3. Новая навигация

### 3.1. Принципы

1. **Вкладка — этап собеса.** Порядок вкладок повторяет типичный порядок вопросов: Java Core → многопоточность → дизайн кода → Spring → данные → Kafka → System Design → архитектура → инфраструктура → алгоритмы.
2. **Страница — одна тема на 200–700 строк.** Страница меньше 200 строк появляется только вместе с новыми темами из раздела 5; до этого её темы живут на соседней странице (запасной вариант указан в дереве).
3. **Папка = вкладка.** Новые папки: `concurrency/`, `design/`. Остальные папки сохраняются, чтобы не ломать URL без необходимости.
4. **Название в навигации = H1 страницы.** Без перечислений в скобках.
5. **Подразделы в боковом меню — только там, где страницы делятся на группы по 2+ страницы**: Java (13 страниц), Spring (9), Computer Science (6). Остальные вкладки плоские.
6. **Новые страницы Spring — с префиксом `spring-`**, как существующие. Заодно это убирает коллизию id страниц в генераторе: `transactions.md` и `observability.md` иначе встретились бы дважды.

### 3.2. Отступления от ориентира

| Ориентир | Решение | Почему |
|---|---|---|
| JVM — отдельная вкладка | JVM — подраздел вкладки **Java** | На собесе JVM спрашивают внутри блока Java Core. Во вкладке было бы 2 страницы, а горизонтальных вкладок и так 12 |
| Spring одной группой | Spring-транзакции — во вкладке Spring, аномалии и блокировки — в **Данных** | `@Transactional` и propagation — вопросы про Spring, а lost update и `SELECT … FOR UPDATE` — про БД. JPA-блокировки (`@Version`, `@Lock`) едут к lost update: это ответ на один вопрос |
| WebFlux — отдельно | WebFlux — раздел в «Spring MVC и WebFlux» | 101 строка не тянет на страницу, а «MVC или WebFlux?» удобнее читать рядом с MVC. Отдельная страница — когда появятся backpressure и `WebClient` |
| Надёжность (circuit breaker, retry) в System Design | В **Архитектуре**, на странице «Микросервисы» | На собесе это вопросы про микросервисы; в SD их достаточно назвать |
| CAP, репликация, шардирование | В **System Design**, страница «Распределённые данные» | Это фундамент SD-интервью; Saga и Outbox при этом уходят в Архитектуру |

Вкладок 12 вместе со «Стартом». При `navigation.tabs` они видны от 1220 px; на этой ширине влезают по прикидке (~950 px текста). Если не влезут — сократить подписи до «CS» и «Инфра» или убрать вкладку «Старт», сделав главную первой страницей «Подготовки».

### 3.3. Дерево

Число — ожидаемый размер страницы: перенесённые темы + ~30 строк на front matter, вступление и шпаргалку. «→ N» — размер после новых тем из раздела 5. ✨ — новая страница, ✂️ — часть старой страницы, 🔀 — слияние нескольких источников.

```text
Старт                                         index.md
Подготовка
├── За час до собеса                          prep/last-hour.md            (генерируется)
├── Вопросы собеса                            prep/questions.md            (генерируется)
├── Что выведет код? ✨                        prep/code-output.md          ~300
└── Теги                                      prep/tags.md
Java
├── Язык
│   ├── Основы языка                          java/basics.md               ~650
│   ├── Строки                                java/strings.md              ~220
│   ├── ООП ✂️                                 java/oop.md                  ~460
│   ├── Исключения                            java/exceptions.md           ~375
│   ├── Дженерики                             java/generics.md             ~570
│   └── Современная Java                      java/modern-java.md          ~260
├── Коллекции и API
│   ├── Коллекции ✂️                           java/collections.md          ~510
│   ├── HashMap ✂️                             java/hashmap.md              ~265
│   ├── Stream API ✂️                          java/streams.md              ~520
│   ├── Лямбды и Optional ✂️                   java/functional.md           ~295
│   └── IO / NIO                              java/io-nio.md               ~545
└── JVM
    ├── Память и сборка мусора                java/jvm.md                  ~505
    └── Загрузка классов и JIT ✨              java/classloading-jit.md     ~250
Многопоточность
├── Потоки и ThreadLocal ✂️                    concurrency/threads.md       ~195 → ~275
├── Блокировки и синхронизаторы ✂️             concurrency/locks.md         ~300
├── JMM, volatile и атомики ✂️                 concurrency/jmm.md           ~290
├── Deadlock, livelock, starvation ✂️          concurrency/deadlock.md      ~345
├── Пулы потоков и CompletableFuture ✂️        concurrency/executors.md     ~335
├── Потокобезопасные коллекции 🔀              concurrency/concurrent-collections.md  ~140 → ~220
└── Виртуальные потоки ✂️                      concurrency/virtual-threads.md         ~155 → ~215
Дизайн кода
├── Композиция и зацепление ✂️                 design/composition.md        ~245
├── SOLID                                     design/solid.md              ~515
├── Порождающие паттерны ✂️                    design/creational-patterns.md  ~330
├── Структурные паттерны ✂️                    design/structural-patterns.md  ~110 → ~290  (запасной вариант: вместе с поведенческими)
└── Поведенческие паттерны ✂️                  design/behavioral-patterns.md  ~205 → ~330
Spring
├── Ядро
│   ├── Spring Core: IoC, DI, AOP             spring/spring-core.md        ~550
│   └── Spring Boot                           spring/spring-boot.md        ~465
├── Веб
│   ├── Spring MVC и WebFlux 🔀                spring/spring-mvc.md         ~660
│   └── Spring Security 🔀                     spring/spring-security.md    ~330
├── Работа с БД
│   ├── Транзакции в Spring ✂️                 spring/spring-transactions.md  ~370
│   ├── Spring Data JPA и Hibernate ✂️         spring/spring-data-jpa.md    ~225 → ~365
│   └── Кэширование 🔀                         spring/spring-caching.md     ~215
└── Тесты и эксплуатация
    ├── Тестирование ✂️                        spring/spring-testing.md     ~270
    └── Actuator и Micrometer ✂️               spring/spring-actuator.md    ~165 → ~220
Данные
├── SQL и индексы ✂️                           database/sql.md              ~370
├── Транзакции и MVCC ✂️                       database/transactions.md     ~320
├── Блокировки и конкурентные обновления ✨    database/locking.md          ~115 → ~290
└── NoSQL 🔀                                   database/nosql.md            ~530
Kafka
├── Брокер: топики, партиции, хранение        kafka/kafka.md               ~300
├── Порядок, группы и ребаланс                kafka/kafka-consumer-producer.md  ~330
├── Гарантии доставки                         kafka/kafka-reliability.md   ~385
└── Kafka в Spring ✂️                          kafka/spring-kafka.md        ~100 → ~220  (запасной вариант: раздел в «Гарантиях доставки»)
System Design
├── Интервью и оценка нагрузки ✂️              system-design/interview.md   ~380
├── Строительные блоки ✂️                      system-design/building-blocks.md   ~255
└── Распределённые данные 🔀                   system-design/distributed-data.md  ~300
Архитектура
├── DDD, CQRS и Event Sourcing                architecture/ddd.md          ~335
├── Слоистая и гексагональная архитектура 🔀   architecture/hexagonal.md    ~400
├── Микросервисы и отказоустойчивость 🔀       architecture/microservices.md  ~310
└── Распределённые транзакции ✂️               architecture/distributed-transactions.md  ~180 → ~240
Инфраструктура
├── Docker и Compose ✂️                        infrastructure/docker.md     ~385
├── CI/CD и миграции БД ✂️                     infrastructure/cicd.md       ~240
├── Kubernetes 🔀                              infrastructure/kubernetes.md ~110 → ~250
└── Observability 🔀                           infrastructure/observability.md  ~55 → ~220  (запасной вариант: раздел в «Kubernetes»)
Computer Science
├── Алгоритмы
│   ├── Big O и структуры данных ✂️            algorithms/algorithms.md     ~480
│   ├── Сортировки и графы ✂️                  algorithms/sorting-graphs.md ~320
│   ├── Задачи: массивы и строки ✂️            algorithms/leetcode-patterns.md  ~580
│   └── Задачи: деревья, графы, ДП ✂️          algorithms/leetcode-trees-dp.md  ~345 → ~405
└── Сети
    ├── TCP/IP, HTTP и TLS ✂️                  networks/networks.md         ~505
    └── REST, gRPC и WebSocket ✂️              networks/api-styles.md       ~250
```

### 3.4. Черновик `nav` для `mkdocs.yml`

```yaml
nav:
  - Старт: index.md

  - Подготовка:
      - За час до собеса: prep/last-hour.md
      - Вопросы собеса: prep/questions.md
      - Что выведет код?: prep/code-output.md
      - Теги: prep/tags.md

  - Java:
      - Язык:
          - Основы языка: java/basics.md
          - Строки: java/strings.md
          - ООП: java/oop.md
          - Исключения: java/exceptions.md
          - Дженерики: java/generics.md
          - Современная Java: java/modern-java.md
      - Коллекции и API:
          - Коллекции: java/collections.md
          - HashMap: java/hashmap.md
          - Stream API: java/streams.md
          - Лямбды и Optional: java/functional.md
          - IO / NIO: java/io-nio.md
      - JVM:
          - Память и сборка мусора: java/jvm.md
          - Загрузка классов и JIT: java/classloading-jit.md

  - Многопоточность:
      - Потоки и ThreadLocal: concurrency/threads.md
      - Блокировки и синхронизаторы: concurrency/locks.md
      - JMM, volatile и атомики: concurrency/jmm.md
      - Deadlock, livelock, starvation: concurrency/deadlock.md
      - Пулы потоков и CompletableFuture: concurrency/executors.md
      - Потокобезопасные коллекции: concurrency/concurrent-collections.md
      - Виртуальные потоки: concurrency/virtual-threads.md

  - Дизайн кода:
      - Композиция и зацепление: design/composition.md
      - SOLID: design/solid.md
      - Порождающие паттерны: design/creational-patterns.md
      - Структурные паттерны: design/structural-patterns.md
      - Поведенческие паттерны: design/behavioral-patterns.md

  - Spring:
      - Ядро:
          - "Spring Core: IoC, DI, AOP": spring/spring-core.md
          - Spring Boot: spring/spring-boot.md
      - Веб:
          - Spring MVC и WebFlux: spring/spring-mvc.md
          - Spring Security: spring/spring-security.md
      - Работа с БД:
          - Транзакции в Spring: spring/spring-transactions.md
          - Spring Data JPA и Hibernate: spring/spring-data-jpa.md
          - Кэширование: spring/spring-caching.md
      - Тесты и эксплуатация:
          - Тестирование: spring/spring-testing.md
          - Actuator и Micrometer: spring/spring-actuator.md

  - Данные:
      - SQL и индексы: database/sql.md
      - Транзакции и MVCC: database/transactions.md
      - Блокировки и конкурентные обновления: database/locking.md
      - NoSQL: database/nosql.md

  - Kafka:
      - "Брокер: топики, партиции, хранение": kafka/kafka.md
      - Порядок, группы и ребаланс: kafka/kafka-consumer-producer.md
      - Гарантии доставки: kafka/kafka-reliability.md
      - Kafka в Spring: kafka/spring-kafka.md

  - System Design:
      - Интервью и оценка нагрузки: system-design/interview.md
      - Строительные блоки: system-design/building-blocks.md
      - Распределённые данные: system-design/distributed-data.md

  - Архитектура:
      - DDD, CQRS и Event Sourcing: architecture/ddd.md
      - Слоистая и гексагональная архитектура: architecture/hexagonal.md
      - Микросервисы и отказоустойчивость: architecture/microservices.md
      - Распределённые транзакции: architecture/distributed-transactions.md

  - Инфраструктура:
      - Docker и Compose: infrastructure/docker.md
      - CI/CD и миграции БД: infrastructure/cicd.md
      - Kubernetes: infrastructure/kubernetes.md
      - Observability: infrastructure/observability.md

  - Computer Science:
      - Алгоритмы:
          - Big O и структуры данных: algorithms/algorithms.md
          - Сортировки и графы: algorithms/sorting-graphs.md
          - "Задачи: массивы и строки": algorithms/leetcode-patterns.md
          - "Задачи: деревья, графы, ДП": algorithms/leetcode-trees-dp.md
      - Сети:
          - TCP/IP, HTTP и TLS: networks/networks.md
          - REST, gRPC и WebSocket: networks/api-styles.md
```

---

## 4. Переезды: старый путь#id → новый путь#id

### 4.1. Правила

- **id тем сохраняются.** Тема переезжает вместе со своим `{ #id }`, раздел `##` — со своим id и всеми темами внутри. Ссылки чинятся заменой пути, якорь остаётся.
- **Слияние** — у темы-дома остаётся её id, из второй темы переносятся недостающие факты, код и ловушки; вторая тема удаляется, ссылки на неё перенаправляются на дом.
- **Заглушки** (раздел из одной ссылки) удаляются.
- **Шпаргалка** делится: строки уезжают вместе со своими темами; у каждой новой страницы — своя `## Шпаргалка { #cheatsheet }` в маркерах snippets.
- **Теги** front matter пересчитываются для каждой новой страницы по правилу STYLE: уровень — если на странице хотя бы два вопроса этого уровня.

### 4.2. Старые страницы

| Старая страница | Что с ней происходит | Новые страницы |
|---|---|---|
| `java/basics.md`, `strings.md`, `modern-java.md`, `exceptions.md`, `generics.md`, `io-nio.md`, `jvm.md` | Остаются целиком | — |
| `java/oop.md` | ✂️ Делится: язык остаётся, дизайн уезжает | `java/oop.md`, `design/composition.md`, тема — в `architecture/microservices.md` |
| `java/collections.md` | ✂️ Делится | `java/collections.md`, `java/hashmap.md`, `concurrency/concurrent-collections.md` |
| `java/streams.md` | ✂️ Делится | `java/streams.md`, `java/functional.md` |
| `java/multithreading.md` | ✂️ Расформировывается | 7 страниц `concurrency/*` |
| `java/solid.md` | Переезжает | `design/solid.md` |
| `java/patterns.md` | ✂️ Делится по группам GoF | `design/creational-patterns.md`, `design/structural-patterns.md`, `design/behavioral-patterns.md` |
| `spring/spring-core.md`, `spring-boot.md` | Остаются (из `spring-boot.md` удаляется заглушка `#actuator`) | — |
| `spring/spring-mvc.md` | Остаётся, получает раздел WebFlux | `spring/spring-mvc.md` |
| `spring/spring-data-jpa.md` | ✂️ Делится | `spring/spring-transactions.md`, `spring/spring-data-jpa.md` (Hibernate), `database/locking.md` |
| `spring/spring-ecosystem.md` | ✂️ Расформировывается | `spring/spring-security.md`, `kafka/spring-kafka.md`, `architecture/hexagonal.md` |
| `spring/spring-tools.md` | ✂️ Расформировывается | `spring/spring-testing.md`, `spring/spring-caching.md`, `spring/spring-actuator.md`, `spring/spring-mvc.md` |
| `database/sql.md` | ✂️ Делится | `database/sql.md`, `database/transactions.md` |
| `database/nosql.md` | Остаётся, отдаёт CAP, Cache-Aside и rate limiting, принимает SQL vs NoSQL, polyglot и кластер Redis | `database/nosql.md` + 3 страницы |
| `kafka/*.md` | Остаются, меняются только названия в навигации | — |
| `algorithms/algorithms.md` | ✂️ Делится | `algorithms/algorithms.md`, `algorithms/sorting-graphs.md` |
| `algorithms/leetcode-patterns.md` | ✂️ Делится | `algorithms/leetcode-patterns.md`, `algorithms/leetcode-trees-dp.md` |
| `networks/networks.md` | ✂️ Делится | `networks/networks.md`, `networks/api-styles.md` |
| `system-design/system-design.md` | ✂️ Расформировывается | 3 страницы `system-design/*` + темы в Данных, Архитектуре, Инфраструктуре и Spring |
| `architecture/architecture.md` | ✂️ Делится | `architecture/ddd.md`, `architecture/hexagonal.md`, тема — в `architecture/microservices.md` |
| `infrastructure/infrastructure.md` | ✂️ Расформировывается | `infrastructure/docker.md`, `infrastructure/cicd.md`, `infrastructure/kubernetes.md` |

### 4.3. Какие id меняются

Только при слиянии или коллизии с id раздела на новой странице:

| Было | Стало | Причина |
|---|---|---|
| `java/oop.md#inheritance` | `design/composition.md#fragile-base-class` | Слияние дублей |
| `java/oop.md#microservices` | `architecture/microservices.md#service-boundaries` | id `microservices` занят разделом |
| `database/nosql.md#cap-theorem` | `system-design/distributed-data.md#cap` | Слияние с `system-design.md#cap` |
| `system-design.md#sql-vs-nosql` | `database/nosql.md#nosql-vs-sql` | Слияние |
| `system-design.md#polyglot-persistence` | `database/nosql.md#polyglot` | Слияние |
| `database/nosql.md#rate-limiting` | `architecture/microservices.md#rate-limiting` | Слияние с `system-design.md#rate-limiting` |
| `system-design.md#redis-hazelcast` | `database/nosql.md#redis-cluster` | Вопрос про кластер Redis, рядом с key-value |
| `system-design.md#security` | `spring/spring-security.md#sessions-vs-jwt` | id `security` занят разделом Spring Security |

Плюс в `java/collections.md` для `#cme`, оставшейся без раздела, появляется раздел `## Итераторы { #iterators }`, а в `database/nosql.md` для polyglot — раздел `## Другие хранилища { #other-stores }`.

### 4.4. Темы

Строк — размер в старой странице. Если тема `###` едет вместе со своим разделом, она перечислена в строке раздела; отдельной строкой ↳ показаны темы, которые едут не туда, куда их раздел, или с особым действием.

#### `algorithms/algorithms.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#big-o`** Big O: `#big-o-basics`, `#simplification`, `#space-complexity` | 108 | `algorithms/algorithms.md` | остаётся |
| **`#data-structures`** Структуры данных: `#array-linkedlist` | 187 | `algorithms/algorithms.md` | остаётся |
| &nbsp;&nbsp;↳ `#hash-structures` | 49 | остаётся | оставить только сложность в задачах; устройство — ссылка на `java/hashmap.md` |
| &nbsp;&nbsp;↳ `#stack-queue` | 38 | остаётся | сократить до применения в задачах; устройство `ArrayDeque` — дом `java/collections.md#stack-arraydeque` |
| &nbsp;&nbsp;↳ `#heap` | 44 | остаётся | сократить до применения в задачах (Top-K, слияние k списков); устройство кучи — дом `java/collections.md#priorityqueue` |
| **`#trees`** Деревья: `#tree-traversal`, `#tree-bfs` | 113 | `algorithms/algorithms.md` | остаётся |
| &nbsp;&nbsp;↳ `#red-black-tree` | 21 | остаётся | дом красно-чёрного дерева; `java/hashmap.md#treeify` ссылается сюда |
| **`#sorting`** Сортировки: `#sorting-overview`, `#merge-sort`, `#quick-sort` | 119 | `algorithms/sorting-graphs.md` | переезжает с id |
| **`#graphs`** Графы: `#graph-representation`, `#graph-bfs`, `#graph-dfs`, `#dijkstra` | 173 | `algorithms/sorting-graphs.md` | переезжает с id |
| **`#techniques`** Техники решения задач | 4 | — | заглушка со ссылкой удаляется: ссылки ведут прямо на дом темы |
| **`#summary`** Сводные таблицы: `#structures-complexity`, `#algorithms-complexity` | 52 | `algorithms/algorithms.md` | остаётся |

#### `algorithms/leetcode-patterns.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#approach`** Подход к задаче: `#framework`, `#edge-cases` | 65 | `algorithms/leetcode-patterns.md` | остаётся |
| **`#two-pointers`** Two Pointers (два указателя): `#two-pointers-basics`, `#three-sum` | 107 | `algorithms/leetcode-patterns.md` | остаётся |
| **`#sliding-window`** Sliding Window (скользящее окно): `#sliding-window-basics`, `#longest-substring`, `#min-window` | 150 | `algorithms/leetcode-patterns.md` | остаётся |
| **`#prefix-sum`** Prefix Sum (префиксные суммы): `#prefix-sum-basics` | 33 | `algorithms/leetcode-patterns.md` | остаётся |
| **`#hashmap`** HashMap для частот и индексов: `#two-sum`, `#group-anagrams` | 75 | `algorithms/leetcode-patterns.md` | остаётся |
| **`#binary-search`** Бинарный поиск: `#rotated-array` | 53 | `algorithms/leetcode-patterns.md` | остаётся |
| **`#dfs`** DFS на дереве и графе: `#validate-bst`, `#islands` | 84 | `algorithms/leetcode-trees-dp.md` | переезжает с id |
| **`#bfs`** BFS — кратчайший путь: `#maze` | 53 | `algorithms/leetcode-trees-dp.md` | переезжает с id |
| **`#dp`** Динамическое программирование: `#dp-basics`, `#kadane`, `#coin-change`, `#lcs` | 185 | `algorithms/leetcode-trees-dp.md` | переезжает с id |
| **`#stack`** Стек для скобок и монотонных задач: `#valid-parentheses`, `#monotonic-stack` | 83 | `algorithms/leetcode-patterns.md` | остаётся |

#### `architecture/architecture.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#ddd`** Domain-Driven Design (DDD): `#ubiquitous-language`, `#bounded-context`, `#context-mapping`, `#aggregate`, `#rich-domain-model`, `#value-object`, `#domain-events` | 224 | `architecture/ddd.md` | переезжает с id |
| **`#styles`** Архитектурные стили: `#layered`, `#hexagonal`, `#layered-vs-hexagonal` | 111 | `architecture/hexagonal.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#modular-monolith` | 17 | `architecture/microservices.md#modular-monolith` | рядом с «Монолит или микросервисы?» |
| **`#cqrs-es`** CQRS и Event Sourcing: `#cqrs`, `#event-sourcing` | 83 | `architecture/ddd.md` | переезжает с id |

#### `database/nosql.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#why-nosql`** Зачем NoSQL | 26 | `database/nosql.md` | остаётся |
| &nbsp;&nbsp;↳ `#nosql-vs-sql` | 24 | остаётся | **слияние** с `system-design.md#sql-vs-nosql`, дом здесь |
| **`#families`** Семейства NoSQL: `#document-store`, `#key-value`, `#wide-column`, `#graph`, `#comparison` | 354 | `database/nosql.md` | остаётся |
| **`#cap`** CAP-теорема | 38 | — | раздел расформировывается по темам ниже |
| &nbsp;&nbsp;↳ `#cap-theorem` | 36 | `system-design/distributed-data.md#cap` | **слияние** с `system-design.md#cap`: из NoSQL берётся таблица «база → CP/AP» |
| **`#redis-patterns`** Redis в Spring Boot | 138 | — | раздел расформировывается по темам ниже |
| &nbsp;&nbsp;↳ `#cache-aside` | 51 | `spring/spring-caching.md#cache-aside` | ручной Cache-Aside — рядом с `@Cacheable` |
| &nbsp;&nbsp;↳ `#polyglot` | 43 | остаётся | **слияние** с `system-design.md#polyglot-persistence` (S3, time-series, поиск, geo), дом здесь |
| &nbsp;&nbsp;↳ `#rate-limiting` | 42 | `architecture/microservices.md#rate-limiting` | **слияние** с `system-design.md#rate-limiting`: алгоритмы + реализация на Redis |

#### `database/sql.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#acid`** ACID: `#acid-properties`, `#wal` | 67 | `database/transactions.md` | переезжает с id |
| **`#isolation`** Изоляция транзакций: `#read-anomalies`, `#isolation-levels`, `#serializable` | 112 | `database/transactions.md` | переезжает с id |
| **`#mvcc`** MVCC: `#mvcc-how`, `#mvcc-isolation`, `#vacuum`, `#mvcc-postgres-vs-mysql` | 116 | `database/transactions.md` | переезжает с id |
| **`#indexes`** Индексы: `#how-index`, `#index-types`, `#index-not-used`, `#explain` | 126 | `database/sql.md` | остаётся |
| **`#queries`** SQL-запросы: `#joins`, `#group-by`, `#window-functions`, `#cte` | 157 | `database/sql.md` | остаётся |
| **`#normalization`** Нормализация: `#normal-forms`, `#denormalization` | 65 | `database/sql.md` | остаётся |

#### `infrastructure/infrastructure.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#docker`** Docker: `#why-docker`, `#container-vs-vm`, `#image-container`, `#namespaces-cgroups`, `#dockerfile`, `#base-images`, `#non-root` | 184 | `infrastructure/docker.md` | переезжает с id |
| **`#compose`** Docker Compose: `#compose-dns`, `#healthcheck`, `#compose-profiles`, `#kraft`, `#docker-networks`, `#volumes` | 173 | `infrastructure/docker.md` | переезжает с id |
| **`#cicd`** CI/CD: `#ci-cd`, `#pipeline`, `#deploy-strategies` | 88 | `infrastructure/cicd.md` | переезжает с id |
| **`#migrations`** Миграции БД: `#flyway`, `#migrations-cicd`, `#flyway-checksum`, `#flyway-lock`, `#zero-downtime` | 125 | `infrastructure/cicd.md` | переезжает с id |
| **`#kubernetes`** Kubernetes: `#k8s-basics` | 23 | `infrastructure/kubernetes.md` | переезжает с id |
| **`#observability`** Observability | 4 | — | заглушка со ссылкой удаляется: ссылки ведут прямо на дом темы |
| **`#proxy-gateway`** Reverse proxy и API Gateway | 19 | `infrastructure/kubernetes.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#reverse-proxy` | 17 | `infrastructure/kubernetes.md#reverse-proxy` | вместе с Ingress |

#### `java/basics.md` — остаётся целиком


#### `java/collections.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#hierarchy`** Иерархия и интерфейсы: `#collection-hierarchy`, `#map-not-collection` | 94 | `java/collections.md` | остаётся |
| **`#lists`** Списки: ArrayList и LinkedList: `#arraylist`, `#linkedlist`, `#insert-middle`, `#cache-locality` | 138 | `java/collections.md` | остаётся |
| **`#hashmap`** HashMap: `#hashmap-internals`, `#bucket-index`, `#collisions`, `#rehashing`, `#treeify`, `#map-choice` | 237 | `java/hashmap.md` | переезжает с id |
| **`#sets`** Множества: `#hashset`, `#treeset`, `#comparable-comparator` | 122 | `java/collections.md` | остаётся |
| **`#queues`** Очереди и стеки: `#stack-arraydeque`, `#priorityqueue` | 84 | `java/collections.md` | остаётся |
| **`#concurrent-collections`** Итераторы и потокобезопасные коллекции: `#hashtable-vector`, `#concurrenthashmap`, `#copyonwritearraylist` | 159 | `concurrency/concurrent-collections.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#cme` | 50 | остаётся | остаётся: это однопоточная проблема итератора; раздел `## Итераторы { #iterators }` |

#### `java/exceptions.md` — остаётся целиком


#### `java/generics.md` — остаётся целиком


#### `java/io-nio.md` — остаётся целиком


#### `java/jvm.md` — остаётся целиком


#### `java/modern-java.md` — остаётся целиком


#### `java/multithreading.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#basics`** Фундамент: `#thread-vs-process`, `#thread-vs-runnable`, `#thread-states`, `#join-sleep-yield`, `#interrupt` | 167 | `concurrency/threads.md` | переезжает с id |
| **`#monitors`** Мониторы и `wait`/`notify`: `#synchronized`, `#wait-notify` | 78 | `concurrency/locks.md` | переезжает с id |
| **`#jmm`** Java Memory Model (JMM): `#jmm-basics`, `#happens-before`, `#volatile`, `#final-fields` | 144 | `concurrency/jmm.md` | переезжает с id |
| **`#locks-atomics`** Блокировки и атомики: `#reentrantlock`, `#rwlock-condition` | 123 | `concurrency/locks.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#atomics` | 26 | `concurrency/jmm.md#atomics` | атомики — рядом с CAS |
| &nbsp;&nbsp;↳ `#longadder` | 23 | `concurrency/jmm.md#longadder` | переезжает |
| **`#concurrent-collections`** Потокобезопасные коллекции | 12 | — | таблица `BlockingQueue` переносится в `concurrency/concurrent-collections.md`, остальное — дубль |
| **`#synchronizers`** Синхронизаторы: `#latch-barrier`, `#semaphore` | 74 | `concurrency/locks.md` | переезжает с id |
| **`#liveness`** Deadlock, livelock, starvation: `#deadlock`, `#deadlock-detection`, `#deadlock-prevention`, `#livelock-starvation` | 320 | `concurrency/deadlock.md` | переезжает с id |
| **`#executors`** Пулы потоков (Executors): `#why-pools`, `#thread-pool-executor`, `#executors-factories`, `#forkjoinpool` | 179 | `concurrency/executors.md` | переезжает с id |
| **`#async`** Асинхронность: `Future` и `CompletableFuture`: `#future`, `#completablefuture`, `#cf-errors` | 128 | `concurrency/executors.md` | переезжает с id |
| **`#under-the-hood`** Под капотом: `#aqs`, `#park-unpark` | 120 | `concurrency/locks.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#cas-aba` | 41 | `concurrency/jmm.md#cas-aba` | переезжает |
| &nbsp;&nbsp;↳ `#false-sharing` | 27 | `concurrency/jmm.md#false-sharing` | переезжает |
| **`#loom`** Project Loom (Java 21+): `#virtual-threads`, `#pinning`, `#structured-concurrency` | 127 | `concurrency/virtual-threads.md` | переезжает с id |

#### `java/oop.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#principles`** Принципы ООП: `#what-is-oop`, `#encapsulation`, `#abstraction`, `#polymorphism` | 202 | `java/oop.md` | остаётся |
| &nbsp;&nbsp;↳ `#inheritance` | 31 | `design/composition.md#fragile-base-class` | **слияние**: тот же ответ, что у `#fragile-base-class` |
| **`#interfaces`** Интерфейсы и абстрактные классы: `#interface-vs-abstract`, `#interface-methods`, `#interface-state` | 139 | `java/oop.md` | остаётся |
| **`#override-overload`** Override и Overload: `#signature`, `#overload-vs-override`, `#covariant-return` | 129 | `java/oop.md` | остаётся |
| **`#composition`** Композиция и наследование: `#fragile-base-class`, `#when-inherit` | 126 | `design/composition.md` | переезжает с id |
| **`#coupling-cohesion`** Связность и зацепление: `#cohesion-coupling` | 93 | `design/composition.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#microservices` | 30 | `architecture/microservices.md#service-boundaries` | **слияние** с новой темой «Как нарезать сервисы»; id `microservices` занят разделом |

#### `java/patterns.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#creational`** Порождающие паттерны: `#singleton`, `#enum-singleton`, `#builder`, `#factory-method` | 302 | `design/creational-patterns.md` | переезжает с id |
| **`#structural`** Структурные паттерны: `#decorator` | 86 | `design/structural-patterns.md` | переезжает с id |
| **`#behavioral`** Поведенческие паттерны: `#strategy`, `#observer` | 180 | `design/behavioral-patterns.md` | переезжает с id |

#### `java/solid.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#principles`** Принципы SOLID: `#srp`, `#ocp`, `#lsp`, `#isp`, `#dip` | 486 | `design/solid.md` | переезжает с id |

#### `java/streams.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#basics`** Основы: `#what-is-stream`, `#intermediate-terminal`, `#map-flatmap` | 124 | `java/streams.md` | остаётся |
| **`#pipeline`** Как работает конвейер: `#vertical`, `#short-circuit`, `#primitive-streams`, `#parallel` | 134 | `java/streams.md` | остаётся |
| **`#collectors`** Collectors: `#to-list`, `#to-map`, `#grouping`, `#joining` | 164 | `java/streams.md` | остаётся |
| **`#optional`** Optional: `#optional-basics`, `#orelse`, `#optional-chains` | 116 | `java/functional.md` | переезжает с id |
| **`#functional`** Функциональные интерфейсы: `#functional-interfaces`, `#method-references`, `#effectively-final` | 151 | `java/functional.md` | переезжает с id |
| **`#tasks`** Задачи с собесов: `#stream-tasks` | 73 | `java/streams.md` | остаётся |

#### `java/strings.md` — остаётся целиком


#### `kafka/kafka-consumer-producer.md` — остаётся целиком


#### `kafka/kafka-reliability.md` — остаётся целиком


#### `kafka/kafka.md` — остаётся целиком


#### `networks/networks.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#models`** Модели OSI и TCP/IP: `#osi-tcpip` | 47 | `networks/networks.md` | остаётся |
| **`#tcp-udp`** TCP и UDP: `#tcp-vs-udp`, `#tcp-handshake`, `#reliable-udp` | 116 | `networks/networks.md` | остаётся |
| **`#http`** HTTP: `#http-message`, `#http-versions`, `#status-codes`, `#http-methods` | 141 | `networks/networks.md` | остаётся |
| **`#tls`** HTTPS и TLS: `#tls-basics`, `#tls-handshake`, `#pki`, `#url-flow` | 120 | `networks/networks.md` | остаётся |
| **`#dns`** DNS: `#dns-resolution`, `#dns-records` | 62 | `networks/networks.md` | остаётся |
| **`#api-styles`** REST и gRPC: `#rest`, `#grpc`, `#rest-vs-grpc` | 160 | `networks/api-styles.md` | переезжает с id |
| **`#realtime`** Связь в реальном времени: `#websocket` | 65 | `networks/api-styles.md` | переезжает с id |

#### `spring/spring-boot.md` — остаётся целиком


#### `spring/spring-core.md` — остаётся целиком


#### `spring/spring-data-jpa.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#transactional`** Как работает `@Transactional`: `#transactional-flow`, `#rollback-rules` | 138 | `spring/spring-transactions.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#self-invocation-transactions` | 65 | `spring/spring-transactions.md#self-invocation-transactions` | вместе с разделом; пара к `spring-core.md#self-invocation` |
| **`#propagation`** Propagation: распространение транзакций: `#required`, `#requires-new`, `#nested`, `#other-propagation` | 175 | `spring/spring-transactions.md` | переезжает с id |
| **`#isolation-locking`** Изоляция и блокировки | 120 | — | раздел расформировывается по темам ниже |
| &nbsp;&nbsp;↳ `#isolation` | 31 | `spring/spring-transactions.md#isolation` | как задать изоляцию в Spring; аномалии — `database/transactions.md` |
| &nbsp;&nbsp;↳ `#optimistic-locking` | 42 | `database/locking.md#optimistic-locking` | рядом с lost update: SQL-вариант и `@Version` |
| &nbsp;&nbsp;↳ `#pessimistic-locking` | 45 | `database/locking.md#pessimistic-locking` | `SELECT … FOR UPDATE` и `@Lock` |
| **`#hibernate`** Hibernate под капотом: `#n-plus-one`, `#entity-lifecycle`, `#dirty-checking`, `#save-vs-saveandflush`, `#hibernate-cache` | 197 | `spring/spring-data-jpa.md` | остаётся |

#### `spring/spring-ecosystem.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#security`** Spring Security: `#security-filter-chain`, `#authentication`, `#authorization`, `#jwt-filter`, `#security-context-async`, `#jwt-logout` | 274 | `spring/spring-security.md` | переезжает с id |
| **`#spring-kafka`** Spring Kafka: `#kafka-listener`, `#listener-config` | 75 | `kafka/spring-kafka.md` | переезжает с id |
| **`#spring-ddd`** Spring в гексагональной архитектуре: `#where-annotations`, `#adapters-config`, `#transactional-ddd`, `#double-entities` | 282 | `architecture/hexagonal.md` | переезжает с id |

#### `spring/spring-mvc.md` — остаётся целиком


#### `spring/spring-tools.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#testing`** Тестирование: `#test-slices`, `#unit-tests`, `#webmvctest`, `#datajpatest`, `#testcontainers` | 241 | `spring/spring-testing.md` | переезжает с id |
| **`#caching`** Кэширование: `#cacheable`, `#redis-cache-config`, `#condition-vs-unless` | 137 | `spring/spring-caching.md` | переезжает с id |
| **`#actuator-micrometer`** Actuator и Micrometer: `#actuator`, `#micrometer`, `#prometheus` | 141 | `spring/spring-actuator.md` | переезжает с id |
| **`#webflux`** Spring WebFlux: `#why-reactive`, `#mono-flux`, `#webflux-vs-mvc` | 101 | `spring/spring-mvc.md` | переезжает с id |

#### `system-design/system-design.md`

| Раздел `##` и его темы `###` | Строк | Куда | Что происходит |
|---|---:|---|---|
| **`#network-basics`** Сетевой фундамент | 4 | — | заглушка со ссылкой удаляется: ссылки ведут прямо на дом темы |
| **`#fundamentals`** Требования и оценки: `#metrics`, `#estimation` | 83 | `system-design/interview.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#sync-async` | 20 | `architecture/microservices.md#sync-async` | способы связи сервисов |
| **`#building-blocks`** Строительные блоки: `#l4-l7`, `#lb-algorithms`, `#sticky-sessions`, `#caching`, `#eviction`, `#cache-stampede`, `#message-queues`, `#cdn` | 401 | `system-design/building-blocks.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#redis-hazelcast` | 29 | `database/nosql.md#redis-cluster` | рядом с key-value: кластеризация Redis и Hazelcast |
| &nbsp;&nbsp;↳ `#sql-vs-nosql` | 30 | `database/nosql.md#nosql-vs-sql` | **слияние**, дом `nosql.md#nosql-vs-sql` |
| &nbsp;&nbsp;↳ `#replication` | 32 | `system-design/distributed-data.md#replication` | переезжает |
| &nbsp;&nbsp;↳ `#partitioning` | 22 | `system-design/distributed-data.md#partitioning` | переезжает |
| &nbsp;&nbsp;↳ `#sharding` | 28 | `system-design/distributed-data.md#sharding` | переезжает |
| &nbsp;&nbsp;↳ `#consistent-hashing` | 32 | `system-design/distributed-data.md#consistent-hashing` | переезжает |
| **`#distributed`** Теория распределённых систем: `#cap`, `#pacelc`, `#consistency-models`, `#consensus` | 273 | `system-design/distributed-data.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#delivery-guarantees` | 25 | `architecture/distributed-transactions.md#delivery-guarantees` | общие семантики и idempotency key; Kafka-специфика — `kafka-reliability.md#delivery-guarantees` |
| &nbsp;&nbsp;↳ `#two-phase-commit` | 35 | `architecture/distributed-transactions.md#two-phase-commit` | переезжает |
| &nbsp;&nbsp;↳ `#saga` | 55 | `architecture/distributed-transactions.md#saga` | переезжает |
| &nbsp;&nbsp;↳ `#outbox` | 37 | `architecture/distributed-transactions.md#outbox` | переезжает |
| **`#microservices`** Микросервисы: `#monolith-vs-microservices`, `#api-gateway` | 78 | `architecture/microservices.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#rate-limiting` | 25 | `architecture/microservices.md#rate-limiting` | **слияние** с `nosql.md#rate-limiting` |
| **`#reliability`** Надёжность и эксплуатация: `#timeout-retry`, `#circuit-breaker`, `#bulkhead` | 233 | `architecture/microservices.md` | переезжает с id |
| &nbsp;&nbsp;↳ `#observability` | 23 | `infrastructure/observability.md#observability` | переезжает |
| &nbsp;&nbsp;↳ `#health-checks` | 17 | `infrastructure/kubernetes.md#health-checks` | пробы — это Kubernetes; сейчас ссылается на заглушку `spring-boot.md#actuator` |
| &nbsp;&nbsp;↳ `#sidecar` | 25 | `infrastructure/kubernetes.md#sidecar` | переезжает |
| &nbsp;&nbsp;↳ `#scaling` | 22 | `system-design/interview.md#scaling` | базовый вопрос — в раздел «Требования и оценки» |
| &nbsp;&nbsp;↳ `#polyglot-persistence` | 22 | `database/nosql.md#polyglot` | **слияние**, дом `nosql.md#polyglot` |
| &nbsp;&nbsp;↳ `#security` | 27 | `spring/spring-security.md#sessions-vs-jwt` | id `security` на новой странице занят разделом |
| **`#interview`** Собеседование: `#methodology`, `#url-shortener`, `#classic-tasks` | 162 | `system-design/interview.md` | переезжает с id |
| **`#cases`** Разбор кейсов: `#case-round-robin`, `#case-stampede`, `#case-sharding`, `#case-partition`, `#case-emails` | 110 | `system-design/interview.md` | переезжает с id |

### 4.5. Что обновить кроме страниц

| Что | Изменение |
|---|---|
| `mkdocs.yml` → `nav` | По черновику из [3.4](#34-черновик-nav-для-mkdocsyml) |
| `mkdocs.yml` → `plugins` | Добавить `redirects` (пакет `mkdocs-redirects`, зафиксировать версию в `requirements.txt`) — старые URL опубликованного сайта не должны отдавать 404. Плагин переносит `#якорь`, поэтому ссылка `multithreading/#jmm` откроет `concurrency/threads/#jmm`; если тема уехала на другую страницу, читатель попадёт в начало главной страницы раздела. Карта редиректов — ниже |
| `scripts/prep_pages.py` | `SECTION_IDS`: «Java» → `java`, «Многопоточность» → `concurrency`, «Дизайн кода» → `design`, «Spring» → `spring`, «Данные» → `data`, «Kafka» → `kafka`, «System Design» → `system-design`, «Архитектура» → `architecture`, «Инфраструктура» → `infrastructure`, «Computer Science» → `cs`. `PAGE_IDS` оставить `kafka/kafka.md` → `kafka-broker`; новых коллизий имён файлов нет |
| `docs/index.md` | Блок «Разделы» — 10 карточек вместо 6 (без этого хук роняет сборку); маршрут подготовки — новые пути и якоря |
| `STYLE.md` | Эталонные страницы и таблица «Один дом у темы» — новые пути; правило «новый раздел верхнего уровня» без изменений |
| `README.md` | Таблица «Что внутри» и дерево `docs/` |
| `prep/questions.md`, `prep/last-hour.md` | Перегенерировать `python scripts/prep_pages.py` |
| Перекрёстные ссылки | ~260 ссылок между страницами; после каждого шага — `mkdocs build --strict` (`validation.anchors: warn` + `--strict` ловит битые якоря) |

Карта редиректов для страниц, которые исчезают (`redirect_maps`, пути от `docs/`):

```yaml
java/multithreading.md: concurrency/threads.md
java/solid.md: design/solid.md
java/patterns.md: design/creational-patterns.md
spring/spring-ecosystem.md: spring/spring-security.md
spring/spring-tools.md: spring/spring-testing.md
system-design/system-design.md: system-design/interview.md
architecture/architecture.md: architecture/ddd.md
infrastructure/infrastructure.md: infrastructure/docker.md
```

### 4.6. Порядок миграции

Один PR — одна вкладка или пара связанных вкладок, чтобы каждый шаг проходил `mkdocs build --strict` и ревьюился за разумное время. В каждом PR: перенос с id, деление шпаргалок, теги, ссылки, `nav`, карточки на главной, таблица «Один дом» в `STYLE.md`, редиректы, перегенерация «Подготовки».

1. **Инфраструктура миграции**: плагин `mkdocs-redirects`, новые `SECTION_IDS`. Без переноса контента.
2. **Многопоточность** — самая большая и самая изолированная страница; вместе с ней — ThreadLocal (P1), чтобы `concurrency/threads.md` не вышла тоньше 200 строк.
3. **Java и Дизайн кода**: `oop.md`, `collections.md`, `streams.md`, `solid.md`, `patterns.md`.
4. **Данные и транзакции Spring**: `sql.md`, `spring-data-jpa.md` → `database/transactions.md`, `database/locking.md`, `spring/spring-transactions.md`; вместе с lost update и write skew (P1), иначе `locking.md` выйдет на 115 строк.
5. **Spring**: расформировать `spring-ecosystem.md` и `spring-tools.md`, Spring Kafka — во вкладку Kafka.
6. **System Design и Архитектура**: расформировать `system-design.md`, слить дубли CAP, polyglot, rate limiting, SQL vs NoSQL, гарантий доставки.
7. **Инфраструктура и Computer Science**: `infrastructure.md`, `algorithms.md`, `leetcode-patterns.md`, `networks.md`.

Шаги 2–7 независимы по контенту, но 5 и 6 трогают одни и те же ссылки (`spring-ecosystem.md#spring-ddd` ↔ `architecture.md`), поэтому их лучше делать подряд.

---

## 5. Что добавить

Приоритет: **P1** — частый вопрос, которого в базе нет, или тема, без которой новая страница выходит тоньше 200 строк; **P2** — следующая волна; **P3** — по желанию.

### 5.1. Обязательные к оценке

| Тема | Вердикт | Куда | Обоснование |
|---|---|---|---|
| **ThreadLocal** | ✅ P1 | `concurrency/threads.md#thread-local` | Упоминается в `jvm.md` (утечка ClassLoader), `spring-ecosystem.md` (`SecurityContextHolder`) и `spring-mvc.md` (очистка в `afterCompletion`), но нигде не разобран. Вопросы: где хранится (`ThreadLocalMap` в `Thread`, слабые ключи), почему течёт в пуле потоков и зачем `remove()` в `finally`, почему `InheritableThreadLocal` не работает с пулом, как пробросить MDC и `SecurityContext` в `@Async` (`TaskDecorator`) |
| **Scoped Values** | ✅ P2 | `concurrency/virtual-threads.md#scoped-values` | Финальная фича с JDK 25 (JEP 506). Хороший Senior-вопрос «чем плох ThreadLocal для миллиона виртуальных потоков»: неизменяемость, ограниченное время жизни, наследование в `StructuredTaskScope`. Без ThreadLocal не имеет смысла, поэтому идёт вторым и ссылается на него. Вместе дают страницам «Потоки» и «Виртуальные потоки» больше 200 строк |
| **LazyInitializationException и Open Session in View** | ✅ P1 | `spring/spring-data-jpa.md#lazy-initialization`, `#open-in-view` | Классический вопрос по Hibernate, в базе есть N+1 и состояния Entity, но нет того, что происходит при обращении к ленивой связи после закрытия сессии. Важно, что `spring.jpa.open-in-view` включён в Spring Boot по умолчанию и пишет предупреждение при старте — это ловушка. Решения: fetch join, `@EntityGraph`, DTO-проекции, границы `@Transactional`; антирешения — OSIV и `enable_lazy_load_no_trans` |
| **Lost update и write skew** | ✅ P1 | `database/locking.md#lost-update`, `#write-skew` | Сейчас разобраны только три аномалии SQL-92, а в таблице изоляции сказано, что `REPEATABLE READ` в PostgreSQL защищает от фантомов, — без write skew ответ на «почему тогда не `SERIALIZABLE`?» неполный. Lost update — самый частый практический вопрос (счётчик, баланс): атомарный `UPDATE … SET x = x + 1`, `SELECT … FOR UPDATE`, `@Version`; разница PostgreSQL (ошибка сериализации на RR) и MySQL (тихая потеря). Делают страницу `database/locking.md` полноценной |
| **Паттерн Proxy** | ✅ P2 | `design/structural-patterns.md#proxy` | Прокси Spring разобраны подробно (`#jdk-proxy-vs-cglib`, `#self-invocation`), но сам паттерн и вопрос «чем Proxy отличается от Decorator и Adapter» — нет. Тема короткая: структура, `java.lang.reflect.Proxy` руками, виды (виртуальный, защищающий, удалённый) и ссылки на Spring AOP и ленивые прокси Hibernate. Вместе с Adapter и Facade наполняет страницу структурных паттернов |
| **ClassLoader и JIT** | ✅ P2 (для Senior — P1) | `java/classloading-jit.md` ✨ | В `jvm.md` JIT есть только на схеме и в одной фразе про Execution Engine, хотя в «Проверь себя» спрашивают, зачем он нужен; ClassLoader — только в ловушке про утечку Metaspace. Вопросы: этапы загрузки (loading, linking, initialization), делегирование parent-first и где оно нарушается (Tomcat, child-first), `ClassNotFoundException` vs `NoClassDefFoundError`; tiered compilation C1/C2, прогрев, inlining и escape analysis, деоптимизация; CDS и AOT для быстрого старта. Отдельной страницей, чтобы не раздувать `jvm.md` за 700 строк |
| **Страница «Что выведет код?»** | ✅ P1 | `prep/code-output.md` ✨ | Популярный формат на русскоязычных Java-собесах; одна такая задача уже есть на главной, ещё несколько — в «Проверь себя» в `basics.md`. Формат: 20–30 задач по группам (обёртки и строки, `finally` и `return`, порядок инициализации и `static`, перегрузка vs переопределение, `HashMap` с изменяемым ключом, `List.remove(int)` vs `remove(Object)`, ленивость стримов и `peek`, гонка на `i++`), ответ в `??? question`, в ответе — ссылка на тему-дом. Новой теории нет, поэтому дублей не создаёт. Лежит в «Подготовке», которую генератор пропускает, — `###` можно оформлять без метки уровня, но с id |

### 5.2. Другие темы

| Приоритет | Тема | Куда | Почему |
|---|---|---|---|
| P1 | Связи сущностей: `FetchType` по умолчанию, `cascade`, `orphanRemoval`, владеющая сторона, `equals`/`hashCode` у Entity | `spring/spring-data-jpa.md` | Нет в базе, хотя N+1 есть; `@ManyToOne` по умолчанию `EAGER` — частая ловушка |
| P1 | `SELECT … FOR UPDATE SKIP LOCKED` и дедлоки в БД | `database/locking.md` | Очередь задач на таблице и deadlock двух транзакций — частые практические вопросы |
| P2 | `BlockingQueue` и producer-consumer | `concurrency/concurrent-collections.md` | Сейчас — только строка в таблице-заглушке; нужна странице до 200 строк |
| P2 | `@Async`, `@Scheduled`, события и `@TransactionalEventListener` | `spring/spring-core.md` или новая `spring/spring-async.md` | `@Async` упоминается только в связи с потерей `SecurityContext` |
| P2 | Пул соединений (HikariCP): размер пула, утечки, таймауты | `database/sql.md` или `spring/spring-data-jpa.md` | Частый вопрос «почему пул 10 и что будет при 1000 потоков» |
| P2 | Spring Kafka: `KafkaTemplate`, `DefaultErrorHandler`, `@RetryableTopic`, транзакции | `kafka/spring-kafka.md` | Нужна странице до 200 строк |
| P2 | Inbox, CDC (Debezium) | `architecture/distributed-transactions.md` | Логичное продолжение Outbox |
| P2 | Kubernetes для Java: Pod/Deployment/Service, requests и limits, JVM в контейнере (`MaxRAMPercentage`), graceful shutdown | `infrastructure/kubernetes.md` | Сейчас — одна тема на 21 строку |
| P2 | Observability: структурные логи и MDC, трейсинг (OpenTelemetry, Micrometer Tracing), SLI/SLO, перцентили | `infrastructure/observability.md`, `spring/spring-actuator.md` | Нужна обеим страницам до 200 строк |
| P2 | Структурные и поведенческие паттерны: Adapter, Facade, Template Method, Chain of Responsibility | `design/structural-patterns.md`, `design/behavioral-patterns.md` | Template Method упомянут только в коде `oop.md`; Chain of Responsibility — это фильтры Servlet и Spring Security |
| P2 | Неизменяемые объекты и защитные копии | `java/oop.md` или `design/composition.md` | Связывает `String`, `record`, `final`-поля и безопасную публикацию |
| P2 | Рефлексия и аннотации: `@Retention`, как Spring их читает | `java/basics.md` или `java/classloading-jit.md` | Основа DI и AOP, сейчас не разобрана |
| P2 | Java 21–25: sequenced collections, record patterns, `_`, Stream Gatherers, гибкие тела конструкторов | `java/modern-java.md` | Страница на 258 строк, база заявляет JDK 25 |
| P2 | OAuth2 и OIDC, Resource Server в Spring; CSRF и почему его отключают для REST с JWT | `spring/spring-security.md` | OAuth есть одной строкой в SD |
| P2 | Дизайн REST API: версионирование, пагинация, `PUT` vs `PATCH`, idempotency key | `networks/api-styles.md` | Частые вопросы, сейчас только «Что такое REST?» |
| P2 | Backtracking, интервалы, Top-K на куче | `algorithms/leetcode-trees-dp.md`, `algorithms/leetcode-patterns.md` | Частые классы задач live coding |
| P2 | Redis: персистентность (RDB/AOF), политики вытеснения, распределённая блокировка | `database/nosql.md`, при росте — `database/redis.md` | Redis есть только как key-value и кэш |
| P3 | Типы ссылок (`Weak`, `Soft`, `Phantom`), `WeakHashMap` | `java/jvm.md` | Senior-вопрос, связан с утечками |
| P3 | Resilience4j в Spring | `architecture/microservices.md` | Практика к circuit breaker |
| P3 | KRaft вместо ZooKeeper как концепция | `kafka/kafka.md` | Сейчас только как настройка Compose |
| P3 | Union-Find, топологическая сортировка | `algorithms/sorting-graphs.md` | Реже на Java-собесах |
| P3 | Кейсы SD: лента новостей, чат, rate limiter | `system-design/interview.md` | Есть только URL shortener |
| P3 | Maven и Gradle: scope, конфликты версий | новая страница в «Инфраструктуре» | Иногда спрашивают на Middle |
| P3 | Как проходит собес: этапы, live coding, вопросы работодателю | `prep/` | Мета-страница для «Подготовки» |
