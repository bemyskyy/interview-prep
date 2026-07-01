# Kafka: Гарантии доставки и надёжность

Вопросы уровня Senior — где проверяют понимание потери данных.

## Параметр `acks` у Продюсера

Когда продюсер отправляет сообщение, `acks` определяет, сколько подтверждений он ждёт от брокеров, прежде чем считать отправку успешной. Это компромисс между скоростью и надёжностью.

```
acks=0  — "Отправил и забыл"
  Продюсер не ждёт вообще никакого ответа.
  Записал в сокет → считает успехом.
  ⚡ Максимальная скорость. 💀 Максимальная потеря данных.
  Брокер упал в момент отправки — сообщение исчезло, продюсер не узнает.
  Применение: метрики, логи где потеря отдельных записей некритична.

acks=1  — "Подтверждение от лидера" (баланс, старый дефолт)
  Продюсер ждёт подтверждения только от Leader-партиции.
  Лидер записал к себе на диск → ответил OK.
  ⚠️ Риск: лидер подтвердил, но упал ДО репликации на фолловеров.
     Новый лидер выбирается из фолловеров, где этого сообщения нет. Потеря.

acks=all (acks=-1)  — "Подтверждение от всех ISR" (максимальная надёжность)
  Продюсер ждёт подтверждения от лидера И всех реплик в ISR.
  Только когда все синхронизированные реплики записали → OK.
  🛡️ Сообщение переживёт падение лидера — оно уже на репликах.
  🐢 Медленнее, но данные не теряются.
  Применение: платежи, заказы, всё бизнес-критичное.
```

!!! warning "acks=all сам по себе не гарантирует надёжность"
    `acks=all` работает в связке с `min.insync.replicas`. Если поставить `acks=all`, но `min.insync.replicas=1`, а все реплики кроме лидера отвалились — лидер подтвердит запись в одиночку, и при его падении данные потеряются. Правильная связка для критичных данных: `acks=all` + `min.insync.replicas=2` (при replication factor 3). Тогда если синхронных реплик меньше 2 — продюсер получит ошибку, а не тихую потерю.

```java
// Настройка продюсера в Spring
@Bean
public ProducerFactory<String, Object> producerFactory() {
    Map<String, Object> config = new HashMap<>();
    config.put(ProducerConfig.ACKS_CONFIG, "all");           // ждём все ISR
    config.put(ProducerConfig.RETRIES_CONFIG, 3);            // повтор при сбое
    config.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, true); // защита от дублей
    return new DefaultKafkaProducerFactory<>(config);
}
```

## Replication Factor и ISR

### Как данные переживают уничтожение диска

Партиция физически дублируется на несколько брокеров. **Replication Factor** = сколько всего копий партиции в кластере.

```
Топик orders, партиция 0, replication factor = 3:

Брокер 1: [Партиция 0 — LEADER]   ← сюда пишет продюсер, отсюда читают консьюмеры
Брокер 2: [Партиция 0 — FOLLOWER] ← тянет данные с лидера
Брокер 3: [Партиция 0 — FOLLOWER] ← тянет данные с лидера

Если Брокер 1 (лидер) физически сгорел:
  Один из фолловеров становится новым лидером за миллисекунды.
  Данные не потеряны — они были на репликах.
```

### ISR (In-Sync Replicas)

**ISR** — множество реплик, которые «идут в ногу» с лидером (не отстают больше чем на `replica.lag.time.max.ms`).

```
Только реплики из ISR могут стать лидером при падении.

Брокер 2 (Follower): отстаёт на 50мс  → в ISR ✅
Брокер 3 (Follower): завис, отстаёт на 30 сек → выпал из ISR ❌

Если лидер упадёт — новым станет только Брокер 2 (он в ISR).
Брокер 3 не может стать лидером — у него неполные данные.
```

!!! tip "Формула надёжности"
    Replication Factor 3 + `min.insync.replicas=2` + `acks=all` — это золотой стандарт для критичных данных. Система переживает падение **одного** брокера без потери данных и без остановки записи. При падении двух — запись остановится (лучше ошибка, чем потеря).

## Семантики доставки

### At-most-once (максимум один раз)

