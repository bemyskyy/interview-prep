# Spring: тестирование и инструменты

Тестирование Spring-приложений, кэширование через `@Cacheable`, мониторинг через Actuator и Micrometer и обзор WebFlux. На собесе чаще всего спрашивают, какой тестовый срез выбрать, чем `@Mock` отличается от `@MockBean`, почему `@Cacheable` не срабатывает и когда WebFlux лучше MVC.

## Тестирование { #testing }

### Какой тестовый срез выбрать? { #test-slices }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    `@SpringBootTest` поднимает весь контекст — это медленно, поэтому для большинства тестов берут срез: `@WebMvcTest` для контроллеров, `@DataJpaTest` для репозиториев, `@JsonTest` для сериализации. Бизнес-логику проверяют обычными юнит-тестами на Mockito без Spring. Пирамида: 70% юнит, 20% срезы, 10% интеграционные.

Самая частая ошибка — везде писать `@SpringBootTest`. Он поднимает весь контекст: медленно и тяжело. Для большинства тестов нужен **срез** — только нужная часть контекста.

| Аннотация | Что поднимает | Когда использовать |
|---|---|---|
| `@SpringBootTest` | Весь контекст + сервер | Интеграционные тесты, E2E |
| `@WebMvcTest` | Только MVC-слой (контроллеры) | Тест REST API без БД |
| `@DataJpaTest` | Только JPA-слой + встроенная БД | Тест репозиториев, запросов |
| `@JsonTest` | Только Jackson | Тест сериализации DTO |
| Без аннотации | Ничего | Юнит-тест с Mockito |

!!! tip "Стратегия тестирования"
    **Пирамида тестов:** 70% юнит (быстро, дёшево) → 20% `@WebMvcTest` / `@DataJpaTest` (средне) → 10% `@SpringBootTest` + Testcontainers (медленно, но достоверно). Не делай наоборот.

!!! warning "Ловушка: `@SpringBootTest` везде"
    Полный контекст в каждом тесте превращает прогон в минуты. Пирамида, перевёрнутая вверх дном, — признак того, что логика не отделена от инфраструктуры.

??? question "Проверь себя"
    1. Что поднимает `@WebMvcTest`, а что — `@DataJpaTest`?
    2. Какие пропорции у пирамиды тестов?
    3. Чем плох `@SpringBootTest` для каждого теста?

### Как написать юнит-тест без Spring? { #unit-tests }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Обычный класс с JUnit 5 и Mockito, без Spring-аннотаций. Зависимости помечают `@Mock`, тестируемый объект — `@InjectMocks`, и Mockito создаёт его через конструктор с моками. Поведение задают через `when(...).thenReturn(...)`, проверяют вызовы через `verify(...)`.

```java
// Никаких Spring-аннотаций — просто Java + Mockito
class HabitServiceTest {

    @Mock
    private HabitRepository habitRepository;

    @Mock
    private NotificationPort notificationPort;

    @InjectMocks
    private HabitService habitService;  // создаётся через new, зависимости мокаются

    @BeforeEach
    void setUp() { MockitoAnnotations.openMocks(this); }

    @Test
    void createHabit_shouldSaveAndNotify() {
        // given
        var command = new CreateHabitCommand("Бег", 1L);
        var savedHabit = new Habit(1L, "Бег");
        when(habitRepository.save(any())).thenReturn(savedHabit);

        // when
        Habit result = habitService.create(command);

        // then
        assertThat(result.getName()).isEqualTo("Бег");
        verify(habitRepository).save(any(Habit.class));
        verify(notificationPort).notifyCreated(savedHabit);
    }

    @Test
    void createHabit_whenLimitExceeded_shouldThrow() {
        when(habitRepository.countByUserId(1L)).thenReturn(50L);

        assertThatThrownBy(() -> habitService.create(new CreateHabitCommand("Бег", 1L)))
            .isInstanceOf(HabitLimitExceededException.class)
            .hasMessageContaining("50");
    }
}
```

