# Паттерны проектирования

Паттерны — это проверенные решения типовых архитектурных проблем. На собесах просят не только объяснить, но и написать код. Разбиты на три категории по GoF (Gang of Four).

## Порождающие (Creational)

Отвечают на вопрос: **как создавать объекты?**

### Singleton — Единственный экземпляр

**Проблема:** Нужен ровно один экземпляр класса на всё приложение (конфиг, пул соединений, логгер).

#### Вариант 1: Double-Checked Locking (классика собесов)

```java
public class Singleton {
    // volatile обязателен! Без него другой поток может увидеть
    // частично сконструированный объект из-за reordering
    private static volatile Singleton instance;

    private Singleton() {}

    public static Singleton getInstance() {
        if (instance == null) {                    // 1-я проверка — без лока (быстро)
            synchronized (Singleton.class) {
                if (instance == null) {            // 2-я проверка — с локом (безопасно)
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

#### Вариант 2: Initialization-on-demand Holder (лучший способ без volatile)

```java
public class Singleton {
    private Singleton() {}

    // Внутренний класс загружается только при первом обращении к getInstance()
    // ClassLoader гарантирует потокобезопасность при инициализации класса
    private static class Holder {
        private static final Singleton INSTANCE = new Singleton();
    }

    public static Singleton getInstance() {
        return Holder.INSTANCE;
    }
}
```

#### Вариант 3: Enum Singleton (совет Джошуа Блоха — самый надёжный)

```java
public enum Singleton {
    INSTANCE;

    public void doWork() { ... }
}

// Использование:
Singleton.INSTANCE.doWork();
```

!!! tip "Почему Enum Singleton лучший?"
    1. JVM гарантирует создание ровно одного экземпляра.
    2. Нельзя сломать через Reflection (другие варианты — можно).
    3. Безопасен при сериализации (обычный Singleton при десериализации создаёт новый объект).

!!! warning "Singleton в Spring"
    В Spring каждый `@Bean` по умолчанию — синглтон в контексте приложения. Вручную писать Singleton в Spring-приложении практически никогда не нужно. Паттерн актуален для кода вне контейнера.

---

### Builder — Пошаговая сборка объекта

**Проблема:** Объект с большим количеством параметров. Конструктор из 10 аргументов нечитаем и хрупок.

```java
// ❌ Telescoping Constructor — ужас при чтении
User user = new User("Alice", "alice@mail.com", 25, "Moscow", true, false, null, 100);
// Что такое true, false, null и 100? Непонятно без IDE.
```

```java
// ✅ Builder — читаемо, безопасно, расширяемо
public class User {
    private final String name;
    private final String email;
    private final int age;
    private final String city;
    private final boolean active;

    private User(Builder builder) {
        this.name   = builder.name;
        this.email  = builder.email;
        this.age    = builder.age;
        this.city   = builder.city;
        this.active = builder.active;
    }

    public static class Builder {
        // Обязательные поля
        private final String name;
        private final String email;
        // Опциональные с дефолтами
        private int age = 0;
        private String city = "";
        private boolean active = true;

        public Builder(String name, String email) {
            this.name  = name;
            this.email = email;
        }

        public Builder age(int age)       { this.age = age; return this; }
        public Builder city(String city)  { this.city = city; return this; }
        public Builder active(boolean a)  { this.active = a; return this; }

        public User build() {
            // Валидация перед созданием
            if (name == null || name.isBlank()) throw new IllegalStateException("Name required");
            return new User(this);
        }
    }
}

// Использование — читается как предложение
User user = new User.Builder("Alice", "alice@mail.com")
    .age(25)
    .city("Moscow")
    .active(true)
    .build();
```

!!! note "Lombok и Builder"
    В реальном коде используй `@Builder` от Lombok — он генерирует всё автоматически. Но на собесе без Lombok умей написать руками. Также обрати внимание на `record` (Java 16+) — для простых DTO он заменяет Builder.

---

### Factory Method — Фабричный метод

**Проблема:** Нужно создавать объекты, не привязываясь к конкретным классам.

```java
// Абстрактный продукт
public interface Notification {
    void send(String message);
}

