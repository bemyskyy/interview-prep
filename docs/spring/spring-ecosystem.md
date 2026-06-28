# Spring: Экосистема и Архитектура

## Spring Security

### Главная концепция: цепочка фильтров

Spring Security — не монолитный блок, а **`SecurityFilterChain`**: цепочка фильтров, каждый из которых выполняет одну задачу. Один проверяет CORS, второй ищет JWT-токен, третий проверяет права, четвёртый обрабатывает ошибки.

```
Запрос
  ↓
CorsFilter               → проверка CORS-заголовков
  ↓
SecurityContextPersistenceFilter → восстановление контекста (для сессий)
  ↓
UsernamePasswordAuthenticationFilter → логин/пароль
  ↓
[Твой JwtAuthenticationFilter]  → валидация JWT-токена
  ↓
ExceptionTranslationFilter      → перехват 401/403
  ↓
AuthorizationFilter             → проверка прав (@PreAuthorize, .hasRole())
  ↓
DispatcherServlet → @RestController
```

### 1. Аутентификация — "Кто ты?"

```java
// Пользователь прислал логин и пароль:
// 1. UsernamePasswordAuthenticationFilter создаёт черновик Authentication
// 2. Передаёт AuthenticationManager
// 3. Manager опрашивает провайдеров:

@Component
public class CustomAuthProvider implements AuthenticationProvider {

    private final UserDetailsService userDetailsService;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Authentication authenticate(Authentication auth) throws AuthenticationException {
        String username = auth.getName();
        String rawPassword = auth.getCredentials().toString();

        UserDetails user = userDetailsService.loadUserByUsername(username);
        // UserDetailsService идёт в БД и возвращает UserDetails

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BadCredentialsException("Неверный пароль");
        }

        // Возвращаем подтверждённый Authentication с ролями
        return new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
    }

    @Override
    public boolean supports(Class<?> authClass) {
        return UsernamePasswordAuthenticationToken.class.isAssignableFrom(authClass);
    }
}
```

**Успех:** подтверждённый `Authentication` кладётся в **`SecurityContextHolder`** — `ThreadLocal`-хранилище, доступное из любой точки приложения в текущем потоке.

```java
// Получить текущего пользователя из любого места кода
SecurityContext ctx = SecurityContextHolder.getContext();
Authentication auth = ctx.getAuthentication();
String username = auth.getName();
Collection<? extends GrantedAuthority> roles = auth.getAuthorities();
```

### 2. Авторизация — "Что тебе можно?"

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity  // включает @PreAuthorize, @PostAuthorize
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)  // для REST API
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))  // без сессий
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()         // открытые эндпоинты
                .requestMatchers("/api/admin/**").hasRole("ADMIN")   // только ADMIN
                .requestMatchers(HttpMethod.GET, "/api/**").hasAnyRole("USER", "ADMIN")
                .anyRequest().authenticated()                        // всё остальное — аутентифицированным
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(/* 401 handler */)
                .accessDeniedHandler(/* 403 handler */)
            )
            .build();
    }
}

// Авторизация на уровне метода
@RestController
public class AdminController {

    @GetMapping("/api/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDto> getAllUsers() { ... }

    @DeleteMapping("/api/habits/{id}")
    @PreAuthorize("#id == authentication.principal.id or hasRole('ADMIN')")
    public void delete(@PathVariable Long id) { ... } // владелец или ADMIN
}
```

**При отказе:**

- Нет аутентификации → `AuthenticationException` → **401 Unauthorized**
- Нет прав → `AccessDeniedException` → **403 Forbidden**

### 3. JWT-интеграция — Stateless REST API

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {

        // 1. Извлечь токен из заголовка
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);

        // 2. Валидировать подпись и срок действия
        if (!jwtService.isValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        // 3. Достать данные из claims — БЕЗ ПОХОДА В БД!
        String username = jwtService.extractUsername(token);
        List<String> roles = jwtService.extractRoles(token);

        // 4. Собрать Authentication и положить в контекст
        var authorities = roles.stream()
            .map(SimpleGrantedAuthority::new)
            .collect(toList());

        var auth = new UsernamePasswordAuthenticationToken(username, null, authorities);
        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(auth);

        chain.doFilter(request, response);
        // Контроллеры думают, что юзер аутентифицирован стандартным способом
    }
}
```

### Сеньорские нюансы

!!! warning "Потеря SecurityContext в асинхронных потоках"
    `SecurityContextHolder` использует `ThreadLocal` — данные привязаны к потоку Tomcat. Новый поток из `@Async` или `CompletableFuture` ничего о нём не знает → `getAuthentication()` вернёт `null`.

