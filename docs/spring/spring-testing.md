---
tags:
  - Junior
  - Middle
  - Spring
  - Тестирование
---

# Тестирование

Как тестировать Spring-приложение: какой тестовый срез выбрать, как писать юнит-тесты без контекста Spring, как проверить контроллер без БД и репозиторий без всего остального и зачем нужны Testcontainers. На собесе чаще всего спрашивают про пирамиду тестов, `@WebMvcTest` против `@SpringBootTest` и чем `@Mock` отличается от `@MockBean`.

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

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Тест-срезы** | `@WebMvcTest` (контроллеры) / `@DataJpaTest` (репозитории) / `@SpringBootTest` (всё) |
| **Пирамида тестов** | 70% юнит → 20% срезы → 10% интеграционные |
| **`@Mock` vs `@MockBean`** | `@Mock` — вне Spring. `@MockBean` — регистрирует мок в контексте Spring |
| **`@DataJpaTest`** | H2 по умолчанию, данные через `TestEntityManager`, Postgres — `replace = NONE` |
| **Testcontainers** | Реальная БД в тестах. `@DynamicPropertySource` подхватывает URL контейнера |

<!-- --8<-- [end:cheatsheet] -->