Юнит-тест без Spring возможен благодаря внедрению через конструктор — см. [Spring Core → Внедрение через конструктор](spring-core.md#constructor-injection).

!!! warning "Ловушка: забытый `openMocks()`"
    Без `MockitoAnnotations.openMocks(this)` (или `@ExtendWith(MockitoExtension.class)` на классе) поля с `@Mock` и `@InjectMocks` останутся `null`, и тест упадёт с `NullPointerException`.

??? question "Проверь себя"
    1. Что делает `@InjectMocks`?
    2. Как проверить, что метод мока был вызван?
    3. Почему такой тест не требует Spring-контекста?

### Как протестировать контроллер без БД? { #webmvctest }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Через `@WebMvcTest(HabitController.class)`: поднимается только MVC-слой, а запросы шлются через `MockMvc` без реального сервера. Сервисы подменяются через `@MockBean`, который регистрирует мок в Spring-контексте. Безопасность в таких тестах эмулируют через `@WithMockUser`.

```java
@WebMvcTest(HabitController.class)
class HabitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean  // MockBean вместо Mock — регистрирует мок в Spring Context
    private HabitService habitService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getHabit_shouldReturn200() throws Exception {
        var dto = new HabitDto(1L, "Бег");
        when(habitService.findById(1L)).thenReturn(dto);

        mockMvc.perform(get("/api/habits/1")
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("Бег"));
    }

    @Test
    void createHabit_withInvalidBody_shouldReturn400() throws Exception {
        var invalidDto = new CreateHabitDto(""); // пустое имя нарушает @NotBlank

        mockMvc.perform(post("/api/habits")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidDto)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @WithMockUser(roles = "ADMIN")  // Spring Security в тестах
    void deleteHabit_asAdmin_shouldReturn204() throws Exception {
        mockMvc.perform(delete("/api/habits/1"))
            .andExpect(status().isNoContent());
    }
}
```

!!! warning "Ловушка: `@MockBean` и `@Mock`"
    `@Mock` (Mockito) создаёт мок вне Spring-контекста — для юнит-тестов. `@MockBean` (Spring) регистрирует мок в Spring-контексте и заменяет реальный бин. Путаница между ними — частая ошибка на собесах.

??? question "Проверь себя"
    1. Что поднимает `@WebMvcTest`?
    2. Чем `@MockBean` отличается от `@Mock`?
    3. Как в тесте контроллера выполнить запрос от имени администратора?

### Как протестировать репозиторий? { #datajpatest }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Через `@DataJpaTest`: поднимается только JPA-слой со встроенной H2. Данные для теста готовят через `TestEntityManager`, а не через тестируемый репозиторий. Чтобы тестировать на реальном Postgres, добавляют `@AutoConfigureTestDatabase(replace = NONE)`.

```java
@DataJpaTest
// По умолчанию использует H2 in-memory БД
// Если нужен реальный Postgres — добавь @AutoConfigureTestDatabase(replace = NONE)
class HabitRepositoryTest {

    @Autowired
    private HabitRepository habitRepository;

    @Autowired
    private TestEntityManager em; // удобнее EntityManager для тестов

    @Test
    void findByUserId_shouldReturnOnlyUserHabits() {
        // Arrange — создаём данные через EntityManager (не через репозиторий)
        var user1 = em.persist(new UserEntity("Alice"));
        var user2 = em.persist(new UserEntity("Bob"));
        em.persist(new HabitEntity("Бег", user1));
        em.persist(new HabitEntity("Медитация", user1));
        em.persist(new HabitEntity("Йога", user2));
        em.flush();

        // Act
        List<HabitEntity> habits = habitRepository.findByUserId(user1.getId());

        // Assert
        assertThat(habits).hasSize(2)
            .extracting(HabitEntity::getName)
            .containsExactlyInAnyOrder("Бег", "Медитация");
    }
}
```

!!! warning "Ловушка: H2 — не Postgres"
    Запрос, который работает на H2, может упасть на Postgres: диалекты SQL, типы и функции различаются. Для запросов со специфичным SQL используй реальную БД — через `replace = NONE` и [Testcontainers](#testcontainers).

??? question "Проверь себя"
    1. Какую БД использует `@DataJpaTest` по умолчанию?
    2. Зачем готовить данные через `TestEntityManager`, а не через репозиторий?
    3. Как переключить `@DataJpaTest` на реальный Postgres?

### Зачем нужны Testcontainers? { #testcontainers }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Testcontainers поднимает реальную БД в Docker-контейнере на время тестов. `@DynamicPropertySource` передаёт Spring адрес, логин и пароль запущенного контейнера. Тест идёт на настоящем Postgres, и миграции Flyway тоже применяются.

```java
@SpringBootTest
@Testcontainers
class HabitIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15")
        .withDatabaseName("testdb");

    @DynamicPropertySource  // Spring подхватывает URL из запущенного контейнера
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private HabitService habitService;

    @Test
    void fullFlowTest() {
        // Тест на реальном Postgres — миграции Flyway тоже применятся
        var habit = habitService.create(new CreateHabitCommand("Бег", 1L));
        assertThat(habit.getId()).isNotNull();
    }
}
```

!!! warning "Ловушка: контейнер не `static`"
    Поле с `@Container` должно быть `static`, чтобы контейнер поднимался один раз на класс. Нестатическое поле перезапускает контейнер для каждого теста, а `@DynamicPropertySource` — статический метод и к такому полю обратиться не может.

??? question "Проверь себя"
    1. Что делает `@DynamicPropertySource`?
    2. Чем тест на Testcontainers достовернее теста на H2?
    3. Какое место интеграционные тесты занимают в пирамиде?

## Кэширование { #caching }

Стратегии кэширования (Cache-Aside, Write-Through, Write-Behind), вытеснение и Cache Stampede разобраны в [System Design → Caching](../system-design/system-design.md#caching). Здесь — Spring-абстракция кэша.

### Как работает `@Cacheable`? { #cacheable }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    `@Cacheable` — AOP-аспект: при вызове прокси ищет результат в кэше по ключу и, если нашёл, метод не выполняется. `@CacheEvict` удаляет запись из кэша, `@CachePut` всегда выполняет метод и кладёт результат в кэш. Включается через `@EnableCaching`, а хранилище (Redis, Caffeine, Ehcache) подключается отдельной зависимостью.

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-cache</artifactId>
</dependency>
<!-- + реализация: Redis, Caffeine, Ehcache -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

```java
@SpringBootApplication
@EnableCaching  // включает обработку аннотаций кэширования
public class App { }

@Service
public class HabitService {

    // Результат кэшируется. Повторный вызов с тем же id → из кэша, в БД не идём
    @Cacheable(value = "habits", key = "#id")
    public HabitDto findById(Long id) {
        return habitRepository.findById(id)        // выполнится только если кэш пуст
            .map(HabitMapper::toDto)
            .orElseThrow();
    }

    // Инвалидация: после обновления — удаляем устаревший кэш
    @CacheEvict(value = "habits", key = "#dto.id")
    public HabitDto update(HabitUpdateDto dto) {
        // после выполнения метода кэш для этого id очищается
        return habitRepository.save(HabitMapper.toEntity(dto));
    }

    // Обновление: всегда выполняет метод и обновляет кэш новым результатом
    @CachePut(value = "habits", key = "#result.id")
    public HabitDto create(CreateHabitCommand command) {
        var entity = habitRepository.save(HabitMapper.toEntity(command));
        return HabitMapper.toDto(entity);
    }

    // Очистить весь кэш "habits" (например, при массовом обновлении)
    @CacheEvict(value = "habits", allEntries = true)
    public void clearCache() { }
}
```

`@Cacheable` реализует стратегию Cache-Aside: сначала кэш, при промахе — метод (то есть БД), результат — в кэш.

!!! warning "Ловушка: кэш не работает при самовызове"
    `@Cacheable` — AOP-аспект. `this.findById()` внутри того же класса минует прокси, и кэш не сработает — та же проблема, что и с `@Transactional`. Механизм — в [Spring Core → Самовызов](spring-core.md#self-invocation).

??? question "Проверь себя"
    1. Чем `@Cacheable` отличается от `@CachePut`?
    2. Как очистить весь кэш `habits`?
    3. Почему `@Cacheable` не срабатывает при вызове через `this`?

### Как настроить Redis-кэш с TTL? { #redis-cache-config }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Через бин `RedisCacheManager`: в `RedisCacheConfiguration` задают TTL по умолчанию, сериализацию значений в JSON и запрет кэшировать `null`. Для отдельных кэшей можно задать свой TTL — например, 30 минут для `habits` и сутки для редко меняющихся `categories`.

```java
@Configuration
public class CacheConfig {

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory factory) {
        // Конфигурация по умолчанию
        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))           // TTL 10 минут
            .disableCachingNullValues()                  // null не кэшируем
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer())
            );

        // Разные TTL для разных кэшей
        Map<String, RedisCacheConfiguration> configs = Map.of(
            "habits",      defaultConfig.entryTtl(Duration.ofMinutes(30)),
            "user-stats",  defaultConfig.entryTtl(Duration.ofHours(1)),
            "categories",  defaultConfig.entryTtl(Duration.ofDays(1))  // редко меняются
        );

        return RedisCacheManager.builder(factory)
            .cacheDefaults(defaultConfig)
            .withInitialCacheConfigurations(configs)
            .build();
    }
}
```

!!! warning "Ловушка: кэширование `null`"
    По умолчанию Spring кэширует `null`. Если метод вернул `null` (объект не найден), кэш сохранит `null` и будет отдавать его. Обычно добавляют `disableCachingNullValues()` или бросают исключение вместо возврата `null`.

??? question "Проверь себя"
    1. Где задаётся TTL по умолчанию для Redis-кэша?
    2. Как задать разный TTL для разных кэшей?
    3. Что будет, если метод с `@Cacheable` вернёт `null`?

### Чем `condition` отличается от `unless`? { #condition-vs-unless }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Оба — SpEL-условия в `@Cacheable`. `condition` проверяется до выполнения метода и решает, обращаться ли к кэшу вообще. `unless` проверяется после выполнения, имеет доступ к `#result` и решает, класть ли результат в кэш.

```java
// condition — проверяется ДО выполнения метода
@Cacheable(value = "habits", condition = "#id > 0")

// unless — проверяется ПОСЛЕ выполнения (можно использовать #result)
@Cacheable(value = "habits", unless = "#result.size() == 0")
```

!!! warning "Ловушка: `#result` в `condition`"
    В `condition` результата ещё нет — метод не выполнялся. Условия на результат («не кэшировать пустой список») пишут только в `unless`.

??? question "Проверь себя"
    1. Когда проверяется `condition`, а когда `unless`?
    2. Где доступен `#result`?
    3. Как не кэшировать пустой список?

## Actuator и Micrometer { #actuator-micrometer }

Концепции наблюдаемости — метрики, логи, трейсы, золотые сигналы, health checks — разобраны в [System Design → Observability](../system-design/system-design.md#observability). Здесь — инструменты Spring.

### Что даёт Actuator и как его защитить? { #actuator }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Actuator — HTTP-эндпоинты мониторинга из коробки: `/actuator/health` для состояния приложения и зависимостей, `/actuator/metrics`, `/actuator/conditions` с отчётом автоконфигурации, `/actuator/loggers` для смены уровней логирования на лету. Какие эндпоинты открыть, задают в `management.endpoints.web.exposure.include`. В продакшене их закрывают Spring Security.

**Actuator** — HTTP-эндпоинты для мониторинга приложения. **Micrometer** — библиотека метрик (аналог SLF4J, но для метрик): одинаковый API, разные бэкенды (Prometheus, Datadog, CloudWatch).

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,conditions,loggers
  endpoint:
    health:
      show-details: when-authorized
```

| Эндпоинт | Что показывает |
|---|---|
| `GET /actuator/health` | Состояние приложения и его зависимостей (БД, Kafka, Redis) |
| `GET /actuator/info` | Информация о приложении (версия, git-коммит) |
| `GET /actuator/metrics` | Метрики: JVM, HTTP-запросы, пул соединений |
| `GET /actuator/conditions` | Полный отчёт об автоконфигурации (что сработало и почему) |
| `GET /actuator/loggers` | Уровни логирования. `POST` — изменить в рантайме без перезапуска |
| `GET /actuator/env` | Все properties и переменные окружения |

Как отчёт `/actuator/conditions` помогает отлаживать автоконфигурацию, — в [Spring Boot → Автоконфигурация](spring-boot.md#override-autoconfig).

!!! warning "Ловушка: открытые эндпоинты в проде"
    В продакшене никогда не открывай все эндпоинты публично. Минимум — настрой Spring Security так, чтобы `/actuator/**` был доступен только из внутренней сети или роли `ADMIN`. `env` и `conditions` могут раскрыть пароли и структуру приложения.

??? question "Проверь себя"
    1. Что показывает `/actuator/health`?
    2. Как изменить уровень логирования без перезапуска?
    3. Почему `/actuator/env` опасно открывать публично?

### Как писать свои метрики в Micrometer? { #micrometer }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Через `MeterRegistry` и три основных типа метрик: `Counter` считает, сколько раз что-то произошло, `Timer` — сколько времени заняло, `Gauge` показывает текущее значение, например размер очереди. Метрики регистрируются один раз — обычно в конструкторе — с именем, описанием и тегами.

```java
@Service
public class HabitService {

    private final Counter habitCreatedCounter;
    private final Timer habitSaveTimer;
    private final MeterRegistry registry;

    public HabitService(MeterRegistry registry) {
        this.registry = registry;

        // Счётчик: сколько привычек создано
        this.habitCreatedCounter = Counter.builder("habit.created")
            .description("Количество созданных привычек")
            .tag("type", "user-action")
            .register(registry);

        // Таймер: время сохранения в БД
        this.habitSaveTimer = Timer.builder("habit.save.duration")
            .description("Время сохранения привычки")
            .register(registry);
    }

    public HabitDto create(CreateHabitCommand command) {
        return habitSaveTimer.record(() -> {   // замеряем время выполнения
            var entity = habitRepository.save(HabitMapper.toEntity(command));
            habitCreatedCounter.increment();   // увеличиваем счётчик
            return HabitMapper.toDto(entity);
        });
    }
}

// Gauge — текущее значение (например, размер очереди)
Gauge.builder("habit.queue.size", pendingQueue, Queue::size)
    .description("Размер очереди ожидающих привычек")
    .register(registry);
```

!!! warning "Ловушка: Counter для текущего значения"
    `Counter` только растёт. Размер очереди или число активных соединений, которые могут уменьшаться, меряют через `Gauge`.

??? question "Проверь себя"
    1. Чем `Counter` отличается от `Gauge`?
    2. Как замерить время выполнения блока кода?
    3. Где обычно регистрируют метрики?

### Как подключить Prometheus и Grafana? { #prometheus }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Открывают эндпоинт `/actuator/prometheus`, и Prometheus по расписанию забирает с него метрики (scrape), а Grafana строит по ним дашборды. Micrometer сам публикует десятки стандартных метрик: память JVM, HTTP-запросы, пул HikariCP, лаг Kafka-консьюмера.

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  metrics:
    tags:
      application: ${spring.application.name}  # тег на всех метриках
```

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'habit-service'
    scrape_interval: 15s
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['habit-service:8080']
```

Micrometer автоматически предоставляет: `jvm_memory_used_bytes`, `http_server_requests_seconds`, `hikaricp_connections_active`, `kafka_consumer_lag` и десятки других метрик.

!!! warning "Ловушка: метрики без тега приложения"
    Когда в Prometheus собираются метрики десятка сервисов, без общего тега `application` их не отличить друг от друга. Тег задают один раз в `management.metrics.tags`.

??? question "Проверь себя"
    1. Какой эндпоинт опрашивает Prometheus?
    2. Как добавить тег на все метрики приложения?
    3. Какие метрики Micrometer публикует из коробки?

## Spring WebFlux { #webflux }

### Зачем нужен реактивный подход? { #why-reactive }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    В Spring MVC каждый запрос занимает поток Tomcat, и большую часть времени поток просто ждёт ответа БД или другого сервиса. WebFlux использует неблокирующий ввод-вывод на Netty: небольшой пул потоков обслуживает тысячи запросов, переключаясь между ними, пока те ждут I/O.

В классическом Spring MVC каждый HTTP-запрос занимает поток Tomcat. При 1000 одновременных запросов — 1000 потоков, каждый примерно с 1 МБ стека, то есть около 1 ГБ памяти. 90% времени потоки просто **ждут** — ответа от БД или от другого сервиса.

**WebFlux** использует неблокирующий I/O (Netty вместо Tomcat): небольшой пул потоков обрабатывает тысячи запросов, переключаясь между ними, когда те ждут I/O.

!!! warning "Ловушка: реактивность не ускоряет вычисления"
    WebFlux выигрывает только там, где потоки ждут I/O. CPU-bound работу он не ускоряет — потоков для вычислений меньше не становится.

??? question "Проверь себя"
    1. Сколько памяти уходит на стеки 1000 потоков в MVC?
    2. На каком сервере работает WebFlux по умолчанию?
    3. За счёт чего WebFlux обходится небольшим пулом потоков?

### Что такое `Mono` и `Flux`? { #mono-flux }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Это основные реактивные типы. `Mono<T>` — 0 или 1 элемент, аналог `Optional` плюс `Future`; `Flux<T>` — 0..N элементов, аналог `Stream` плюс `Future`. Контроллер просто возвращает `Mono` или `Flux`, а Spring сам на них подписывается.

```java
// Mono<T> — 0 или 1 элемент (аналог Optional + Future)
Mono<HabitDto> findById(Long id) { ... }

// Flux<T> — 0..N элементов (аналог Stream + Future)
Flux<HabitDto> findAll() { ... }

// Пример реактивного сервиса
@Service
public class HabitService {

    public Mono<HabitDto> findById(Long id) {
        return habitRepository.findById(id)          // реактивный репозиторий
            .switchIfEmpty(Mono.error(new NotFoundException(id)))
            .map(HabitMapper::toDto);
    }

    public Flux<HabitDto> findAllByUser(Long userId) {
        return habitRepository.findByUserId(userId)
            .filter(h -> h.isActive())
            .map(HabitMapper::toDto);
    }
}

// Реактивный контроллер
@RestController
public class HabitController {

    @GetMapping("/api/habits/{id}")
    public Mono<HabitDto> getById(@PathVariable Long id) {
        return habitService.findById(id);  // просто возвращаем Mono, Spring сам подпишется
    }

    @GetMapping(value = "/api/habits/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<HabitDto> streamHabits() {
        return habitService.findAll();  // Server-Sent Events из коробки
    }
}
```

На собесах по WebFlux часто спрашивают разницу `map` и `flatMap` (синхронная и асинхронная трансформация) и что такое backpressure — потребитель контролирует скорость производителя.

!!! warning "Ловушка: без подписки ничего не происходит"
    `Mono` и `Flux` ленивые: цепочка операторов только описывает работу. Пока на результат никто не подписался (в контроллере это делает Spring), запрос к БД не выполнится.

??? question "Проверь себя"
    1. Чем `Mono` отличается от `Flux`?
    2. Чем `map` отличается от `flatMap`?
    3. Что такое backpressure?

### Когда выбирать WebFlux, а когда MVC? { #webflux-vs-mvc }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    MVC — для обычных CRUD-сервисов на JPA/JDBC, когда команда знает MVC: просто и предсказуемо. WebFlux — когда много I/O-bound запросов, стриминг данных и высокая конкурентность, но тогда весь стек должен быть реактивным: R2DBC вместо JPA, WebClient вместо RestTemplate.

| | **Spring MVC** | **Spring WebFlux** |
|---|---|---|
| **Модель** | Блокирующая, поток на запрос | Неблокирующая, событийный цикл |
| **Сервер** | Tomcat (по умолчанию) | Netty (по умолчанию) |
| **БД** | JPA/JDBC (блокирующие) | R2DBC (реактивный драйвер) |
| **Когда** | Обычные CRUD-сервисы, команда знает MVC | Много I/O-bound запросов, стриминг данных, высокая конкурентность |
| **Сложность** | Низкая | Высокая (дебаг, стектрейсы) |

!!! warning "Ловушка: блокирующий вызов в реактивном коде"
    Если в реактивном коде есть хотя бы **одна блокирующая операция** (JDBC, синхронный HTTP-клиент, `Thread.sleep`), блокируется весь event loop, и производительность падает **ниже MVC**. WebFlux требует полностью реактивного стека: R2DBC вместо JPA, WebClient вместо RestTemplate.

??? question "Проверь себя"
    1. Какой драйвер БД нужен для WebFlux?
    2. Что будет, если в реактивном коде вызвать JDBC?
    3. Когда MVC остаётся лучшим выбором?

## Шпаргалка { #cheatsheet }

| Тема | Запомнить |
|---|---|
| **Тест-срезы** | `@WebMvcTest` (контроллеры) / `@DataJpaTest` (репозитории) / `@SpringBootTest` (всё) |
| **Пирамида тестов** | 70% юнит → 20% срезы → 10% интеграционные |
| **`@Mock` vs `@MockBean`** | `@Mock` — вне Spring. `@MockBean` — регистрирует мок в контексте Spring |
| **`@DataJpaTest`** | H2 по умолчанию, данные через `TestEntityManager`, Postgres — `replace = NONE` |
| **Testcontainers** | Реальная БД в тестах. `@DynamicPropertySource` подхватывает URL контейнера |
| **`@Cacheable`** | AOP-аспект. Не работает при самовызове. Кэширует `null` по умолчанию |
| **`@CacheEvict` / `@CachePut`** | Удалить из кэша (`allEntries = true` — весь кэш) / всегда выполнить и обновить |
| **`unless` vs `condition`** | `condition` — до метода. `unless` — после (есть доступ к `#result`) |
| **Redis-кэш** | `RedisCacheManager`: TTL по умолчанию и на кэш, JSON-сериализация, `disableCachingNullValues()` |
| **Actuator** | HTTP-эндпоинты мониторинга. В проде закрыть Security |
| **Micrometer** | Counter (сколько раз) / Timer (сколько времени) / Gauge (текущее значение) |
| **Prometheus** | Scrape `/actuator/prometheus`, тег `application` на всех метриках |
| **WebFlux** | Неблокирующий I/O. Netty вместо Tomcat. `Mono` / `Flux` вместо объектов |
| **WebFlux ловушка** | Одна блокирующая операция блокирует весь event loop |
