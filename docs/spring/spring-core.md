# Spring Core

## IoC и DI

### 1. IoC (Inversion of Control) — Инверсия контроля

Это архитектурный принцип, а не конкретный код. Его суть отлично описывает «Голливудский принцип»: **«Не звоните нам, мы сами вам позвоним»**.

- **Как было раньше (Прямой контроль):** Твой код сам управляет созданием объектов. Если классу `HabitService` нужен репозиторий, ты пишешь `HabitRepository repo = new HabitRepositoryImpl()`. Сервис жёстко привязан к конкретной реализации.
- **Как стало (Инверсия контроля):** Ты забираешь у класса право создавать объекты через `new` и отдаёшь эту власть фреймворку (Spring IoC Container / ApplicationContext). Spring сам решает, когда создать бины, как их настроить и когда уничтожить. Твой код просто ждёт, когда ему дадут всё необходимое.

### 2. DI (Dependency Injection) — Внедрение зависимостей

Если IoC — это общая стратегия (инверсия), то DI — это **конкретная тактика (паттерн)** её реализации.

`HabitService` просто говорит: _"Мне нужен любой класс, реализующий `HabitRepository`"_. При старте Spring видит это требование, находит подходящую реализацию в контексте и подкидывает её в сервис.

### 3. Главный холивар: Field Injection vs Constructor Injection

#### ❌ Field Injection — антипаттерн

```java
@Service
public class HabitService {
    @Autowired
    private HabitRepository habitRepository; // так делать не надо
}
```

**Почему плохо:**

1. **Нельзя `final`** — поле не защищено от изменений после создания.
2. **Боль при тестировании** — поле приватное, конструктора нет. Чтобы подсунуть мок в юнит-тесте без Spring-контекста, нужна рефлексия.
3. **Скрывает God Object** — легко добавить 15-20 зависимостей, и никто не заметит. Нарушение SRP становится невидимым.
4. **Привязка к фреймворку** — класс физически не работает без DI-контейнера, нарушая принципы чистой архитектуры.

#### ✅ Constructor Injection — золотой стандарт

```java
@Service
public class HabitService {
    private final HabitRepository habitRepository; // поле final!

    // С Spring 4.3 @Autowired не нужен, если конструктор один
    public HabitService(HabitRepository habitRepository) {
        this.habitRepository = habitRepository;
    }
}
```

_Секрет современного кода: конструктор руками почти никто не пишет — используют `@RequiredArgsConstructor` от Lombok._

**Почему это правильно:**

1. **Иммутабельность** — поля `final`, инициализируются один раз, защищены от изменений. Thread-safe.
2. **Чистая Java** — в юнит-тесте просто `new HabitService(mockRepository)`, никакого Spring.
3. **Fail-Fast** — циклическая зависимость (A → B → A) при конструкторном инжекте падает с `BeanCurrentlyInCreationException` на старте. При Field Injection — `StackOverflowError` в рантайме.
4. **Визуальный детектор запашка** — конструктор с 10 параметрами сразу бросается в глаза. Это сигнал разбить класс.

## ApplicationContext vs BeanFactory

### 1. Что это такое?

Оба — IoC-контейнеры: читают конфигурацию, создают бины, связывают их.

- **BeanFactory** — базовый контейнер, только DI. Корень всего Spring.
- **ApplicationContext** — наследник `BeanFactory` со всеми его возможностями + корпоративные фичи.

### 2. Главные отличия

**А. Стратегия загрузки бинов:**

- **BeanFactory (Lazy)** — создаёт бин только при явном `getBean()`. Экономит память, но ошибки конфигурации всплывут в рантайме.
- **ApplicationContext (Eager)** — создаёт все синглтон-бины при старте контекста. Если забыл прописать зависимость или ошибся в `@Value` — приложение упадёт сразу. 90% ошибок конфигурации ловятся мгновенно.

**Б. Корпоративные фичи ApplicationContext:**

