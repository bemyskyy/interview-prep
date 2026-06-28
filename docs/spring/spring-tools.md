# Spring: Инструменты

## Тестирование

### Главный выбор: какой срез поднимать?

Самая частая ошибка — везде писать `@SpringBootTest`. Это поднимает весь контекст (медленно, тяжело). Для большинства тестов нужен **срез** — только нужная часть контекста.

| Аннотация | Что поднимает | Когда использовать |
|---|---|---|
| `@SpringBootTest` | Весь контекст + сервер | Интеграционные тесты, E2E |
| `@WebMvcTest` | Только MVC-слой (контроллеры) | Тест REST API без БД |
| `@DataJpaTest` | Только JPA-слой + встроенная БД | Тест репозиториев, запросов |
| `@JsonTest` | Только Jackson | Тест сериализации DTO |
| Без аннотации | Ничего | Юнит-тест с Mockito |

### Юнит-тесты — быстро, без Spring

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

### `@WebMvcTest` — тест контроллера без БД

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

### `@DataJpaTest` — тест репозитория и запросов

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

### Testcontainers — реальная БД в тестах

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

!!! tip "Стратегия тестирования"
    **Пирамида тестов:** 70% юнит (быстро, дёшево) → 20% `@WebMvcTest` / `@DataJpaTest` (средне) → 10% `@SpringBootTest` + Testcontainers (медленно, но достоверно). Не делай наоборот.

!!! warning "MockBean vs Mock"
    `@Mock` (Mockito) — создаёт мок вне Spring Context, для юнит-тестов. `@MockBean` (Spring) — регистрирует мок в Spring Context, заменяет реальный бин. Путаница между ними — частая ошибка на собесах.

---

## Кэширование (`@Cacheable`)

### Базовое использование

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

### Конфигурация Redis с TTL

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

### Ключевые нюансы

!!! warning "Ловушка: кэш не работает при self-invocation"
    `@Cacheable` — это AOP-аспект. `this.findById()` внутри того же класса минует прокси → кэш не сработает. Та же проблема, что и с `@Transactional`.

!!! warning "Ловушка: кэширование null"
    По умолчанию Spring кэширует `null`. Если метод вернул `null` (объект не найден), кэш сохранит null и будет его отдавать. Обычно добавляют `disableCachingNullValues()` или бросают исключение вместо возврата null.

!!! warning "Ловушка: condition vs unless"
    ```java
    // condition — проверяется ДО выполнения метода
    @Cacheable(value = "habits", condition = "#id > 0")

    // unless — проверяется ПОСЛЕ выполнения (можно использовать #result)
    @Cacheable(value = "habits", unless = "#result.size() == 0")
    ```

---

## Spring Actuator + Micrometer (для сеньоров)

### Что это и зачем

**Actuator** — HTTP-эндпоинты для мониторинга приложения. **Micrometer** — библиотека метрик (аналог SLF4J, но для метрик): одинаковый API, разные бэкенды (Prometheus, Datadog, CloudWatch).

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

### Кастомные метрики

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

### Prometheus + Grafana

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

---

## Spring WebFlux / Reactive (обзор)

### Зачем нужен реактивный подход?

В классическом Spring MVC каждый HTTP-запрос занимает поток Tomcat. При 1000 одновременных запросов — 1000 потоков (каждый ~1 МБ стека = 1 ГБ памяти). 90% времени потоки просто **ждут** — ответа от БД, ответа от другого сервиса.

**WebFlux** использует неблокирующий I/O (Netty вместо Tomcat): небольшой пул потоков обрабатывает тысячи запросов, переключаясь между ними когда те ждут I/O.

### Mono и Flux — основные типы

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

### Когда WebFlux, когда MVC?

| | **Spring MVC** | **Spring WebFlux** |
|---|---|---|
| **Модель** | Блокирующая, поток на запрос | Неблокирующая, событийный цикл |
| **Сервер** | Tomcat (по умолчанию) | Netty (по умолчанию) |
| **БД** | JPA/JDBC (блокирующие) | R2DBC (реактивный драйвер) |
| **Когда** | Обычные CRUD-сервисы, команда знает MVC | Много I/O-bound запросов, стриминг данных, высокая конкурентность |
| **Сложность** | Низкая | Высокая (дебаг, стектрейсы) |

!!! warning "Главная ошибка с WebFlux"
    Если в реактивном коде есть хотя бы **одна блокирующая операция** (JDBC, синхронный HTTP-клиент, `Thread.sleep`) — блокируется весь event loop и производительность падает **ниже MVC**. WebFlux требует полностью реактивного стека: R2DBC вместо JPA, WebClient вместо RestTemplate.

!!! note "На собесах по WebFlux часто спрашивают"
    Разницу `map` vs `flatMap` (синхронная vs асинхронная трансформация), что такое `backpressure` (потребитель контролирует скорость производителя), и почему нельзя мешать блокирующий и реактивный код.

---

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **Тест-срезы** | `@WebMvcTest` (контроллеры) / `@DataJpaTest` (репозитории) / `@SpringBootTest` (всё) |
| **Mock vs MockBean** | `@Mock` — вне Spring. `@MockBean` — регистрирует в контексте Spring |
| **Testcontainers** | Реальная БД в тестах. `@DynamicPropertySource` подхватывает URL контейнера |
| **Пирамида тестов** | 70% юнит → 20% срезы → 10% интеграционные |
| **`@Cacheable`** | AOP-аспект. Не работает при self-invocation. Кэширует null по умолчанию |
| **`@CacheEvict`** | Удаляет из кэша. `allEntries = true` — очищает весь кэш |
| **`unless` vs `condition`** | `condition` — до метода. `unless` — после (есть доступ к `#result`) |
| **Actuator** | HTTP-эндпоинты мониторинга. В проде закрыть Security |
| **Micrometer** | Counter (сколько раз) / Timer (сколько времени) / Gauge (текущее значение) |
| **WebFlux** | Неблокирующий I/O. Netty вместо Tomcat. Mono/Flux вместо объектов |
| **WebFlux ловушка** | Одна блокирующая операция = убиваешь весь event loop |