# Spring Boot

## Зачем Spring Boot, если есть Spring?

Чтобы понять ценность Spring Boot, нужно вспомнить, как страдали раньше (во времена чистого Spring Framework):

1. **Ад конфигураций:** Огромные XML-файлы или Java-классы `@Configuration` только чтобы подружить Spring с базой данных — создать `DataSource`, `TransactionManager`, настроить Hibernate.
2. **Ад зависимостей:** Самостоятельная сборка зоопарка версий библиотек, которые совместимы друг с другом.
3. **Ад деплоя:** Сборка в `.war`, перенос на внешний Tomcat/WildFly, молитвы при запуске.

**Spring Boot — это не новый фреймворк.** Это умная оболочка над тем же Spring Core. Его философия — **Convention over Configuration**: _"В 90% случаев всем нужны одинаковые настройки. Я сделаю всё по умолчанию. Вмешивайся только когда хочешь что-то изменить."_

Плюс — **Embedded Servers (встроенные серверы)**. Tomcat работает _внутри_ твоего `.jar`. Просто `java -jar app.jar` — и приложение поднимает себя само.

## Автоконфигурация (Auto-configuration)

### `@SpringBootApplication` — что внутри

Это аннотация-композит. Под ней прячутся три:

```java
@SpringBootConfiguration    // этот класс — конфигурация
@ComponentScan              // сканировать @Service, @Component в текущем пакете
@EnableAutoConfiguration    // ← Святой Грааль магии Spring Boot
```

### Как работает `@EnableAutoConfiguration`

Ты добавил в `pom.xml` зависимость Kafka. Не написал ни строчки кода — а Spring уже создал `KafkaTemplate`. Как?

**Шаг 1. Чтение "книги рецептов"**

При старте Spring Boot читает специальные файлы внутри JAR-архивов стартеров:

- **До Spring Boot 2.7:** `META-INF/spring.factories` — огромный текстовый файл со списком конфигурационных классов.
- **Spring Boot 2.7+ и 3.x:** `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` — современный формат, список классов построчно.

Spring Boot берёт этот список и пытается загрузить все конфигурации в память.

**Шаг 2. Условные аннотации (`@Conditional`) — самое гениальное**

Spring Boot не создаёт бины бездумно. Каждая автоконфигурация защищена условиями. Он смотрит в `classpath` и задаёт вопросы:

```java
@ConditionalOnClass(KafkaTemplate.class)
// "Есть ли класс KafkaTemplate в проекте?"
// Зависимость добавлена → класс найден → идём дальше.
// Зависимости нет → игнорируем всю конфигурацию.

@ConditionalOnProperty(prefix = "spring.kafka", name = "bootstrap-servers")
// "Прописал ли разработчик адреса серверов в application.yml?"

@ConditionalOnMissingBean(KafkaTemplate.class)
// ← САМАЯ ВАЖНАЯ для собеса
// "Создал ли разработчик свой KafkaTemplate руками?"
// Создал → отступаем, не мешаем.
// Не создал → создаём дефолтный за него.
```

!!! tip "Как отвечать на собесе"
    "Автоконфигурация работает за счёт сканирования `classpath` и аннотаций `@Conditional`. Spring Boot находит файл `AutoConfiguration.imports`, берёт список конфигураций и применяет их только если выполняются условия: нужная библиотека есть в classpath (`@ConditionalOnClass`), в properties прописаны настройки, и разработчик ещё не создал свой бин (`@ConditionalOnMissingBean`)."

### Как отключить или переопределить автоконфигурацию

```java
// Отключить конкретную автоконфигурацию
@SpringBootApplication(exclude = { DataSourceAutoConfiguration.class })
public class App { }

// Или через application.yml
// spring.autoconfigure.exclude: org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration
```

```java
// Переопределить дефолтный бин — просто создай свой
// @ConditionalOnMissingBean увидит его и не будет создавать дефолтный
@Configuration
public class MyKafkaConfig {
    @Bean
    public KafkaTemplate<String, String> kafkaTemplate(ProducerFactory<String, String> pf) {
        // своя кастомная настройка
        return new KafkaTemplate<>(pf);
    }
}
```

### Как посмотреть, что именно сконфигурировал Spring Boot

```bash
# Запустить с флагом — в логах будет полный отчёт:
# Conditions Evaluation Report: что применилось и почему
java -jar app.jar --debug

# Или через Actuator (если подключён):
# GET /actuator/conditions
```

