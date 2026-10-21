---
tags:
  - Middle
  - Spring
---

# Actuator и Micrometer

Как Spring Boot отдаёт сведения о работающем приложении: эндпоинты Actuator и как их защитить, свои метрики в Micrometer и сбор метрик в Prometheus и Grafana. На собесе спрашивают, какие эндпоинты открывать в проде и чем Counter отличается от Timer и Gauge.

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

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Actuator** | HTTP-эндпоинты мониторинга. В проде закрыть Security |
| **Micrometer** | Counter (сколько раз) / Timer (сколько времени) / Gauge (текущее значение) |
| **Prometheus** | Scrape `/actuator/prometheus`, тег `application` на всех метриках |

<!-- --8<-- [end:cheatsheet] -->