```
Коммитим оффсет ДО обработки сообщения.

poll() → commit offset → обработка

Если упали ПОСЛЕ commit, но ДО обработки — сообщение потеряно.
Дублей не будет никогда, но возможна потеря.
Применение: метрики, где потеря приемлема, а дубли — нет.
```

### At-least-once (хотя бы один раз) — стандарт

```
Коммитим оффсет ПОСЛЕ обработки сообщения.

poll() → обработка → commit offset

Если упали ПОСЛЕ обработки, но ДО commit — при рестарте
сообщение придёт снова. Дубли возможны, потери нет.
Применение: стандарт для большинства систем. Требует идемпотентности.
```

### Exactly-once (строго один раз) — «мифический»

```
Каждое сообщение обработано ровно один раз. Ни потерь, ни дублей.

В Kafka реализуется через:
  - Идемпотентный продюсер (enable.idempotence=true)
  - Транзакции Kafka (transactional.id)
  - Read-process-write в одной транзакции
```

!!! warning "Почему Exactly-once «мифический»"
    Exactly-once работает **только внутри Kafka** (топик → обработка → топик) через транзакции. Но как только в цепочке появляется внешняя система — БД, вызов стороннего API, отправка email — гарантия ломается. Kafka не может откатить `INSERT` в PostgreSQL или «отменить» отправленное письмо.

    **Практическое решение:** At-least-once + идемпотентность на стороне консьюмера. Это даёт эффект exactly-once для внешних систем, но контролируешь его ты, а не Kafka.

| Семантика | Коммит | Потери | Дубли | Когда |
|---|---|---|---|---|
| **At-most-once** | До обработки | Возможны | Нет | Метрики, некритичные логи |
| **At-least-once** | После обработки | Нет | Возможны | Стандарт (+ идемпотентность) |
| **Exactly-once** | Транзакция | Нет | Нет | Только внутри Kafka |

## Управление оффсетами в Spring Kafka

### Почему Auto-commit — зло

```yaml
# ❌ Опасная настройка для бизнес-критичных приложений
spring:
  kafka:
    consumer:
      enable-auto-commit: true   # коммит каждые 5 секунд в фоне
```

```
Проблема Auto-commit:
1. poll() вернул сообщение об оплате
2. Фоновый поток через 5 сек автоматически закоммитил оффсет
3. Твой код ещё НЕ сохранил оплату в БД — упал с исключением
4. Оффсет уже закоммичен → при рестарте это сообщение не придёт
5. Оплата потеряна навсегда. Бизнес в ярости.
```

### Ручной коммит после сохранения в БД

```yaml
# ✅ Правильная настройка
spring:
  kafka:
    consumer:
      enable-auto-commit: false
    listener:
      ack-mode: MANUAL          # коммитим вручную через Acknowledgment
```

```java
@KafkaListener(topics = "payments", groupId = "payment-processor")
public void consume(PaymentEvent event, Acknowledgment ack) {
    // 1. Сначала обрабатываем и сохраняем в БД
    paymentService.processPayment(event);

    // 2. Только ПОСЛЕ успешного сохранения — коммитим оффсет
    ack.acknowledge();

    // Если processPayment() упал — ack не вызовется →
    // при рестарте сообщение придёт снова → At-least-once
}
```

!!! tip "MANUAL vs MANUAL_IMMEDIATE"
    `MANUAL` — коммит ставится в очередь и выполняется при следующем poll. `MANUAL_IMMEDIATE` — коммит выполняется немедленно в потоке слушателя. Для большинства случаев `MANUAL` эффективнее (батчит коммиты).

## Идемпотентность консьюмера

At-least-once означает, что дубли **будут** рано или поздно. Консьюмер обязан быть идемпотентным.

### Способ 1: Проверка по уникальному ID

```java
@KafkaListener(topics = "payments")
@Transactional
public void consume(PaymentEvent event, Acknowledgment ack) {
    // Проверяем — обрабатывали ли уже это событие?
    if (processedEventRepository.existsById(event.getEventId())) {
        log.info("Дубликат {}, пропускаем", event.getEventId());
        ack.acknowledge(); // подтверждаем и игнорируем
        return;
    }

    paymentService.processPayment(event);
    processedEventRepository.save(new ProcessedEvent(event.getEventId()));
    ack.acknowledge();
}
```