## Управление зависимостями (Starters и BOM)

### Что такое Dependency Hell

Во времена чистого Spring для простого веб-приложения нужно было вручную добавлять 30-40 зависимостей: `spring-core`, `spring-web`, `spring-webmvc`, `spring-context`, `jackson-core`, `jackson-databind`, Tomcat, `slf4j`, `logback`...

И указывать каждую версию руками. Взял `spring-webmvc` 4.3 и `jackson-databind` 2.2 — получи `ClassNotFoundException` при запуске. Два дня на подбор совместимых версий — до первого "Hello World".

### Лекарство №1: Стартеры

**Стартер** — это пустой JAR без Java-кода. Просто заранее собранный `pom.xml`, группирующий библиотеки для конкретной задачи.

```xml
<!-- Одна строчка вместо 15 -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
<!-- Транзитивно подтягивает: Spring MVC, Tomcat, Jackson, Validation -->

<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
</dependency>
<!-- Транзитивно подтягивает: Hibernate, Spring Data, HikariCP, Transaction Manager -->
```

Стартеры смещают фокус с _технологий_ на _возможности_. Не "мне нужен Tomcat и Jackson", а "я хочу писать REST API".

**Популярные стартеры:**

| Стартер | Что даёт |
|---|---|
| `spring-boot-starter-web` | Spring MVC, Tomcat, Jackson |
| `spring-boot-starter-data-jpa` | Hibernate, Spring Data, HikariCP |
| `spring-boot-starter-security` | Spring Security |
| `spring-boot-starter-test` | JUnit 5, Mockito, AssertJ |
| `spring-boot-starter-actuator` | Метрики, health checks, мониторинг |
| `spring-boot-starter-validation` | Bean Validation (Hibernate Validator) |
| `spring-boot-starter-cache` | Абстракция кэширования |

### Лекарство №2: BOM (Bill of Materials)

Интервьюер спросит: _"Стартер подтянул библиотеки. Но как гарантируется, что их версии не конфликтуют? Почему мы не пишем `<version>` в зависимостях?"_

Ответ — **BOM (Bill of Materials)**.

Под капотом любого Spring Boot проекта спрятан файл `spring-boot-dependencies`. Команда Spring тестирует тысячи библиотек в разных комбинациях и прописывает идеальные совместимые версии:

```xml
<!-- В твоём pom.xml -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.2.0</version>
</parent>

<!-- Теперь можно не указывать версии — BOM подставит их сам -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-jpa</artifactId>
    <!-- Версия подставится автоматически: Hibernate 6.x, HikariCP 5.x, и т.д. -->
</dependency>
```

Maven/Gradle идут в BOM, смотрят версию Spring Boot, автоматически подставляют совместимые версии всех зависимостей.

!!! tip "Итог"
    Dependency Hell побеждён тем, что процесс подбора и тестирования версий делегирован команде инженеров Spring. Твой проект всегда использует гарантированно совместимый набор.

### Стартер vs Автоконфигурация — граница ответственности

Джуны часто путают эти два понятия. Показать разницу — это признак понимания архитектуры.

| | **Starter** | **Auto-configuration** |
|---|---|---|
| **За что отвечает** | Приносит `.jar` файлы библиотек в проект | Создаёт бины (объекты) на основе этих библиотек |
| **Когда работает** | Этап сборки (Maven / Gradle) | Этап запуска (Spring Context) |
| **Пример** | Скачивает Kafka-клиент | Видит Kafka-клиент и создаёт `KafkaTemplate` |

Они работают в тандеме: Стартер приносит байты, Автоконфигурация оживляет их в объекты.

## application.properties / application.yml

### Форматы и приоритеты

Spring Boot читает конфигурацию из множества источников. Порядок приоритетов (выше = важнее):

```
1. Аргументы командной строки           java -jar app.jar --server.port=9090
2. Переменные окружения (OS)            SERVER_PORT=9090
3. application-{profile}.yml            application-prod.yml
4. application.yml / application.properties
5. Дефолтные значения из автоконфигурации
```

### Профили (`@Profile` и `spring.profiles.active`)

```yaml
# application.yml — общие настройки
spring:
  application:
    name: habit-tracker

---
# application-dev.yml
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:h2:mem:devdb  # in-memory БД для разработки

---
# application-prod.yml
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: jdbc:postgresql://prod-server:5432/habits
```