1. **AOP** — поддержка аспектов (транзакции, логирование) из коробки.
2. **MessageSource (i18n)** — интернационализация.
3. **Event Publication** — механизм событий (Observer паттерн).
4. **Web-скоупы** — поддержка `request`, `session`, интеграция с DispatcherServlet.
5. **Авторегистрация BPP** — `BeanPostProcessor`-ы регистрируются автоматически (в `BeanFactory` — вручную).

| **Характеристика** | **BeanFactory** | **ApplicationContext** |
|---|---|---|
| **Инициализация** | Lazy (по запросу) | Eager (при старте) |
| **Регистрация BPP** | Вручную | Автоматически |
| **AOP** | Нет | Да |
| **События** | Нет | Да |
| **Где используется** | Легаси / IoT / ограниченные ресурсы | Все современные приложения |

`ApplicationContext` — стандарт де-факто. `SpringApplication.run()` возвращает именно его.

## Жизненный цикл Бина

### Фаза 0. Чертежи и BFPP (BeanFactoryPostProcessor)

Прежде чем создать хоть один объект, Spring сканирует код и создаёт **BeanDefinition** — "чертёж" будущего бина (класс, скоуп, зависимости).

На сцену выходит **`BeanFactoryPostProcessor` (BFPP)** — он работает с _чертежами_, а не с объектами.

_Пример из жизни:_ `@Value("${db.password}")` — в чертеже лежит строка-плейсхолдер. Встроенный BFPP (`PropertySourcesPlaceholderConfigurer`) читает `application.yml` и подменяет `${db.password}` на реальное значение ещё до создания бина.

### Фаза 1. Рождение (Instantiation & DI)

1. **Instantiation** — Spring вызывает конструктор через рефлексию. Создаётся "голый" Java-объект без зависимостей.
2. **Populate Properties** — внедряются зависимости (DI). Если Constructor Injection — шаги 1 и 2 сливаются в один.
3. **Aware-интерфейсы** — если бину нужно знать своё имя или получить ссылку на `ApplicationContext`, Spring вызывает методы Aware-интерфейсов (`setBeanName()`, `setApplicationContext()` и т.д.).

### Фаза 2. Магия BPP и Инициализация ⭐

Самое интересное. Объект с зависимостями передаётся на "тюнинг" через **`BeanPostProcessor` (BPP)** — интерфейс с двумя методами.

**Шаг 2.1: `postProcessBeforeInitialization`**

Здесь `InitDestroyAnnotationBeanPostProcessor` находит в классе метод с `@PostConstruct` и выполняет его.

**Шаг 2.2: Инициализация**

Вызывается `afterPropertiesSet()` (если реализован `InitializingBean`) или метод из `@Bean(initMethod = "...")`. Это легаси-способы, сейчас используют `@PostConstruct`.

**Шаг 2.3: `postProcessAfterInitialization` — АБСОЛЮТНО КРИТИЧНЫЙ ЭТАП**

Здесь рождаются прокси-объекты. Если на бине (или его методах) висят `@Transactional`, `@Async` или AOP-аспекты — Spring оборачивает оригинальный объект в Proxy и возвращает в контейнер именно Proxy.

Все остальные бины, запрашивающие `HabitService`, получат не оригинал, а обёртку, умеющую открывать транзакции.

### Фаза 3. Жизнь и Смерть

- **Использование** — бин готов, лежит в контейнере, обрабатывает запросы.
- **Уничтожение** — при остановке контекста Spring вызывает `@PreDestroy` (через BPP), затем `destroy()` (если реализован `DisposableBean`). Здесь закрывают коннекты к БД и открытые файлы.

### Шпаргалка — цепочка жизненного цикла

```
BFPP (подмена плейсхолдеров в чертежах)
    ↓
Конструктор (голый объект)
    ↓
Dependency Injection
    ↓
Aware-интерфейсы
    ↓
BPP.postProcessBeforeInitialization (@PostConstruct)
    ↓
Инициализация (initMethod, afterPropertiesSet)
    ↓
BPP.postProcessAfterInitialization (⭐ создание Proxy для @Transactional / AOP)
    ↓
Бин готов к работе
    ↓
@PreDestroy → destroy() при остановке
```

## Scopes (Области видимости)

### 1. Базовые скоупы

