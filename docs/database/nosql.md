---
tags:
  - Junior
  - Middle
  - Базы данных
  - Кэширование
---

# NoSQL

Когда брать NoSQL вместо SQL, четыре семейства NoSQL-баз — документные, key-value, wide-column и графовые — и как с ними работать из Spring Boot, кластер Redis и polyglot persistence. На собесе спрашивают, когда NoSQL лучше SQL, чем отличаются семейства, какие задачи решают на Redis и какие хранилища нужны кроме основной БД. Где базы стоят в CAP-теореме — на странице [Распределённые данные](../system-design/distributed-data.md#cap).

## Зачем NoSQL { #why-nosql }

### Зачем NoSQL, если есть SQL? { #nosql-vs-sql }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    NoSQL (Not Only SQL) — не замена SQL, а другой инструмент под другие задачи. SQL со строгой схемой, связями через внешние ключи, JOIN'ами и ACID-транзакциями — выбор по умолчанию для структурированных данных, где важна согласованность. NoSQL — зонтик из четырёх семейств, каждое заточено под свой паттерн доступа: гибкие документы, кэш, огромные потоки записи, графы; его берут под конкретную причину, а не «потому что модно».

**SQL** (Postgres, MySQL) — строгая схема, связи через внешние ключи, JOIN'ы, транзакции ACID ([что это](transactions.md#acid-properties)). Бери, когда данные структурированы и связаны, важна согласованность (деньги, заказы), а объём умеренный.

Реляционные БД отлично работают для структурированных данных с чёткими связями. Но у них есть ограничения, которые в некоторых сценариях становятся критичными:

- **Жёсткая схема** — добавить поле означает миграцию таблицы. Для продуктов с частыми изменениями это дорого.
- **Вертикальное масштабирование** — нагрузку снимают более мощным сервером. Горизонтальное (шардирование) есть, но сложное.
- **Избыточная мощь** — если хранишь сессии пользователей, кэш или очередь событий, реляционная модель избыточна.
- **Неструктурированные данные** — JSON-документы разной структуры, графы, временные ряды плохо ложатся в таблицы.

**NoSQL** — четыре типа, каждый под свой паттерн доступа (подробно — в [семействах NoSQL](#families)):

- **Key-value** (Redis, DynamoDB) — «ключ → значение», самый быстрый доступ по ключу. Кэши, сессии, простые lookup'ы.
- **Document** (MongoDB) — JSON-документы, гибкая схема. Каталоги, профили.
- **Column-family** (Cassandra) — гигантские объёмы, write-heavy, линейно масштабируется. Логи, метрики, лента.
- **Graph** (Neo4j) — узлы и связи. Соцграф, рекомендации.

!!! warning "Ловушка: NoSQL «потому что модно»"
    NoSQL — не замена SQL, а другой инструмент под конкретный паттерн доступа. Без чётко известного паттерна доступа, под который база заточена, NoSQL даёт боль без выгоды: нет JOIN'ов, нет привычных транзакций. SQL — по умолчанию, NoSQL — под конкретную причину.

??? question "Проверь себя"
    1. Какие четыре ограничения реляционных БД толкают к NoSQL?
    2. Когда выбирать реляционную базу?
    3. Назови четыре семейства NoSQL и задачу для каждого.

## Семейства NoSQL { #families }

### Что такое документная БД? { #document-store }

**Уровень:** Junior

=== "Коротко"

    !!! abstract "Ответ вслух"
        Документная БД хранит данные как JSON/BSON-документы без фиксированной схемы: у каждого документа могут быть свои поля, а вложенные объекты лежат прямо внутри. Пример — MongoDB. Подходит для данных с переменной структурой и частыми изменениями схемы, плохо — для сложных связей между сущностями.

=== "Подробно"

    **Представители:** MongoDB, CouchDB, Firestore.

    ```json
    // Документ "habit" в MongoDB
    {
      "_id": "64a1f2c3d4e5f6a7b8c9d0e1",
      "userId": "user_42",
      "name": "Утренняя пробежка",
      "frequency": "daily",
      "reminders": [
        { "time": "07:00", "enabled": true },
        { "time": "07:30", "enabled": false }
      ],
      "streaks": {
        "current": 14,
        "longest": 30
      },
      "tags": ["здоровье", "спорт"],
      "createdAt": "2024-01-15T07:00:00Z"
    }
    ```

    **Spring Data MongoDB:**

    ```java
    @Document(collection = "habits")
    public class Habit {
        @Id
        private String id;
        private String userId;
        private String name;
        private List<Reminder> reminders;
        private Map<String, Integer> streaks;

        // Вложенный объект — просто поле, никаких JOIN-ов
        @Document
        public record Reminder(String time, boolean enabled) {}
    }

    public interface HabitRepository extends MongoRepository<Habit, String> {

        List<Habit> findByUserId(String userId);

        // MongoDB Query
        @Query("{ 'userId': ?0, 'streaks.current': { $gte: ?1 } }")
        List<Habit> findActiveStreaks(String userId, int minDays);
    }
    ```

    **Когда выбирать:**

    - Данные имеют переменную структуру (каталог товаров, где у каждого свои атрибуты).
    - Нужно хранить вложенные объекты без нормализации.
    - Частые изменения схемы (стартап, быстрые итерации).
    - Целый документ читают чаще, чем отдельные поля.

    **Когда не выбирать:**

    - Сложные связи между сущностями (придётся делать JOIN в коде).
    - Нужны ACID-транзакции через несколько документов (MongoDB 4.0+ поддерживает, но дороже).
    - Данные высоко нормализованы и структурированы.

!!! warning "Ловушка: связи между документами"
    JOIN-ов в привычном виде нет. Если сущности сильно связаны, связи придётся собирать в коде отдельными запросами — это признак, что нужна реляционная БД.

??? question "Проверь себя"
    1. В каком формате документная БД хранит данные?
    2. Когда MongoDB — хороший выбор?
    3. Почему сложные связи между сущностями — плохой кейс для документной БД?

### Что такое key-value хранилище? { #key-value }

**Уровень:** Junior

=== "Коротко"

    !!! abstract "Ответ вслух"
        Самая простая модель: ключ → значение, БД не знает, что внутри значения, а операции по ключу работают за O(1). Самый популярный представитель — Redis: данные в памяти, опциональная персистентность и богатые типы данных — строки, списки, множества, sorted sets, хэши, стримы. Используют для кэша, сессий, счётчиков, очередей и лидербордов.

=== "Подробно"

    **Представители:** Redis, DynamoDB, Memcached.

    **Redis** — самый популярный: данные в памяти (in-memory), опциональная персистентность, богатые типы данных.

    ```java
    // Spring Data Redis
    @Configuration
    public class RedisConfig {
        @Bean
        public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
            RedisTemplate<String, Object> template = new RedisTemplate<>();
            template.setConnectionFactory(factory);
            template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
            return template;
        }
    }

    @Service
    public class HabitCacheService {

        private final RedisTemplate<String, Object> redis;
        private static final Duration TTL = Duration.ofMinutes(30);

        // Простой кэш
        public void cacheHabit(String habitId, HabitDto habit) {
            redis.opsForValue().set("habit:" + habitId, habit, TTL);
        }

        public HabitDto getCachedHabit(String habitId) {
            return (HabitDto) redis.opsForValue().get("habit:" + habitId);
        }

        // Счётчик streak (атомарная операция)
        public long incrementStreak(String userId, String habitId) {
            String key = "streak:" + userId + ":" + habitId;
            return redis.opsForValue().increment(key);
        }

        // Хранение сессии пользователя
        public void saveSession(String sessionId, UserSession session, Duration ttl) {
            redis.opsForValue().set("session:" + sessionId, session, ttl);
        }

        // Очередь задач (List)
        public void pushNotification(String userId, NotificationDto notification) {
            redis.opsForList().leftPush("notifications:" + userId, notification);
        }

        public NotificationDto popNotification(String userId) {
            return (NotificationDto) redis.opsForList().rightPop("notifications:" + userId);
        }

        // Уникальные просмотры (Set)
        public void trackView(String habitId, String userId) {
            redis.opsForSet().add("views:" + habitId, userId);
        }

        public long uniqueViewCount(String habitId) {
            return redis.opsForSet().size("views:" + habitId);
        }

        // Топ привычек по streak (Sorted Set)
        public void updateLeaderboard(String userId, double streak) {
            redis.opsForZSet().add("leaderboard", userId, streak);
        }

        public Set<Object> getTopUsers(int count) {
            return redis.opsForZSet().reverseRange("leaderboard", 0, count - 1);
        }
    }
    ```

    | Тип | Команды | Применение |
    |---|---|---|
    | **String** | `GET`, `SET`, `INCR`, `EXPIRE` | Кэш, счётчики, сессии |
    | **List** | `LPUSH`, `RPOP`, `LRANGE` | Очереди, история, лента |
    | **Set** | `SADD`, `SMEMBERS`, `SINTER` | Уникальные элементы, теги |
    | **Sorted Set** | `ZADD`, `ZRANGE`, `ZRANK` | Лидерборды, приоритеты |
    | **Hash** | `HSET`, `HGET`, `HGETALL` | Объекты с полями |
    | **Stream** | `XADD`, `XREAD` | Event sourcing, логи |

    **Когда выбирать:**

    - Кэширование (самый частый кейс).
    - Сессии пользователей.
    - Rate limiting (счётчик запросов с TTL).
    - Очереди задач.
    - Pub/Sub (уведомления в реальном времени).
    - Лидерборды и рейтинги.

    Сравнение Redis с Memcached и Hazelcast и устройство Redis Cluster — в [Строительные блоки → Caching](../system-design/building-blocks.md#caching).

!!! warning "Ловушка: поиск не по ключу"
    Key-value хранилище отвечает быстро только на запрос по ключу. Найти «все сессии пользователя из Алматы» без заранее построенного ключа или индекса нельзя — это задача другой БД.

??? question "Проверь себя"
    1. Какой структурой Redis сделать лидерборд?
    2. Почему `INCR` подходит для счётчиков?
    3. Какие задачи решают на key-value хранилище?

### Redis, Memcached или Hazelcast? { #redis-cluster }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    Memcached — простой key-value кэш в памяти, Redis — богаче: структуры данных, персистентность, pub/sub; сегодня это выбор по умолчанию. Redis Cluster делит ключи на 16 384 хэш-слота, а клиент сам знает, на каком узле слот. Hazelcast — In-Memory Data Grid на Java: 271 партиция и выполнение кода прямо на узле с данными.

Memcached — простой key-value кэш в памяти. Redis богаче: структуры данных (списки, sorted sets), персистентность, pub/sub — дефолтный выбор сегодня. Дальше — нюансы кластеризации:

| | **Redis** | **Hazelcast** |
|---|---|---|
| **Что это** | In-Memory Data Structure Store (C) | In-Memory Data Grid (Java) |
| **Шардирование** | 16 384 хэш-слота по Master-узлам | 271 партиция, у каждого узла основные + backup |
| **Маршрутизация** | Smart Clients (Lettuce/Jedis знают карту) | P2P, узлы равны |
| **Сильная сторона** | Скорость, простота | Data Locality — EntryProcessor выполняется на узле с данными |
| **Консистентность** | AP по умолчанию | AP + CP Subsystem (Raft) для надёжных локов |

**Redis Cluster.** Центрального узла нет, узлы общаются по Gossip-протоколу. Клиент сам знает, что `user:123` лежит на Узле 2, через хэш-слот; если карта устарела, узел ответит `MOVED`, и клиент её обновит. У каждого Master есть Replica: при падении узлы голосуют и повышают реплику до Master.

**Hazelcast Data Locality.** Чтобы обновить зарплату миллиону сотрудников, в Redis пришлось бы тащить миллион записей по сети. В Hazelcast отправляешь маленький `EntryProcessor` — кусок Java-кода — внутрь кластера, и он выполняется прямо на узлах с данными. Сеть не нагружается.

!!! warning "Ловушка: failover Redis без потерь"
    Репликация в Redis Cluster асинхронная. Если Master принял запись и сгорел до репликации, после повышения реплики этих данных не будет. Для кэша это не критично — он пересоберётся из БД, — но хранить в Redis единственную копию важных данных так нельзя.

??? question "Проверь себя"
    1. Что делает клиент Redis Cluster, получив ответ `MOVED`?
    2. Что такое data locality в Hazelcast и зачем нужен `EntryProcessor`?
    3. Почему при failover Redis можно потерять последние записи?

### Как устроены wide-column БД? { #wide-column }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Wide-column БД вроде Cassandra хранят строки с гибким набором колонок и масштабируются горизонтально почти линейно. Partition key определяет, на какой ноде лежат данные, а clustering key — порядок внутри партиции. Схему проектируют вокруг запросов, и каждый запрос обязан указывать partition key.

=== "Подробно"

    **Суть:** таблицы есть, но схема гибкая — строки в одной таблице могут иметь разные столбцы. Такие БД спроектированы для огромных объёмов данных и горизонтального масштабирования.

    **Представители:** Apache Cassandra, HBase, Amazon Keyspaces.

    ```sql
    -- Cassandra CQL (похож на SQL, но другая семантика)
    CREATE TABLE habit_events (
        user_id     UUID,
        habit_id    UUID,
        event_date  DATE,
        event_time  TIMESTAMP,
        completed   BOOLEAN,
        notes       TEXT,
        PRIMARY KEY ((user_id, habit_id), event_date, event_time)
    ) WITH CLUSTERING ORDER BY (event_date DESC, event_time DESC);

    -- Partition key: (user_id, habit_id) — определяет на какой ноде лежат данные
    -- Clustering key: event_date, event_time — порядок внутри партиции

    -- Запрос: ОБЯЗАТЕЛЬНО по partition key
    SELECT * FROM habit_events
    WHERE user_id = ? AND habit_id = ?
    AND event_date >= '2024-01-01';

    -- ❌ Так нельзя — нет фильтрации по partition key
    SELECT * FROM habit_events WHERE completed = true;
    ```

    **Spring Data Cassandra:**

    ```java
    @Table("habit_events")
    public class HabitEvent {
        @PrimaryKeyColumn(name = "user_id", type = PrimaryKeyType.PARTITIONED, ordinal = 0)
        private UUID userId;

        @PrimaryKeyColumn(name = "habit_id", type = PrimaryKeyType.PARTITIONED, ordinal = 1)
        private UUID habitId;

        @PrimaryKeyColumn(name = "event_date", type = PrimaryKeyType.CLUSTERED, ordinal = 0,
                          ordering = Ordering.DESCENDING)
        private LocalDate eventDate;

        @Column private boolean completed;
        @Column private String notes;
    }
    ```

    **Главное правило Cassandra:** проектируй схему вокруг запросов, а не вокруг данных. В реляционных БД сначала нормализация, потом запросы; в Cassandra — сначала запросы, потом схема.

    **Когда выбирать:**

    - Огромные объёмы данных (терабайты, петабайты).
    - Высокая скорость записи (IoT, логи, метрики, события).
    - Временные ряды (история показателей, события с временной меткой).
    - Нужна линейная горизонтальная масштабируемость.

!!! warning "Ловушка: чего нет в Cassandra"
    Нет JOIN, нет агрегаций типа `SUM` / `AVG` / `GROUP BY` в традиционном смысле. Нет транзакций через несколько партиций — только lightweight transactions в одной партиции.

    Это не баг, а намеренный выбор в пользу скорости и масштабируемости.

??? question "Проверь себя"
    1. Чем partition key отличается от clustering key?
    2. Почему запрос `WHERE completed = true` в Cassandra не сработает?
    3. Что значит «проектировать схему вокруг запросов»?

### Когда нужна графовая БД? { #graph }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Когда главное в данных — связи. Графовая БД хранит узлы и рёбра, причём рёбра — полноценные объекты со своими атрибутами. Пример — Neo4j с языком Cypher; типичные задачи — соцграфы, рекомендации, поиск мошеннических цепочек и кратчайших путей.

**Суть:** данные — это узлы (nodes) и рёбра (edges, relationships). Рёбра хранятся явно, с атрибутами, — поэтому графовые БД подходят для сильно связанных данных.

**Представители:** Neo4j, Amazon Neptune, JanusGraph.

```cypher
// Cypher — язык запросов Neo4j

// Создаём узлы и связи
CREATE (alice:User {id: 1, name: 'Alice'})
CREATE (bob:User {id: 2, name: 'Bob'})
CREATE (running:Habit {id: 10, name: 'Бег'})
CREATE (alice)-[:FOLLOWS]->(bob)
CREATE (alice)-[:PRACTICES {since: '2024-01-01', streak: 14}]->(running)
CREATE (bob)-[:PRACTICES {since: '2024-02-01', streak: 5}]->(running)

// Найти все привычки друзей Alice
MATCH (alice:User {name: 'Alice'})-[:FOLLOWS]->(friend:User)-[:PRACTICES]->(habit:Habit)
RETURN friend.name, habit.name, friend.streak

// Рекомендации: привычки, которые практикуют люди с похожими интересами
MATCH (me:User {id: $userId})-[:PRACTICES]->(habit:Habit)<-[:PRACTICES]-(other:User)
      -[:PRACTICES]->(recommended:Habit)
WHERE NOT (me)-[:PRACTICES]->(recommended)
RETURN recommended.name, COUNT(other) AS popularity
ORDER BY popularity DESC
LIMIT 5

// Кратчайший путь между пользователями
MATCH path = shortestPath((alice:User {name:'Alice'})-[:FOLLOWS*]-(bob:User {name:'Bob'}))
RETURN path, length(path)
```

**Когда выбирать:**

- Социальные графы (друзья, подписчики, рекомендации).
- Системы рекомендаций.
- Обнаружение мошенничества (цепочки транзакций).
- Карты и маршруты.
- Иерархические структуры (оргструктура компании).
- Управление зависимостями (граф зависимостей пакетов).

!!! warning "Ловушка: масштабирование Neo4j"
    Графовые БД плохо шардируются: обход графа по рёбрам, разнесённым по разным серверам, требует сетевых переходов. Neo4j масштабируют в основном вертикально.

??? question "Проверь себя"
    1. Что хранит графовая БД, кроме узлов?
    2. Как на Cypher найти привычки друзей пользователя?
    3. Для каких задач графовая БД подходит лучше реляционной?

### Как сравнить четыре семейства? { #comparison }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Документная БД — гибкие JSON-документы и запросы по любому полю, key-value — O(1) по ключу, wide-column — огромные объёмы записи и запросы по partition key, графовая — обход связей. Первые три масштабируются горизонтально, Neo4j — в основном вертикально.

| | **Document** | **Key-Value** | **Wide-Column** | **Graph** |
|---|---|---|---|---|
| **Пример** | MongoDB | Redis | Cassandra | Neo4j |
| **Модель данных** | JSON документы | Пары ключ-значение | Строки с динамическими столбцами | Узлы и рёбра |
| **Схема** | Гибкая | Нет | Гибкая | Гибкая |
| **Запросы** | По любому полю | Только по ключу | По partition key | Обход графа |
| **Масштабирование** | Горизонтальное | Горизонтальное | Линейное горизонтальное | Вертикальное (Neo4j) |
| **ACID** | Частично (4.0+) | Частично (транзакции) | Нет (LWT в партиции) | Да |
| **CAP** | CP или AP | CP | AP | CA |
| **Лучший кейс** | Каталоги, CMS | Кэш, сессии, очереди | IoT, логи, события | Соцсети, рекомендации |

!!! warning "Ловушка: CAP-метка из таблицы как абсолют"
    Положение базы в CAP зависит от конфигурации: MongoDB — «CP или AP», Redis бывает в режиме CP, Cassandra настраивает согласованность на уровне запроса. Таблица — ориентир по умолчанию, а не закон.

??? question "Проверь себя"
    1. Какое семейство позволяет запросы по любому полю?
    2. Какое масштабируется в основном вертикально?
    3. Какой лучший кейс у wide-column БД?

## Другие хранилища { #other-stores }

### Что такое polyglot persistence? { #polyglot }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Это подход, при котором разные данные хранят в разных хранилищах — там, где они хранятся и ищутся лучше всего. Например, основные данные с транзакциями — в PostgreSQL, история событий — в Cassandra, кэш и лидерборды — в Redis, аналитика — в MongoDB. Кроме баз данных это object storage вроде S3 для файлов (в базе только ключ), time-series база для метрик, Elasticsearch для полнотекстового поиска и geo-индекс для «найди ближайшее».

```java
@Service
public class HabitTrackerService {

    private final HabitJpaRepository postgresRepo;    // Основные данные (PostgreSQL)
    private final HabitEventRepository cassandraRepo; // История событий (Cassandra)
    private final RedisTemplate<String, Object> redis; // Кэш и сессии (Redis)
    private final MongoTemplate mongo;                 // Аналитика и отчёты (MongoDB)

    public void recordHabitCompletion(String userId, String habitId) {
        // Обновляем streak в PostgreSQL (транзакция)
        postgresRepo.incrementStreak(userId, habitId);

        // Записываем событие в Cassandra (масштабируемая история)
        cassandraRepo.save(new HabitEvent(userId, habitId, LocalDateTime.now(), true));

        // Обновляем Redis (кэш + лидерборд)
        redis.opsForValue().increment("streak:" + userId + ":" + habitId);
        redis.opsForZSet().incrementScore("leaderboard:" + habitId, userId, 1);

        // Сбрасываем кэш профиля
        redis.delete("profile:" + userId);
    }
}
```

Хранилища, которые нужны кроме основной БД:

- **Object storage** (S3, GCS) — картинки, видео, бэкапы. Паттерн: **файлы не в БД** — в базе только ключ или URL, сам файл в S3, раздача через CDN. **Presigned URL** — клиент грузит файл напрямую в S3 по временной подписанной ссылке, минуя твой бэкенд.
- **Time-series** (Prometheus, InfluxDB, TimescaleDB) — метрики, IoT, котировки: поток записи и агрегаты по временным диапазонам.
- **Search** (Elasticsearch, OpenSearch) — полнотекстовый поиск, который SQL делает плохо: `LIKE '%слово%'` не масштабируется, нет релевантности и исправления опечаток. Внутри — **инвертированный индекс** (слово → документы). Паттерн: истина в SQL, копия для поиска в ES, синхронизация через события.
- **Geo** — «найди ближайшее» (такси, доставка): **geohash** (близкие точки → общий префикс строки) или quadtree, R-tree. Из коробки: Redis GEO, PostGIS.

!!! warning "Ловушка: одной транзакции на все базы нет"
    `@Transactional` охватывает только PostgreSQL. Если запись в Cassandra упадёт после коммита в Postgres, данные разойдутся — согласованность между хранилищами обеспечивают отдельно (см. [Transactional Outbox](../architecture/distributed-transactions.md#outbox)).

!!! warning "Ловушка: Elasticsearch как источник истины"
    Поисковый индекс — копия данных, синхронизируемая событиями, и он может отставать или потерять часть обновлений. Источником истины остаётся SQL-база, а индекс при необходимости переиндексируют из неё.

??? question "Проверь себя"
    1. Почему `@Transactional` не делает метод из примера атомарным?
    2. Почему файлы не хранят в реляционной БД и что такое presigned URL?
    3. Почему `LIKE '%слово%'` не заменяет поисковый движок?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **NoSQL vs SQL** | Не замена, а другой инструмент. SQL — связи, ACID, выбор по умолчанию; NoSQL — гибкая схема, горизонтальное масштабирование и известный паттерн доступа |
| **Document** | JSON-документы, гибкая схема. MongoDB. Каталоги, CMS, данные с переменной структурой |
| **Key-Value** | O(1) по ключу. Redis. Кэш, сессии, счётчики, очереди, лидерборды |
| **Redis vs Hazelcast** | Redis — 16 384 слота, smart clients. Hazelcast — 271 партиция, data locality |
| **Wide-Column** | Проектируй под запросы. Cassandra. IoT, логи, временные ряды, огромные объёмы |
| **Graph** | Узлы и рёбра — полноценные объекты. Neo4j. Соцсети, рекомендации, мошенничество |
| **Redis типы** | String (кэш), List (очередь), Set (уникальные), ZSet (рейтинг), Hash (объект), Stream (события) |
| **Cassandra правило** | Partition key обязателен в запросе. Схема = запросы, не данные |
| **Polyglot** | Разные данные в разных хранилищах: PostgreSQL + Redis + Cassandra — нормально. Файлы — в S3 (в БД ключ, presigned URL), поиск — Elasticsearch, метрики — time-series |

<!-- --8<-- [end:cheatsheet] -->