```bash
# Активировать профиль
java -jar app.jar --spring.profiles.active=prod
# Или через переменную окружения
SPRING_PROFILES_ACTIVE=prod java -jar app.jar
```

```java
// Бин только для конкретного профиля
@Service
@Profile("dev")
public class MockEmailSender implements EmailSender {
    @Override
    public void send(String to, String body) {
        log.info("[DEV] Письмо не отправлено, только лог: {} → {}", to, body);
    }
}

@Service
@Profile("prod")
public class SmtpEmailSender implements EmailSender { ... }
```

### `@Value` и `@ConfigurationProperties`

```yaml
# application.yml
app:
  habits:
    max-per-user: 50
    reminder-hour: 9
    allowed-categories:
      - HEALTH
      - PRODUCTIVITY
      - LEARNING
```

```java
// ❌ @Value — работает, но многословно и хрупко
@Service
public class HabitService {
    @Value("${app.habits.max-per-user}")
    private int maxPerUser;

    @Value("${app.habits.reminder-hour}")
    private int reminderHour;
    // И так для каждого свойства...
}

// ✅ @ConfigurationProperties — типобезопасно, IDE-поддержка, валидация
@ConfigurationProperties(prefix = "app.habits")
@Validated  // включает Bean Validation
public class HabitProperties {
    @Min(1) @Max(100)
    private int maxPerUser = 10;       // дефолтное значение

    @Min(0) @Max(23)
    private int reminderHour = 8;

    private List<String> allowedCategories = new ArrayList<>();

    // геттеры/сеттеры или record
}

// Зарегистрировать:
@SpringBootApplication
@EnableConfigurationProperties(HabitProperties.class)
public class App { }

// Использование:
@Service
public class HabitService {
    private final HabitProperties props;

    public HabitService(HabitProperties props) {
        this.props = props;
    }

    public void createHabit(Habit habit) {
        if (habitCount >= props.getMaxPerUser()) {
            throw new LimitExceededException("Максимум " + props.getMaxPerUser() + " привычек");
        }
    }
}
```

!!! tip "Когда что использовать"
    `@Value` — для одиночных значений, быстро и просто. `@ConfigurationProperties` — для группы связанных настроек: типобезопасно, поддержка IDE, валидация, легко тестировать.

## Actuator — мониторинг из коробки

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

**Полезные эндпоинты:**

| Эндпоинт | Что показывает |
|---|---|
| `GET /actuator/health` | Состояние приложения и его зависимостей (БД, Kafka, Redis) |
| `GET /actuator/info` | Информация о приложении (версия, git-коммит) |
| `GET /actuator/metrics` | Метрики: JVM, HTTP-запросы, пул соединений |
| `GET /actuator/conditions` | Полный отчёт об автоконфигурации (что сработало и почему) |
| `GET /actuator/loggers` | Уровни логирования. `POST` — изменить в рантайме без перезапуска |
| `GET /actuator/env` | Все properties и переменные окружения |

!!! warning "Безопасность Actuator"
    В продакшене никогда не открывай все эндпоинты публично. Минимум — настрой Spring Security так, чтобы `/actuator/**` был доступен только для внутренней сети или роли `ADMIN`. `env` и `conditions` могут раскрыть пароли и структуру приложения.

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **Spring Boot vs Spring** | Boot — оболочка над Spring. Convention over Configuration. Embedded Tomcat |
| **`@SpringBootApplication`** | Композит из `@Configuration` + `@ComponentScan` + `@EnableAutoConfiguration` |
| **Автоконфигурация** | Читает `AutoConfiguration.imports` → применяет через `@Conditional` → `@ConditionalOnMissingBean` позволяет переопределить |
| **Стартер** | Пустой JAR — только зависимости. Работает на этапе сборки |
| **BOM** | Spring тестирует совместимые версии и прописывает их. Мы версии не указываем |
| **Стартер vs Автоконфигурация** | Стартер приносит байты, автоконфигурация оживляет их в объекты |
| **Приоритет конфигурации** | CLI args > env vars > application-{profile}.yml > application.yml |
| **`@Value` vs `@ConfigurationProperties`** | Value — одиночное значение. ConfigurationProperties — группа настроек с валидацией |
| **Actuator** | Мониторинг из коробки. В проде закрыть Spring Security |