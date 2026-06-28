# Spring Web / MVC

## DispatcherServlet — Front Controller

**Паттерн:** Front Controller. `DispatcherServlet` перехватывает 100% входящих HTTP-запросов и работает как регулировщик, раздавая задачи другим компонентам.

### Пошаговый Request Flow

```
Клиент
  ↓ HTTP-запрос
Tomcat
  ↓
DispatcherServlet
  ↓ "Кто обрабатывает /api/users?"
HandlerMapping         → возвращает метод контроллера + список Interceptors
  ↓
HandlerAdapter         → парсит JSON, подставляет @RequestBody/@PathVariable, вызывает метод
  ↓
@RestController        → бизнес-логика, вызов сервисов, обращение к БД
  ↓ Java-объект
HttpMessageConverter   → сериализует в JSON (Jackson), пишет в тело ответа
  ↓
Клиент получает JSON
```

**Подробнее по шагам:**

1. **Tomcat → DispatcherServlet** — веб-сервер принимает сырой HTTP-запрос и передаёт главному сервлету.
2. **DispatcherServlet → HandlerMapping** — "Какой метод контроллера должен обработать этот URL?" HandlerMapping сверяется с реестром аннотаций (`@GetMapping`, `@PostMapping`) и возвращает метод + цепочку Interceptors.
3. **DispatcherServlet → HandlerAdapter** — сервлет не умеет вызывать методы напрямую. Адаптер извлекает данные из запроса, парсит JSON, подставляет аргументы и запускает метод.
4. **Выполнение в `@RestController`** — твой код: сервисы, БД. Метод возвращает Java-объект.
5. **HttpMessageConverter** — Jackson сериализует объект в JSON, пишет в тело ответа.

!!! tip "Вопрос на засыпку"
    _"Зачем нужен `HandlerAdapter`, если можно просто вызвать метод через рефлексию?"_

    Чтобы отвязать `DispatcherServlet` от конкретных реализаций контроллеров. Контроллеры можно писать через аннотации или через старые интерфейсы из ранних версий Spring. Адаптер скрывает эту разницу — DispatcherServlet работает с единым интерфейсом адаптера.

### Ключевые аннотации контроллера

```java
@RestController               // @Controller + @ResponseBody на каждом методе
@RequestMapping("/api/habits")
public class HabitController {

    // Маппинг методов
    @GetMapping("/{id}")
    @PostMapping
    @PutMapping("/{id}")
    @DeleteMapping("/{id}")
    @PatchMapping("/{id}")

    // Извлечение данных из запроса
    public ResponseEntity<HabitDto> getHabit(
        @PathVariable Long id,              // из URL: /api/habits/42
        @RequestParam String category,      // из query: ?category=HEALTH
        @RequestBody HabitCreateDto dto,    // из тела запроса (JSON)
        @RequestHeader("X-User-Id") Long userId,  // из заголовка
        @CookieValue("session") String session    // из cookie
    ) { ... }
}
```

### `ResponseEntity` — полный контроль над ответом

```java
// Явно задаём статус, заголовки и тело
return ResponseEntity
    .status(HttpStatus.CREATED)                          // 201
    .header("Location", "/api/habits/" + habit.getId())
    .body(habitDto);

// Короткие фабричные методы
return ResponseEntity.ok(habitDto);                      // 200
return ResponseEntity.noContent().build();               // 204
return ResponseEntity.notFound().build();                // 404
return ResponseEntity.badRequest().body(errorDto);       // 400
```

## Обработка исключений

Вместо `try-catch` в каждом контроллере — централизованный обработчик.

**Как работает:** Если метод в `@RestController` или `@Service` выбрасывает исключение — ошибка летит вверх. `DispatcherServlet` перехватывает её и передаёт `HandlerExceptionResolver`. Резолвер находит класс с `@RestControllerAdvice` и вызывает нужный метод.

```java
@RestControllerAdvice  // @ControllerAdvice + @ResponseBody
@Slf4j
public class GlobalExceptionHandler {

    // Конкретная бизнес-ошибка — логируем на WARN
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleUserNotFound(UserNotFoundException ex) {
        log.warn("Пользователь не найден: {}", ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(404, ex.getMessage(), LocalDateTime.now()));
    }

    // Ошибки валидации Bean Validation (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(e -> e.getField() + ": " + e.getDefaultMessage())
            .collect(Collectors.joining(", "));
        return ResponseEntity
            .status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(400, message, LocalDateTime.now()));
    }

    // Fallback для всего непредвиденного — логируем на ERROR со стектрейсом!
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleAll(Exception ex) {
        log.error("Внутренняя ошибка сервера", ex);
        return ResponseEntity
            .status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse(500, "Внутренняя ошибка. Мы уже чиним.", LocalDateTime.now()));
    }
}
```

