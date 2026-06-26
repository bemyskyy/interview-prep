# SOLID

SOLID — это пять принципов проектирования, которые делают код гибким, читаемым и легко расширяемым. Придуманы Робертом Мартином ("Дядя Боб"). На собесах важно не просто дать определение, а объяснить **на конкретном примере**, что ломается без принципа и как становится лучше с ним.

## S — Single Responsibility Principle (Принцип единственной ответственности)

> **Класс должен иметь только одну причину для изменения.**

Иными словами — класс делает одну вещь и делает её хорошо. Если тебе нужно изменить класс из-за двух разных причин — он нарушает SRP.

### Антипаттерн

```java
// ❌ У этого класса три причины для изменения:
// 1. Изменилась бизнес-логика заказа
// 2. Изменился формат PDF
// 3. Изменился способ отправки email
public class OrderService {
    public void processOrder(Order order) {
        // Бизнес-логика
        order.setStatus(OrderStatus.CONFIRMED);
        order.calculateTotal();

        // Генерация PDF — сюда не относится
        PdfWriter writer = new PdfWriter("order_" + order.getId() + ".pdf");
        writer.write(order.toString());

        // Отправка email — сюда тоже не относится
        SmtpClient smtp = new SmtpClient("smtp.company.com");
        smtp.send(order.getCustomerEmail(), "Ваш заказ подтверждён");
    }
}
```

### Правильно

```java
// ✅ Каждый класс — одна ответственность
public class OrderService {
    private final OrderRepository repository;
    private final PdfGenerator pdfGenerator;
    private final EmailSender emailSender;

    public void processOrder(Order order) {
        order.confirm();                              // бизнес-логика
        repository.save(order);                      // персистентность
        pdfGenerator.generate(order);                // делегируем
        emailSender.sendConfirmation(order);         // делегируем
    }
}

public class PdfGenerator { ... }   // только генерация PDF
public class EmailSender { ... }    // только отправка email
```

!!! tip "Архитектурный маркер"
    Если при описании класса ты употребляешь союз **"и"** — скорее всего SRP нарушен. "Класс сохраняет заказ **и** отправляет email" — красный флаг.

## O — Open/Closed Principle (Принцип открытости/закрытости)

> **Класс должен быть открыт для расширения, но закрыт для изменения.**

Добавление новой функциональности не должно требовать правки уже работающего кода — только написания нового.

### Антипаттерн

```java
// ❌ Каждый новый тип скидки требует редактировать этот метод
// При этом можно случайно сломать уже работающую логику
public class DiscountCalculator {
    public double calculate(Order order, String discountType) {
        if (discountType.equals("SEASONAL")) {
            return order.getTotal() * 0.1;
        } else if (discountType.equals("VIP")) {
            return order.getTotal() * 0.2;
        } else if (discountType.equals("PROMO")) {  // добавили — рискуем сломать выше
            return order.getTotal() * 0.15;
        }
        return 0;
    }
}
```

### Правильно

```java
// ✅ Новый тип скидки = новый класс. Старый код не трогаем
public interface DiscountStrategy {
    double calculate(Order order);
}

public class SeasonalDiscount implements DiscountStrategy {
    @Override
    public double calculate(Order order) { return order.getTotal() * 0.1; }
}

public class VipDiscount implements DiscountStrategy {
    @Override
    public double calculate(Order order) { return order.getTotal() * 0.2; }
}

// Новое требование — просто добавляем класс, ничего не меняем
public class PromoDiscount implements DiscountStrategy {
    @Override
    public double calculate(Order order) { return order.getTotal() * 0.15; }
}

public class DiscountCalculator {
    public double calculate(Order order, DiscountStrategy strategy) {
        return strategy.calculate(order); // закрыт для изменения
    }
}
```

!!! note "Связь с паттернами"
    OCP реализуется через **Стратегию**, **Декоратор** и **Фабрику**. Когда видишь гигантский `if-else` или `switch` по типу — это сигнал применить OCP.

## L — Liskov Substitution Principle (Принцип подстановки Лисков)

> **Объекты наследника должны быть взаимозаменяемы с объектами родителя без изменения корректности программы.**

Если код работает с типом `Animal`, он должен работать и с `Dog`, и с `Cat` без сюрпризов.

### Антипаттерн — классический пример с квадратом и прямоугольником

```java
// ❌ Математически квадрат IS-A прямоугольник.
// Но в коде это нарушение LSP:
public class Rectangle {
    protected int width;
    protected int height;

    public void setWidth(int w)  { this.width = w; }
    public void setHeight(int h) { this.height = h; }
    public int area() { return width * height; }
}

public class Square extends Rectangle {
    @Override
    public void setWidth(int w)  { this.width = w; this.height = w; }  // сюрприз!
    @Override
    public void setHeight(int h) { this.width = h; this.height = h; }  // сюрприз!
}

// Клиентский код, который ожидает Rectangle:
public void resize(Rectangle r) {
    r.setWidth(5);
    r.setHeight(10);
    assert r.area() == 50; // ❌ При Square: area() == 100, assert упадёт!
}
```

### Правильно

```java
// ✅ Разделяем иерархию или используем интерфейс
public interface Shape {
    int area();
}

public class Rectangle implements Shape {
    private final int width;
    private final int height;

    public Rectangle(int width, int height) {
        this.width = width;
        this.height = height;
    }

    @Override
    public int area() { return width * height; }
}

public class Square implements Shape {
    private final int side;

    public Square(int side) { this.side = side; }

    @Override
    public int area() { return side * side; }
}
```

### Практический маркер нарушения LSP