**`singleton` (по умолчанию)** — один экземпляр на весь ApplicationContext.

!!! warning "Главное правило синглтона"
    Синглтон шарится между всеми потоками. **Нельзя хранить в нём состояние** (поля, которые меняются в процессе работы). Если сохранить `private User currentUser`, Вася увидит данные Пети при параллельном запросе. Синглтоны обязаны быть Stateless.

**`prototype`** — новый экземпляр при каждом обращении к контейнеру.

!!! note "Особенность прототипа"
    Spring создаёт прототип, отдаёт и забывает. Методы уничтожения (`@PreDestroy`) для прототипов **не вызываются**. Память чистит GC.

### 2. Веб-скоупы

Доступны только в веб-приложениях (когда поднят DispatcherServlet).

- **`request`** — новый экземпляр на каждый HTTP-запрос. Запрос обработан — бин уничтожен. Идеально для `traceId` и данных текущего запроса.
- **`session`** — один экземпляр на всю HTTP-сессию пользователя.

### 3. Главная ловушка: прототип внутри синглтона

```java
@Component
@Scope("prototype")
public class PrototypeBean { }

@Service // singleton по умолчанию
public class SingletonService {
    private final PrototypeBean prototypeBean;

    public SingletonService(PrototypeBean prototypeBean) {
        this.prototypeBean = prototypeBean; // инжект происходит ОДИН РАЗ
    }

    public void doWork() {
        // сколько раз ни вызывай — prototypeBean один и тот же!
    }
}
```

!!! warning "Вопрос на собесе"
    _"Сколько экземпляров `PrototypeBean` создастся при 10 вызовах `doWork()`?"_

    **Ответ джуна:** 10 — ведь стоит `@Scope("prototype")`.

    **Правильный ответ:** **ОДИН.** `SingletonService` создаётся один раз при старте. DI тоже проходит один раз. Spring честно создаёт один экземпляр прототипа и навсегда вшивает его в конструктор. Больше этот конструктор не вызывается.

### 4. Как правильно получать новый прототип каждый раз

**Решение А: `ObjectProvider` — современно и тестируемо (рекомендуется)**

```java
@Service
public class SingletonService {
    private final ObjectProvider<PrototypeBean> provider;

    public SingletonService(ObjectProvider<PrototypeBean> provider) {
        this.provider = provider;
    }

    public void doWork() {
        PrototypeBean fresh = provider.getObject(); // новый экземпляр каждый раз
    }
}
```

**Решение Б: `@Lookup` — магия CGLIB**

```java
@Service
public class SingletonService {

    @Lookup // Spring переопределит этот метод через CGLIB Proxy
    public PrototypeBean getPrototypeBean() {
        return null; // эта строка никогда не выполнится
    }

    public void doWork() {
        PrototypeBean fresh = getPrototypeBean(); // магически вернёт новый объект
    }
}
```

!!! note "Почему `@Lookup` хуже `ObjectProvider`"
    Метод нельзя `private` или `final`. В юнит-тесте без Spring-контекста метод вернёт `null`. С `ObjectProvider` мок подставляется тривиально.

**Решение В: Scoped Proxy (для веб-скоупов)**

```java
@Component
@Scope(
    value = WebApplicationContext.SCOPE_REQUEST,
    proxyMode = ScopedProxyMode.TARGET_CLASS
)
public class RequestScopedBean { }
```

Spring заинжектит в синглтон не сам объект, а умную прокси-заглушку. При каждом вызове она сама ищет актуальный объект в текущем HTTP-запросе.

## AOP и Прокси

### 1. Зачем нужен AOP?

В 50 сервисах нужно логировать время выполнения, проверять права и открывать транзакции. Если писать это руками — бизнес-логика тонет в техническом коде. Это **Cross-cutting concerns (Сквозная функциональность)**.

AOP позволяет вынести технический код в отдельный класс (Аспект). Вешаешь `@Transactional` — Spring сам, незаметно, оборачивает класс нужным кодом.

### 2. Как Spring оборачивает классы: паттерн Proxy

Spring не модифицирует твой байт-код (как AspectJ). Он использует паттерн Proxy.