### Сеньорские нюансы

**`@RestControllerAdvice` vs `@ControllerAdvice`:**

`@RestControllerAdvice` = `@ControllerAdvice` + `@ResponseBody`. Без `@ResponseBody` Spring воспримет возвращаемую строку как имя HTML-шаблона, а не как JSON. Для REST API всегда используй `@RestControllerAdvice`.

**Маршрутизация ошибок — по наиболее точному классу:**

```java
// Упала UserNotFoundException → первый метод (точное совпадение)
// Упала NullPointerException  → провалится в Exception.class (fallback)
// Порядок методов в классе не важен — важна иерархия классов исключений
```

**Spring Boot 3 и RFC 7807 — `ProblemDetail`:**

```java
// ✅ Вместо самописного ErrorResponse — стандарт RFC 7807
@ExceptionHandler(UserNotFoundException.class)
public ProblemDetail handleUserNotFound(UserNotFoundException ex) {
    ProblemDetail problem = ProblemDetail
        .forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
    problem.setTitle("Пользователь не найден");
    problem.setType(URI.create("https://api.example.com/errors/user-not-found"));
    problem.setProperty("userId", ex.getUserId()); // кастомные поля
    return problem;
}
// Поля из коробки: type, title, status, detail, instance
// Стандартизирует ответы всех микросервисов без написания велосипедов
```

## Фильтры (Filters) vs Перехватчики (Interceptors)

**Главное отличие одной фразой:** `Filter` — охранник на входе в здание (уровень Tomcat/Servlet). `Interceptor` — секретарь перед дверью конкретного кабинета (уровень Spring MVC).

### Поток обработки

```
Клиент
  ↓
[Filter chain]  ← уровень Servlet API, до Spring
  ↓
DispatcherServlet
  ↓
[Interceptor.preHandle]  ← уровень Spring MVC
  ↓
@RestController (твой код)
  ↓
[Interceptor.postHandle]
  ↓
DispatcherServlet
  ↓
[Interceptor.afterCompletion]  ← вызывается всегда, даже при ошибке
  ↓
[Filter chain]  ← на выходе
  ↓
Клиент
```

### Filter (Фильтр) — уровень Servlet API

```java
@Component
public class LoggingFilter extends OncePerRequestFilter { // не Filter напрямую!

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        // --- ДО запроса ---
        long start = System.currentTimeMillis();
        String requestId = UUID.randomUUID().toString();
        request.setAttribute("requestId", requestId);

        // Тело запроса можно прочитать только ОДИН РАЗ!
        // Оборачиваем в кэширующую обёртку
        ContentCachingRequestWrapper wrappedRequest =
            new ContentCachingRequestWrapper(request);

        log.info("[{}] {} {}", requestId, request.getMethod(), request.getRequestURI());

        chain.doFilter(wrappedRequest, response); // передаём управление дальше

        // --- ПОСЛЕ запроса ---
        long duration = System.currentTimeMillis() - start;
        log.info("[{}] Статус: {}, Время: {}ms", requestId, response.getStatus(), duration);
    }
}
```

**Где применяется:**

- Глобальная аутентификация (Spring Security — это цепочка именно фильтров)
- Настройка CORS-заголовков
- Глобальное логирование (IP, URL, время ответа)
- Сжатие GZIP

### Interceptor (Перехватчик) — уровень Spring MVC

```java
@Component
public class AuthorizationInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception { // handler — ссылка на метод контроллера!

        if (handler instanceof HandlerMethod method) {
            // Доступ к аннотациям конкретного метода
            RequiresRole annotation = method.getMethodAnnotation(RequiresRole.class);
            if (annotation != null) {
                String userRole = (String) request.getAttribute("userRole");
                if (!annotation.value().equals(userRole)) {
                    response.setStatus(HttpStatus.FORBIDDEN.value());
                    return false; // прерываем цепочку, контроллер не вызывается
                }
            }
        }
        return true; // пропускаем дальше
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response,
                           Object handler, ModelAndView modelAndView) {
        // Вызывается ПОСЛЕ контроллера, но ДО записи ответа
        // Можно добавить заголовки к ответу
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) {
        // Вызывается ВСЕГДА — даже если контроллер или postHandle упали с ошибкой
        // Идеально для очистки ресурсов, завершения логирования
    }
}

// Регистрация:
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authorizationInterceptor)
            .addPathPatterns("/api/**")
            .excludePathPatterns("/api/auth/**");
    }
}
```

**Где применяется:**