    ```java
    // ❌ Контекст потеряется
    CompletableFuture.runAsync(() -> {
        SecurityContextHolder.getContext().getAuthentication(); // null!
    });

    // ✅ DelegatingSecurityContextExecutor прокидывает контекст в дочерние потоки
    @Bean
    public Executor securityAwareExecutor() {
        return new DelegatingSecurityContextExecutorService(
            Executors.newFixedThreadPool(10)
        );
    }
    ```

!!! warning "Главный минус JWT: невозможность инвалидации"
    _"Как реализовать Logout если мы используем JWT?"_

    Напрямую инвалидировать JWT нельзя — он валидируется математически, без обращения к БД.

    **Решение для продакшена:**

    - **Short-lived Access Token (5-15 мин)** + **Long-lived Refresh Token** в БД/Redis.
    - При логауте — удаляем Refresh Token из хранилища. Access Token сам протухнет.
    - В критичных системах (финтех) — **Blacklist в Redis**: JWT-фильтр проверяет при каждом запросе, не отозван ли токен.

    ```java
    // JWT-фильтр с проверкой blacklist
    if (redisBlacklist.contains(token)) {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        return;
    }
    ```

---

## Spring Kafka под капотом

### 1. Как работает `@KafkaListener`

`@KafkaListener` — это обёртка над бесконечным `while(true) { consumer.poll(...) }`. Spring сканирует бины, находит аннотацию и просит `ConcurrentKafkaListenerContainerFactory` создать рабочий поток (или несколько, если `concurrency > 1`).

```java
@Component
public class HabitEventConsumer {

    @KafkaListener(
        topics = "habit-created",
        groupId = "notification-service",
        concurrency = "3"   // 3 потока-консюмера для этого топика
    )
    public void consume(HabitCreatedEvent event, Acknowledgment ack) {
        try {
            notificationService.sendReminder(event);
            ack.acknowledge(); // коммитим оффсет только после успешной обработки
        } catch (Exception e) {
            log.error("Ошибка обработки события", e);
            // не вызываем ack → при рестарте сообщение придёт снова
        }
    }
}
```

### 2. Автоматический vs Ручной коммит оффсетов

**Оффсет** — указатель на то, какие сообщения уже обработаны.

!!! danger "Автоматический коммит — зло для бизнес-логики"
    `enable.auto.commit = true`: каждые 5 секунд фоновый поток сам коммитит оффсеты.