Когда другой бин запрашивает `HabitService`, Spring отдаёт ему **не оригинал, а Proxy**. При вызове метода `save()`:

```
Клиент → Proxy.save()
            → открыть транзакцию (аспект "До")
            → оригинальный HabitService.save()
            → commit / rollback (аспект "После")
```

### 3. JDK Dynamic Proxy vs CGLIB

**JDK Dynamic Proxy** (встроен в Java, через Reflection):

- **Условие:** класс **обязан** реализовывать интерфейс.
- Spring генерирует новый класс, реализующий тот же интерфейс. Через Proxy доступны только методы интерфейса.

**CGLIB** (генерация байт-кода):

- **Условие:** класс **не** реализует интерфейс, или принудительно задано `proxyTargetClass = true`.
- CGLIB генерирует подкласс (наследника) твоего класса и переопределяет все публичные методы.

!!! warning "Жёсткие ограничения CGLIB"
    Работает через наследование, поэтому **не может обернуть `final` классы и `final`/`private` методы**. Если повесить `@Transactional` на `private` метод — Spring молча проигнорирует это. Транзакция не откроется.

!!! info "Дефолт в Spring Boot 2.0+"
    Начиная с Spring Boot 2.0, CGLIB используется по умолчанию для **всех** бинов, даже если у них есть интерфейсы. Это избавило от странных ошибок при кастинге. Но разницу между JDK Proxy и CGLIB всё равно спрашивают на собесах.

### 4. Ловушка самовызова (Self-Invocation) ⚠️

Классический баг, на котором теряют часы дебаггинга даже опытные разработчики.

```java
@Service
public class OrderService {

    public void createOrder() {
        // ...бизнес-логика...
        saveToDatabase(); // внутренний вызов!
    }

    @Transactional
    public void saveToDatabase() {
        // Откроется ли транзакция?
    }
}
```

!!! warning "Вопрос на собесе"
    _"Откроется ли транзакция при вызове `saveToDatabase()` изнутри `createOrder()`?"_

    **Ответ: НЕТ.**

    Когда внешний код вызывает `createOrder()`, вызов идёт через Proxy. Proxy пробрасывает его в реальный объект. Дальше `createOrder()` внутри реального объекта вызывает `this.saveToDatabase()` — **напрямую, минуя Proxy**. Аспект транзакции не задействован, транзакция не открывается.

**Как чинить:**

```java
// Вариант 1 — разнести по разным сервисам (лучший)
@Service
public class OrderPersistenceService {
    @Transactional
    public void saveToDatabase(Order order) { ... }
}

// Вариант 2 — Self-injection (получить свой же Proxy)
@Service
public class OrderService {
    @Lazy
    @Autowired
    private OrderService self; // Spring заинжектит Proxy, а не this

    public void createOrder() {
        self.saveToDatabase(); // теперь вызов идёт через Proxy
    }

    @Transactional
    public void saveToDatabase() { ... }
}
```

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **IoC vs DI** | IoC — принцип (кто управляет созданием). DI — конкретный паттерн реализации IoC |
| **Field vs Constructor Injection** | Constructor всегда. Field — антипаттерн: нет `final`, сложно тестировать, скрывает SRP-нарушения |
| **BeanFactory vs ApplicationContext** | BF — Lazy, без AOP и событий. AC — Eager, все фичи. В 99% случаев используем AC |
| **Жизненный цикл** | BFPP → конструктор → DI → Aware → @PostConstruct (BPP Before) → initMethod → Proxy (BPP After) → работа → @PreDestroy |
| **Singleton vs Prototype** | Singleton — один на контекст, Stateless. Prototype — новый при каждом запросе, @PreDestroy не вызывается |
| **Ловушка прототипа** | Прототип в синглтоне фактически становится синглтоном. Решение: ObjectProvider |
| **JDK Proxy vs CGLIB** | JDK — нужен интерфейс, через Reflection. CGLIB — наследник класса, не работает с `final`/`private` |
| **Self-Invocation** | Вызов `this.method()` минует Proxy → `@Transactional` не работает. Решение: разные сервисы или self-injection |