- Проверка прав доступа к конкретным эндпоинтам (авторизация)
- Логирование времени выполнения конкретного метода
- Обогащение контекста (достать userId из токена и положить в `ThreadLocal`)

### Сравнительная таблица

| | **Filter** | **Interceptor** |
|---|---|---|
| **Чей механизм** | Servlet API (Jakarta EE) | Spring Web MVC |
| **Когда срабатывает** | До `DispatcherServlet` | Внутри `DispatcherServlet` |
| **Что видит** | Сырой HTTP-запрос | HTTP-запрос + метод контроллера (`handler`) |
| **Доступ к Spring-бинам** | Да (если `@Component`) | Да (Spring-компонент) |
| **Применение** | Security, CORS, GZIP, глобальный лог | Авторизация, бизнес-логика маршрутов, аудит |
| **Базовый класс** | `OncePerRequestFilter` | `HandlerInterceptor` |

### Сеньорские нюансы

!!! warning "Ловушка: исчезнувшее тело запроса"
    `InputStream` HTTP-запроса можно прочитать только **один раз**. Если фильтр прочитает тело для логирования — до контроллера дойдёт пустой запрос, Spring бросит `HttpMessageNotReadableException`.

    **Решение:** Обернуть запрос в `ContentCachingRequestWrapper`. Он буферизирует тело в память и позволяет читать его многократно.

!!! note "Почему `OncePerRequestFilter`, а не `Filter`?"
    Голый интерфейс `Filter` может вызываться несколько раз за один HTTP-цикл (например, при внутреннем `forward` или обработке ошибок контейнером). `OncePerRequestFilter` гарантирует, что логика выполнится строго один раз.

!!! tip "Где живёт Spring Security?"
    Частая ошибка джунов — говорить, что Spring Security работает на интерцепторах. **Это не так.** Spring Security — это `FilterChainProxy`, цепочка именно **фильтров**. Он должен отбить злоумышленника ещё до того, как тяжеловесный `DispatcherServlet` начнёт свою работу.

## Валидация (`@Valid` и Bean Validation)

```java
// DTO с ограничениями
public record HabitCreateDto(
    @NotBlank(message = "Название обязательно")
    @Size(min = 2, max = 100)
    String name,

    @NotNull
    @Min(1) @Max(10)
    Integer priority,

    @Email
    String reminderEmail,

    @Future(message = "Дата должна быть в будущем")
    LocalDate startDate
) {}

// Контроллер: @Valid запускает валидацию перед вызовом метода
@PostMapping
public ResponseEntity<HabitDto> create(@Valid @RequestBody HabitCreateDto dto) {
    // если валидация не прошла — до этой строки не дойдём
    // MethodArgumentNotValidException летит в GlobalExceptionHandler
    return ResponseEntity.status(CREATED).body(habitService.create(dto));
}

// Валидация в сервисе (нужно @Validated на классе)
@Service
@Validated
public class HabitService {
    public HabitDto findByName(@NotBlank String name) { ... }
}
```

## CORS — Cross-Origin Resource Sharing

```java
// Вариант 1 — аннотация на контроллере
@CrossOrigin(origins = "https://myapp.com")
@RestController
public class HabitController { ... }

// Вариант 2 — глобально через конфигурацию (рекомендуется)
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("https://myapp.com", "https://admin.myapp.com")
            .allowedMethods("GET", "POST", "PUT", "DELETE")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600); // браузер кэширует preflight на 1 час
    }
}

// Вариант 3 — через фильтр Spring Security (если Security подключён)
// Предпочтительно, так как фильтр срабатывает раньше DispatcherServlet
```

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **DispatcherServlet** | Front Controller. Порядок: HandlerMapping → HandlerAdapter → Controller → HttpMessageConverter |
| **HandlerAdapter** | Скрывает разницу между реализациями контроллеров. Парсит аргументы и вызывает метод |
| **`@RestControllerAdvice`** | Централизованная обработка ошибок. Лучше `@ControllerAdvice` для REST |
| **Иерархия исключений** | Spring выбирает обработчик по наиболее точному классу исключения |
| **RFC 7807 / `ProblemDetail`** | Spring Boot 3+ стандарт для структуры ошибок |
| **Filter vs Interceptor** | Filter — до DispatcherServlet (Servlet API). Interceptor — внутри (Spring MVC) |
| **`OncePerRequestFilter`** | Всегда наследоваться от него, не от голого `Filter` |
| **Ловушка InputStream** | Тело запроса читается один раз. Для логирования — `ContentCachingRequestWrapper` |
| **Spring Security** | Это цепочка **фильтров** (FilterChainProxy), не интерцепторов |
| **`@Valid`** | Запускает Bean Validation. Ошибки летят как `MethodArgumentNotValidException` |