    Ты вычитал сообщение об оплате, но сервис упал с ошибкой и не сохранил данные в БД. Фоновый поток уже успел закоммитить оффсет. Сообщение потеряно навсегда. Бизнес в ярости.

```yaml
# application.yml — правильная настройка
spring:
  kafka:
    consumer:
      enable-auto-commit: false
      auto-offset-reset: earliest
    listener:
      ack-mode: MANUAL  # коммитим только вручную через ack.acknowledge()
```

**Гарантия At-Least-Once:** если сервис упадёт до `ack.acknowledge()` — при рестарте это же сообщение придёт снова.

### 3. Dead Letter Queue (DLQ) — обработка "ядовитых" сообщений

**Проблема Poison Pill:** пришёл битый JSON. Парсер падает, коммита нет, при следующем `poll()` — то же сообщение, снова падает. Вся партиция заблокирована (Head-of-line blocking).

```java
@Configuration
public class KafkaErrorHandlerConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> kafkaTemplate) {
        // 1. Recoverer: перекладывает битое сообщение в топик с суффиксом .DLT
        DeadLetterPublishingRecoverer recoverer =
            new DeadLetterPublishingRecoverer(kafkaTemplate,
                (record, ex) -> new TopicPartition(record.topic() + ".DLT", -1));

        // 2. Backoff: 3 попытки с интервалом 1 сек → если всё равно падает → DLQ
        ExponentialBackOff backOff = new ExponentialBackOff(1000L, 2.0);
        backOff.setMaxAttempts(3);

        return new DefaultErrorHandler(recoverer, backOff);
    }
}

// Алгоритм:
// 1. Spring ловит ошибку из листенера
// 2. Делает retry с backoff (3 раза × 1/2/4 сек)
// 3. Если все попытки исчерпаны → сообщение → habit-created.DLT
// 4. Оффсет в основном топике коммитится → основной поток идёт дальше
// 5. Битое сообщение разбирают разработчики вручную или отдельным сервисом
```

### Сеньорские нюансы

!!! warning "Блокировка Listener-потока и Heartbeat-таймаут"
    _"Ты вычитал сообщение и пошёл по REST в другой микросервис. Тот завис на 10 минут. Что произойдёт?"_

    Параметр `max.poll.interval.ms` (по умолчанию 5 мин). Если листенер завис и не вызывает следующий `poll()` — брокер решает, что сервис умер, и запускает **Rebalance**: передаёт партицию другому инстансу.

    **Правило:** в листенере нельзя делать долгие синхронные операции без контроля таймаутов. Долгие задачи → отдельный пул потоков, не блокируй листенер.

!!! tip "At-Least-Once + Идемпотентность = надёжная система"
    При ручном коммите одно сообщение может прийти дважды (сохранили в БД, но упали до `ack()`).

    **Решение:** идемпотентная обработка через уникальный бизнес-ID.