### Способ 2: UNIQUE constraint в БД (надёжнее)

```java
@KafkaListener(topics = "payments")
@Transactional
public void consume(PaymentEvent event, Acknowledgment ack) {
    try {
        // В таблице payments есть UNIQUE constraint на transaction_id
        paymentRepository.save(new Payment(event.getTransactionId(), event.getAmount()));
        ack.acknowledge();
    } catch (DataIntegrityViolationException e) {
        // Дубликат пойман базой — значит уже обрабатывали
        log.info("Транзакция {} уже обработана", event.getTransactionId());
        ack.acknowledge(); // коммитим, дубликат игнорируем
    }
}
```

!!! tip "Почему UNIQUE constraint надёжнее"
    Способ 1 (проверка + сохранение) имеет race condition: два дубля могут одновременно пройти проверку `existsById` до сохранения. UNIQUE constraint в БД — это атомарная гарантия на уровне СУБД, обойти её невозможно.

## Dead Letter Queue (DLQ)

### Проблема Poison Pill

```
Консьюмер читает партицию. Приходит сообщение со сломанным JSON.
@KafkaListener падает с NullPointerException. Оффсет не коммитится.
При следующем poll() — то же сообщение → снова NPE → бесконечный цикл.
Вся партиция заблокирована одним битым сообщением (Head-of-line blocking).
```

### Решение: retry + DLQ

```java
@Configuration
public class KafkaErrorHandlerConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> template) {
        // Recoverer: после исчерпания retry перекладывает в топик .DLT
        var recoverer = new DeadLetterPublishingRecoverer(template,
            (record, ex) -> new TopicPartition(record.topic() + ".DLT", record.partition()));

        // Backoff: 3 попытки с интервалом 1с/2с/4с
        var backOff = new ExponentialBackOffWithMaxRetries(3);
        backOff.setInitialInterval(1000L);
        backOff.setMultiplier(2.0);

        var handler = new DefaultErrorHandler(recoverer, backOff);

        // Некоторые исключения бессмысленно ретраить — сразу в DLQ
        handler.addNotRetryableExceptions(
            JsonParseException.class,           // битый JSON не починится retry
            IllegalArgumentException.class
        );

        return handler;
    }
}
```

```
Алгоритм работы:
1. @KafkaListener упал с исключением
2. Retry: 3 попытки с backoff (вдруг БД просто моргнула)
3. Все попытки исчерпаны → DeadLetterPublishingRecoverer
   перекладывает сообщение в топик payments.DLT
4. Оффсет в основном топике коммитится → партиция работает дальше
5. Битые сообщения в .DLT разбирают разработчики или по ним алерты в Grafana
```

!!! tip "Retryable vs Non-Retryable"
    Разделяй ошибки. Временные (БД недоступна, таймаут сети) — ретраить есть смысл. Постоянные (битый JSON, невалидные данные) — ретраить бессмысленно, они не починятся. `addNotRetryableExceptions` отправляет постоянные ошибки в DLQ сразу, не тратя попытки.

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **acks=0** | Не ждёт ответа. Максимум скорости, максимум потерь |
| **acks=1** | Ждёт лидера. Риск потери если лидер упал до репликации |
| **acks=all** | Ждёт все ISR. Надёжно. Нужен `min.insync.replicas=2` |
| **Replication Factor** | Копии партиции на разных брокерах. Стандарт — 3 |
| **ISR** | Реплики «в ногу» с лидером. Только они могут стать лидером |
| **Золотой стандарт** | RF=3 + min.insync.replicas=2 + acks=all |
| **At-least-once** | Стандарт. Коммит после обработки. Дубли возможны → идемпотентность |
| **Exactly-once** | Только внутри Kafka. С внешней БД — миф, нужна идемпотентность |
| **Auto-commit — зло** | Коммитит до сохранения в БД → потеря при падении |
| **Manual ack** | `ack.acknowledge()` только после сохранения в БД |
| **Идемпотентность** | UNIQUE constraint надёжнее проверки existsById (нет race condition) |
| **Poison Pill / DLQ** | Retry с backoff → `.DLT` топик. Non-retryable сразу в DLQ |