---
tags:
  - Middle
  - Kafka
  - Spring
---

# Kafka в Spring

Как Spring Kafka превращает `consumer.poll()` в метод с `@KafkaListener`: потоки листенера, ручной коммит оффсетов и обработка ошибок. На собесе спрашивают, что делает `concurrency`, как закоммитить оффсет только после обработки и что будет, если листенер обрабатывает сообщение дольше `max.poll.interval.ms`.

## Spring Kafka { #spring-kafka }

Устройство брокера, группы потребителей и гарантии доставки разобраны на соседних страницах: [брокер](kafka.md), [порядок, группы и ребаланс](kafka-consumer-producer.md), [гарантии доставки](kafka-reliability.md). Здесь — только настройка `@KafkaListener` в Spring.

### Как работает `@KafkaListener`? { #kafka-listener }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `@KafkaListener` — обёртка над бесконечным циклом `consumer.poll()`. Spring находит аннотацию на бине и просит `ConcurrentKafkaListenerContainerFactory` создать контейнер с рабочими потоками; параметр `concurrency` задаёт число потоков-консьюмеров. Метод получает уже десериализованное сообщение и, при ручном коммите, объект `Acknowledgment`.

`@KafkaListener` — это `while (true) { consumer.poll(...) }`, который пишет за тебя Spring. Он сканирует бины, находит аннотацию и просит `ConcurrentKafkaListenerContainerFactory` создать рабочий поток (или несколько, если `concurrency > 1`).

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

!!! warning "Ловушка: `concurrency` больше числа партиций"
    Одну партицию в группе читает только один консьюмер. Если `concurrency = 3`, а у топика 2 партиции, третий поток будет простаивать (см. [Consumer Groups](kafka-consumer-producer.md)).

??? question "Проверь себя"
    1. Что скрывается за `@KafkaListener`?
    2. Что задаёт параметр `concurrency`?
    3. Когда в листенере вызывают `ack.acknowledge()`?

### Как настроить коммит оффсетов и обработку ошибок листенера? { #listener-config }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Для бизнес-данных выключают авто-коммит (`enable-auto-commit: false`) и ставят `ack-mode: MANUAL`, чтобы оффсет коммитился вызовом `ack.acknowledge()` только после успешной обработки. Ошибки листенера обрабатывает бин `DefaultErrorHandler`: повторы с backoff, а затем перекладывание в DLQ. Долгую работу из потока листенера выносят, чтобы не превысить `max.poll.interval.ms`.

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

Где разобрано подробно:

- **Почему авто-коммит теряет сообщения**, чем `MANUAL` отличается от `MANUAL_IMMEDIATE` и что даёт at-least-once — в [Гарантии доставки → Управление оффсетами](kafka-reliability.md#offset-commit).
- **Идемпотентность консьюмера** — дубли при at-least-once неизбежны — в [Гарантии доставки → Идемпотентность](kafka-reliability.md#idempotent-consumer).
- **Retry и DLQ** через `DefaultErrorHandler` и `DeadLetterPublishingRecoverer` — в [Гарантии доставки → DLQ](kafka-reliability.md#dlq).
- **`max.poll.interval.ms` и ребаланс** при зависшем листенере — в [Порядок, группы и ребаланс → Два пульса](kafka-consumer-producer.md#heartbeats).

!!! warning "Ловушка: долгая синхронная работа в листенере"
    Если листенер завис на внешнем вызове дольше `max.poll.interval.ms` (по умолчанию 5 минут), брокер сочтёт консьюмер мёртвым и запустит ребаланс. Долгие задачи выносят в отдельный пул потоков и ставят таймауты на внешние вызовы.

??? question "Проверь себя"
    1. Какие две настройки включают ручной коммит в Spring Kafka?
    2. Какой бин отвечает за повторы и DLQ?
    3. Что будет, если листенер обрабатывает сообщение дольше `max.poll.interval.ms`?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **`@KafkaListener`** | Обёртка над `consumer.poll()`. `concurrency` — количество потоков |
| **Ручной коммит** | `enable-auto-commit: false` + `ack-mode: MANUAL` + `ack.acknowledge()` после обработки |
| **Ошибки листенера** | `DefaultErrorHandler`: retry с backoff → DLQ. Подробно — в [Kafka](../kafka/kafka-reliability.md#dlq) |
| **`max.poll.interval.ms`** | 5 мин по умолчанию. Долгая обработка → ребаланс → не блокируй поток листенера |

<!-- --8<-- [end:cheatsheet] -->