    ```java
    @Transactional
    public void processPayment(PaymentEvent event) {
        // Проверяем — не обрабатывали ли мы уже эту транзакцию?
        if (processedEventRepository.existsById(event.getTransactionId())) {
            log.info("Дубликат транзакции {}, пропускаем", event.getTransactionId());
            return; // ack будет вызван в листенере
        }
        paymentService.debit(event);
        processedEventRepository.save(new ProcessedEvent(event.getTransactionId()));
    }
    ```

---

## Spring в условиях DDD (Гексагональная архитектура)

### Проблема классической слоистой архитектуры

В классической слоистой архитектуре (`Controller → Service → Repository`) бизнес-логика в `@Service` знает про Spring, JPA, конкретные реализации. При смене БД — правим сервисы. При тестировании — поднимаем контекст. Бизнес тонет в технологиях.

### Гексагон: структура

```
┌─────────────────────────────────────────────────────────┐
│  Infrastructure (Spring, JPA, Kafka, REST)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Application (Use Cases, Ports)                   │   │
│  │  ┌─────────────────────────────────────────────┐ │   │
│  │  │  Domain (чистая Java, бизнес-логика)         │ │   │
│  │  │  Entity, Value Objects, Domain Services      │ │   │
│  │  └─────────────────────────────────────────────┘ │   │
│  │  Incoming Ports (Use Case интерфейсы)             │   │
│  │  Outgoing Ports (Repository интерфейсы)           │   │
│  └──────────────────────────────────────────────────┘   │
│  Driving Adapters: @RestController, @KafkaListener        │
│  Driven Adapters: JpaRepository, KafkaTemplate           │
└─────────────────────────────────────────────────────────┘
```

### 1. Domain — чистая Java, ноль Spring

```java
// ❌ Анемичная модель (антипаттерн)
@Entity
public class Booking {
    private Long id;
    private BookingStatus status;
    // только геттеры и сеттеры, логика в сервисе
}

// ✅ Богатая доменная модель (Rich Domain Model)
// Никаких @Entity, @Service, @Autowired — чистая Java
public class Booking {
    private final BookingId id;
    private BookingStatus status;
    private final ClientId clientId;
    private final TimeSlot timeSlot;

    // Бизнес-метод защищает инварианты
    public void confirm() {
        if (this.status != BookingStatus.PENDING) {
            throw new IllegalStateException("Можно подтвердить только ожидающую запись");
        }
        this.status = BookingStatus.CONFIRMED;
    }

    public void cancel(String reason) {
        if (this.status == BookingStatus.COMPLETED) {
            throw new IllegalStateException("Нельзя отменить завершённую запись");
        }
        this.status = BookingStatus.CANCELLED;
    }
}
```

### 2. Ports — контракты без реализации

```java
// Incoming Port — что умеет система (Use Case)
public interface CreateBookingUseCase {
    Booking createBooking(CreateBookingCommand command);
}

public interface CancelBookingUseCase {
    void cancelBooking(BookingId id, String reason);
}

// Outgoing Port — что нужно ядру от внешнего мира
public interface BookingRepository {   // обычный Java-интерфейс, не JpaRepository!
    void save(Booking booking);
    Optional<Booking> findById(BookingId id);
    List<Booking> findByClientId(ClientId clientId);
}

public interface NotificationPort {
    void notifyBookingConfirmed(Booking booking);
}
```

### 3. Application — Use Cases (бизнес-логика)

```java
// Чистый Java-класс, реализует Use Case
// Нет @Service, @Transactional, @Autowired — только бизнес-логика
public class CreateBookingService implements CreateBookingUseCase {

    private final BookingRepository bookingRepository;   // Outgoing Port
    private final NotificationPort notificationPort;     // Outgoing Port

    // Конструктор вместо @Autowired
    public CreateBookingService(BookingRepository bookingRepository,
                                NotificationPort notificationPort) {
        this.bookingRepository = bookingRepository;
        this.notificationPort = notificationPort;
    }

    @Override
    public Booking createBooking(CreateBookingCommand command) {
        // Только бизнес-правила
        if (bookingRepository.isSlotOccupied(command.getTimeSlot())) {
            throw new SlotAlreadyBookedException(command.getTimeSlot());
        }
        Booking booking = new Booking(command.getClientId(), command.getTimeSlot());
        bookingRepository.save(booking);
        notificationPort.notifyBookingConfirmed(booking);
        return booking;
    }
}
```

### 4. Infrastructure — адаптеры (здесь живёт Spring)

```java
// Driving Adapter — входящий (REST)
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final CreateBookingUseCase createBooking; // Incoming Port, не сервис!

    public BookingController(CreateBookingUseCase createBooking) {
        this.createBooking = createBooking;
    }

    @PostMapping
    public ResponseEntity<BookingDto> create(@Valid @RequestBody CreateBookingRequest req) {
        Booking booking = createBooking.createBooking(req.toCommand());
        return ResponseEntity.status(CREATED).body(BookingDto.from(booking));
    }
}

// Driven Adapter — исходящий (JPA реализует наш доменный интерфейс)
@Component
public class JpaBookingRepository implements BookingRepository { // Outgoing Port!

    private final BookingJpaRepository jpaRepo; // стандартный JpaRepository

    @Override
    public void save(Booking booking) {
        BookingJpaEntity entity = BookingMapper.toEntity(booking); // маппинг!
        jpaRepo.save(entity);
    }

    @Override
    public Optional<Booking> findById(BookingId id) {
        return jpaRepo.findById(id.getValue())
            .map(BookingMapper::toDomain); // маппинг обратно в доменный объект
    }
}

// JPA Entity — только для персистентности, не бизнес-объект
@Entity
@Table(name = "bookings")
public class BookingJpaEntity {
    @Id @GeneratedValue
    private Long id;
    private Long clientId;
    private LocalDateTime slotStart;
    private LocalDateTime slotEnd;
    @Enumerated(EnumType.STRING)
    private BookingStatus status;
}
```

### 5. Конфигурация — склеиваем всё через Spring

```java
@Configuration
public class DomainConfig {

    // Spring создаёт чистый Java-объект и инжектит адаптеры
    @Bean
    public CreateBookingUseCase createBookingUseCase(
            BookingRepository bookingRepository,     // Spring найдёт JpaBookingRepository
            NotificationPort notificationPort) {
        return new CreateBookingService(bookingRepository, notificationPort);
    }

    @Bean
    public CancelBookingUseCase cancelBookingUseCase(BookingRepository bookingRepository) {
        return new CancelBookingService(bookingRepository);
    }
}
```

### Где ставить `@Transactional`?

!!! tip "Главный холивар DDD + Spring"
    В ядре нет Spring. Но транзакции — это бизнес-требование. Куда вешать `@Transactional`?