```java
// ❌ Если в коде встречается instanceof — это симптом нарушения LSP
public void process(Animal animal) {
    if (animal instanceof Dog) {
        ((Dog) animal).fetch(); // Тогда зачем нам полиморфизм?
    } else if (animal instanceof Cat) {
        ((Cat) animal).purr();
    }
}

// ✅ Полиморфизм решает это без instanceof
public void process(Animal animal) {
    animal.makeSound(); // каждый знает, что делать сам
}
```

!!! warning "Красный флаг"
    Если наследник **выбрасывает исключение** в переопределённом методе (`throw new UnsupportedOperationException()`), **сужает** его поведение или **нарушает инварианты** родителя — это нарушение LSP.

## I — Interface Segregation Principle (Принцип разделения интерфейсов)

> **Клиент не должен зависеть от методов, которые он не использует.**

Лучше много маленьких специализированных интерфейсов, чем один толстый.

### Антипаттерн

```java
// ❌ "Жирный" интерфейс — не все животные умеют всё
public interface Animal {
    void eat();
    void sleep();
    void fly();   // Собака не летает!
    void swim();  // Орёл не плавает!
    void bark();  // Кошка не лает!
}

public class Dog implements Animal {
    public void eat()   { ... }
    public void sleep() { ... }
    public void fly()   { throw new UnsupportedOperationException(); } // вынуждены!
    public void swim()  { ... }
    public void bark()  { ... }
}
```

### Правильно

```java
// ✅ Маленькие интерфейсы — роли
public interface Eater    { void eat(); }
public interface Sleeper  { void sleep(); }
public interface Flyer    { void fly(); }
public interface Swimmer  { void swim(); }
public interface Barker   { void bark(); }

// Каждый класс реализует только то, что умеет
public class Dog implements Eater, Sleeper, Swimmer, Barker { ... }
public class Eagle implements Eater, Sleeper, Flyer { ... }
public class Fish implements Eater, Swimmer { ... }
```

### Реальный пример из Spring-мира

```java
// ❌ Один интерфейс репозитория на всё
public interface UserRepository {
    User findById(Long id);
    void save(User user);
    void delete(Long id);
    List<User> findAll();
    List<User> findByAgeGreaterThan(int age);
    Long countByCity(String city);
    // ... ещё 20 методов
}

// ✅ Разделяем по контексту использования
public interface UserReader {
    User findById(Long id);
    List<User> findAll();
}

public interface UserWriter {
    void save(User user);
    void delete(Long id);
}

public interface UserAnalytics {
    List<User> findByAgeGreaterThan(int age);
    Long countByCity(String city);
}

// Сервис отчётов зависит только от того, что ему нужно
public class ReportService {
    private final UserAnalytics analytics; // не тащим за собой save/delete
}
```

## D — Dependency Inversion Principle (Принцип инверсии зависимостей)

> **Модули высокого уровня не должны зависеть от модулей низкого уровня. Оба должны зависеть от абстракций.**

Бизнес-логика не должна знать о деталях инфраструктуры (БД, файловая система, HTTP-клиенты).

### Антипаттерн

```java
// ❌ Бизнес-логика жёстко привязана к MySQL
// Хочешь перейти на PostgreSQL — переписывай OrderService
public class OrderService {
    private final MySQLOrderRepository repository; // конкретная реализация!

    public OrderService() {
        this.repository = new MySQLOrderRepository("localhost", 3306); // жёсткая зависимость
    }

    public void placeOrder(Order order) {
        // бизнес-логика...
        repository.save(order);
    }
}
```

### Правильно

```java
// ✅ Бизнес-логика зависит от абстракции
public interface OrderRepository {
    void save(Order order);
    Optional<Order> findById(Long id);
}

// Реализации — детали инфраструктуры
public class MySQLOrderRepository implements OrderRepository { ... }
public class PostgreSQLOrderRepository implements OrderRepository { ... }
public class InMemoryOrderRepository implements OrderRepository { ... } // для тестов!

// OrderService не знает, что под капотом
public class OrderService {
    private final OrderRepository repository; // зависим от абстракции

    // Зависимость инжектируется снаружи (Spring DI)
    public OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    public void placeOrder(Order order) {
        order.validate();
        repository.save(order);
    }
}
```

### Как это выглядит в Spring

```java
@Service
public class OrderService {
    private final OrderRepository repository; // Spring инжектирует нужную реализацию

    public OrderService(OrderRepository repository) { // Constructor Injection — лучший способ
        this.repository = repository;
    }
}

@Repository
public class JpaOrderRepository implements OrderRepository { ... }
```

!!! tip "DIP + тестируемость"
    DIP — это не просто архитектурная красота. Это условие тестируемости. Если `OrderService` зависит от интерфейса `OrderRepository`, в тесте ты подставляешь `InMemoryOrderRepository` или мок — и тестируешь бизнес-логику без реальной БД.

## Итоговая шпаргалка

| Принцип | Суть одной строкой | Красный флаг нарушения |
|---|---|---|
| **S** — SRP | Один класс — одна причина меняться | Класс делает "X и Y и Z" |
| **O** — OCP | Расширяй новым кодом, не правь старый | Гигантский `if-else` / `switch` по типу |
| **L** — LSP | Наследник не ломает поведение родителя | `instanceof` в клиентском коде, `UnsupportedOperationException` |
| **I** — ISP | Не заставляй реализовывать лишнее | "Жирный" интерфейс с методами-заглушками |
| **D** — DIP | Зависи от абстракций, не от реализаций | `new ConcreteClass()` внутри бизнес-логики |