// Конкретные продукты
public class EmailNotification implements Notification {
    private final String email;
    public EmailNotification(String email) { this.email = email; }

    @Override
    public void send(String message) {
        System.out.println("Email → " + email + ": " + message);
    }
}

public class SmsNotification implements Notification {
    private final String phone;
    public SmsNotification(String phone) { this.phone = phone; }

    @Override
    public void send(String message) {
        System.out.println("SMS → " + phone + ": " + message);
    }
}

// Фабрика — централизованное место создания
public class NotificationFactory {
    public static Notification create(String type, String contact) {
        return switch (type) {
            case "EMAIL" -> new EmailNotification(contact);
            case "SMS"   -> new SmsNotification(contact);
            default      -> throw new IllegalArgumentException("Unknown type: " + type);
        };
    }
}

// Клиентский код не знает о конкретных классах
Notification n = NotificationFactory.create("EMAIL", "user@mail.com");
n.send("Ваш заказ подтверждён");
```

!!! note "Factory vs Abstract Factory"
    **Factory Method** — один фабричный метод, создаёт один тип объекта. **Abstract Factory** — семейство связанных объектов (например, фабрика UI-элементов: `WindowsButton`, `WindowsCheckbox` или `MacButton`, `MacCheckbox`). На собесах чаще спрашивают Factory Method.

## Структурные (Structural)

Отвечают на вопрос: **как организовать классы и объекты?**

### Decorator — Динамическое добавление поведения

**Проблема:** Нужно добавить объекту новое поведение, не меняя его класс и не плодя наследников.

Классический пример — Java I/O:

```java
// Вся система I/O в Java — это декораторы
InputStream base      = new FileInputStream("file.txt");     // базовый компонент
InputStream buffered  = new BufferedInputStream(base);       // декоратор: буферизация
InputStream gzipped   = new GZIPInputStream(buffered);       // декоратор: распаковка
```

**Реализуем сами:**

```java
// Базовый интерфейс
public interface Coffee {
    String getDescription();
    double getCost();
}

// Базовая реализация
public class SimpleCoffee implements Coffee {
    @Override public String getDescription() { return "Coffee"; }
    @Override public double getCost()        { return 1.0; }
}

// Абстрактный декоратор — держит ссылку на декорируемый объект
public abstract class CoffeeDecorator implements Coffee {
    protected final Coffee coffee;
    public CoffeeDecorator(Coffee coffee) { this.coffee = coffee; }
}

// Конкретные декораторы
public class MilkDecorator extends CoffeeDecorator {
    public MilkDecorator(Coffee coffee) { super(coffee); }

    @Override public String getDescription() { return coffee.getDescription() + ", Milk"; }
    @Override public double getCost()        { return coffee.getCost() + 0.5; }
}

public class SugarDecorator extends CoffeeDecorator {
    public SugarDecorator(Coffee coffee) { super(coffee); }

    @Override public String getDescription() { return coffee.getDescription() + ", Sugar"; }
    @Override public double getCost()        { return coffee.getCost() + 0.25; }
}

// Использование — оборачиваем слой за слоем
Coffee order = new SugarDecorator(new MilkDecorator(new SimpleCoffee()));
System.out.println(order.getDescription()); // Coffee, Milk, Sugar
System.out.println(order.getCost());        // 1.75
```

!!! tip "Decorator vs Inheritance"
    Наследование — статическое (на этапе компиляции). Декоратор — динамическое (в рантайме). Можно обернуть объект любым числом декораторов в любом порядке. Это реализация принципа OCP.

## Поведенческие (Behavioral)

Отвечают на вопрос: **как организовать взаимодействие объектов?**

### Strategy — Взаимозаменяемые алгоритмы

**Проблема:** Нужно менять алгоритм в зависимости от ситуации, не меняя клиентский код.

```java
// Интерфейс стратегии
@FunctionalInterface
public interface SortStrategy {
    void sort(int[] array);
}