    **Подход 1 — Пуристский:** Создать Decorator-обёртку на инфраструктурном слое:

    ```java
    @Component
    @Primary
    public class TransactionalCreateBookingUseCase implements CreateBookingUseCase {
        private final CreateBookingService delegate; // чистый сервис

        @Override
        @Transactional  // транзакция на обёртке, не в ядре
        public Booking createBooking(CreateBookingCommand command) {
            return delegate.createBooking(command);
        }
    }
    ```

    **Подход 2 — Прагматичный (принятый в индустрии):** Использовать `javax.transaction.Transactional` (стандарт JTA, не Spring-специфичный импорт) прямо в Use Case. Это допустимый компромисс — транзакции реально являются частью бизнес-требований (ACID), и завязка на JTA-стандарт некритична.

### Сеньорские нюансы

!!! note "Проблема двойных сущностей"
    _"Зачем маппить `Booking` → `BookingJpaEntity` → `Booking`? Это же дублирование!"_

    **Ответ:** Это цена изоляции. JPA Entity требует пустого конструктора, геттеров/сеттеров, аннотаций связей — она оптимизирована под структуру таблиц. Domain Model оптимизирована под бизнес-правила: может не иметь сеттеров вообще, структура не совпадает с таблицами.

    В простых CRUD-приложениях — это оверхед. В сложных доменах — это спасает от превращения в "Big Ball of Mud" (большой ком грязи).

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **SecurityFilterChain** | Цепочка фильтров. Security — это фильтры, не интерцепторы |
| **SecurityContextHolder** | ThreadLocal. В `@Async` — нужен `DelegatingSecurityContextExecutor` |
| **JWT Logout** | Инвалидировать нельзя. Решение: короткий Access Token + Refresh Token в Redis |
| **`@KafkaListener`** | Обёртка над `consumer.poll()`. `concurrency` = количество потоков |
| **Ручной коммит** | `AckMode.MANUAL` + `ack.acknowledge()` после успешной обработки |
| **Poison Pill / DLQ** | `DefaultErrorHandler` + retry с backoff → `DeadLetterPublishingRecoverer` |
| **At-Least-Once** | Дубликаты возможны → идемпотентность через уникальный бизнес-ID |
| **`max.poll.interval.ms`** | 5 мин по умолчанию. Долгая обработка → Rebalance → не блокируй поток |
| **DDD: Domain** | Чистая Java. Никаких `@Entity`, `@Service`. Богатая модель с бизнес-методами |
| **DDD: Ports** | Incoming — Use Cases (что умеем). Outgoing — Repository и внешние сервисы |
| **DDD: Adapters** | Driving (REST/Kafka) → Driven (JPA/HTTP-клиент). Здесь живёт Spring |
| **`@Transactional` в DDD** | Декоратор (пуристы) или `javax.transaction.Transactional` в Use Case (прагматики) |