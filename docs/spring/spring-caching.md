---
tags:
  - Middle
  - Spring
  - Кэширование
---

# Кэширование

Кэширование в Spring: как работает `@Cacheable`, как настроить Redis-кэш с TTL и чем `condition` отличается от `unless`. На собесе чаще всего спрашивают, почему `@Cacheable` не срабатывает при самовызове и что он делает с `null`.

## Кэширование { #caching }

Стратегии кэширования (Cache-Aside, Write-Through, Write-Behind), вытеснение и Cache Stampede разобраны в [Строительные блоки → Caching](../system-design/building-blocks.md#caching). Здесь — Spring-абстракция кэша.

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

### Как вручную реализовать Cache-Aside на Redis? { #cache-aside }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Сначала ищем значение в Redis; при промахе идём в основную БД, кладём результат в кэш и отдаём. При обновлении данных запись в кэше инвалидируем. В Spring это же делает `@Cacheable`, но ручная реализация показывает, что происходит внутри.

Сама стратегия Cache-Aside и её альтернативы (Write-Through, Write-Behind) — в [Строительные блоки → Caching](../system-design/building-blocks.md#caching), декларативный вариант через `@Cacheable` — в [Кэширование → `@Cacheable`](#cacheable). Ниже — ручная реализация поверх `HabitCacheService` из [темы про Redis](../database/nosql.md#key-value).

```java
@Service
public class HabitService {

    private final HabitRepository habitRepository;     // PostgreSQL
    private final HabitCacheService cacheService;      // Redis

    public HabitDto findById(String id) {
        // 1. Проверяем кэш
        HabitDto cached = cacheService.getCachedHabit(id);
        if (cached != null) return cached;

        // 2. Промах — идём в БД
        HabitDto habit = habitRepository.findById(id)
            .map(HabitMapper::toDto)
            .orElseThrow(() -> new HabitNotFoundException(id));

        // 3. Кладём в кэш для следующих запросов
        cacheService.cacheHabit(id, habit);
        return habit;
    }

    public HabitDto update(String id, HabitUpdateDto dto) {
        HabitEntity entity = habitRepository.findById(id).orElseThrow();
        entity.setName(dto.name());
        habitRepository.save(entity);

        // Инвалидируем кэш после обновления
        cacheService.evictHabit(id);
        return HabitMapper.toDto(entity);
    }
}
```

!!! warning "Ловушка: забытая инвалидация"
    Если после `update()` не удалить ключ из кэша, читатели будут получать старую версию до истечения TTL. Каждое место, которое меняет данные, должно инвалидировать кэш.

??? question "Проверь себя"
    1. Из каких трёх шагов состоит чтение в Cache-Aside?
    2. Что нужно сделать с кэшем после обновления данных?
    3. Какая аннотация Spring делает то же самое декларативно?

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

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **`@Cacheable`** | AOP-аспект. Не работает при самовызове. Кэширует `null` по умолчанию |
| **`@CacheEvict` / `@CachePut`** | Удалить из кэша (`allEntries = true` — весь кэш) / всегда выполнить и обновить |
| **Cache-Aside** | Читай из кэша → промах → БД → положи в кэш → инвалидируй при обновлении |
| **`unless` vs `condition`** | `condition` — до метода. `unless` — после (есть доступ к `#result`) |
| **Redis-кэш** | `RedisCacheManager`: TTL по умолчанию и на кэш, JSON-сериализация, `disableCachingNullValues()` |

<!-- --8<-- [end:cheatsheet] -->