// Конкретные стратегии
public class BubbleSort implements SortStrategy {
    @Override
    public void sort(int[] array) {
        // O(n²) — для маленьких массивов
        System.out.println("Bubble sort...");
    }
}

public class QuickSort implements SortStrategy {
    @Override
    public void sort(int[] array) {
        // O(n log n) — для больших массивов
        System.out.println("Quick sort...");
    }
}

// Контекст использует стратегию
public class Sorter {
    private SortStrategy strategy;

    public Sorter(SortStrategy strategy) {
        this.strategy = strategy;
    }

    // Можно менять стратегию на лету
    public void setStrategy(SortStrategy strategy) {
        this.strategy = strategy;
    }

    public void sort(int[] array) {
        strategy.sort(array);
    }
}

// Использование
Sorter sorter = new Sorter(new BubbleSort());
sorter.sort(smallArray);

sorter.setStrategy(new QuickSort());
sorter.sort(largeArray);

// Со времён Java 8 — стратегии как лямбды (раз это @FunctionalInterface)
sorter.setStrategy(array -> Arrays.sort(array));
```

!!! note "Strategy везде"
    `Comparator` в Java — это Strategy. `Runnable` — это Strategy. `DiscountStrategy` из раздела SOLID — тоже. Паттерн пронизывает весь Java-экосистем.

---

### Observer — Подписка на события

**Проблема:** Когда одно событие должно вызвать реакцию у нескольких независимых объектов.

```java
// Интерфейс наблюдателя
public interface OrderObserver {
    void onOrderPlaced(Order order);
}

// Subject — тот, за кем наблюдают
public class OrderService {
    private final List<OrderObserver> observers = new ArrayList<>();

    public void addObserver(OrderObserver observer) {
        observers.add(observer);
    }

    public void removeObserver(OrderObserver observer) {
        observers.remove(observer);
    }

    public void placeOrder(Order order) {
        // бизнес-логика
        order.confirm();

        // уведомляем всех наблюдателей — OrderService не знает, кто они
        observers.forEach(o -> o.onOrderPlaced(order));
    }
}

// Конкретные наблюдатели — независимые друг от друга
public class EmailNotifier implements OrderObserver {
    @Override
    public void onOrderPlaced(Order order) {
        System.out.println("Email: заказ " + order.getId() + " подтверждён");
    }
}

public class InventoryUpdater implements OrderObserver {
    @Override
    public void onOrderPlaced(Order order) {
        System.out.println("Резервируем товары для заказа " + order.getId());
    }
}

public class AnalyticsTracker implements OrderObserver {
    @Override
    public void onOrderPlaced(Order order) {
        System.out.println("Пишем в аналитику: заказ на сумму " + order.getTotal());
    }
}

// Сборка
OrderService service = new OrderService();
service.addObserver(new EmailNotifier());
service.addObserver(new InventoryUpdater());
service.addObserver(new AnalyticsTracker());

service.placeOrder(new Order(...));
// Выполнятся все три наблюдателя, при этом они ничего не знают друг о друге
```

!!! note "Observer в Java и Spring"
    - `java.util.EventListener` — Observer в стандартной библиотеке.
    - `ApplicationEvent` / `@EventListener` в Spring — Observer из коробки.
    - Kafka/RabbitMQ — Observer на уровне микросервисов (Publisher/Subscriber).

---

### Итоговая шпаргалка

| Паттерн | Категория | Проблема | Ключевая идея |
|---|---|---|---|
| **Singleton** | Порождающий | Нужен один экземпляр | Приватный конструктор + статический метод доступа |
| **Builder** | Порождающий | Объект с кучей параметров | Пошаговая сборка через fluent API |
| **Factory Method** | Порождающий | Создание без привязки к классу | Метод возвращает интерфейс, скрывая `new` |
| **Decorator** | Структурный | Добавить поведение без наследования | Обёртка, реализующая тот же интерфейс |
| **Strategy** | Поведенческий | Взаимозаменяемые алгоритмы | Интерфейс + набор реализаций + контекст |
| **Observer** | Поведенческий | Реакция нескольких на одно событие | Subject хранит список и уведомляет всех |