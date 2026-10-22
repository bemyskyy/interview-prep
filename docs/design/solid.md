---
tags:
  - Junior
  - Middle
  - Java
  - Архитектура
---

# SOLID

Пять принципов проектирования Роберта Мартина («Дядя Боб»), которые делают код гибким, читаемым и легко расширяемым. На собесе важно не просто дать определение, а показать **на конкретном примере**, что ломается без принципа и как становится лучше с ним.

## Принципы SOLID { #principles }

### Что такое Single Responsibility Principle? { #srp }

**Уровень:** Junior

=== "Коротко"

    !!! abstract "Ответ вслух"
        У класса должна быть только одна причина для изменения: он делает одну вещь. Если `OrderService` и подтверждает заказ, и генерирует PDF, и отправляет email, у него три причины меняться. Такие обязанности выносят в отдельные классы и делегируют им работу.

=== "Подробно"

    > **Класс должен иметь только одну причину для изменения.**

    Иными словами, класс делает одну вещь и делает её хорошо. Если класс приходится менять по двум разным причинам — он нарушает SRP.

    #### Антипаттерн { #srp-bad }

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

    #### Правильно { #srp-good }

    ```java
    // ✅ Каждый класс — одна ответственность
    public class OrderService {
        private final OrderRepository repository;
        private final PdfGenerator pdfGenerator;
        private final EmailSender emailSender;

        public OrderService(OrderRepository repository, PdfGenerator pdfGenerator, EmailSender emailSender) {
            this.repository = repository;
            this.pdfGenerator = pdfGenerator;
            this.emailSender = emailSender;
        }

        public void processOrder(Order order) {
            order.confirm();                       // бизнес-логика
            repository.save(order);                // персистентность
            pdfGenerator.generate(order);          // делегируем
            emailSender.sendConfirmation(order);   // делегируем
        }
    }

    public class PdfGenerator {                    // только генерация PDF
        public void generate(Order order) { }
    }

    public class EmailSender {                     // только отправка email
        public void sendConfirmation(Order order) { }
    }

    public interface OrderRepository {
        void save(Order order);
    }
    ```

    !!! tip "Архитектурный маркер"
        Если при описании класса ты употребляешь союз **«и»** — скорее всего, SRP нарушен. «Класс сохраняет заказ **и** отправляет email» — красный флаг.

!!! warning "Ловушка: «один класс — один метод»"
    SRP — не про количество методов, а про причины изменения. `OrderRepository` с десятью методами работы с заказами в БД соблюдает SRP: все они меняются по одной причине — из-за хранилища.

??? question "Проверь себя"
    1. Как звучит SRP?
    2. Сколько причин для изменения у `OrderService` из антипаттерна и какие?
    3. Нарушает ли SRP класс с десятью методами?

### Что такое Open/Closed Principle? { #ocp }

**Уровень:** Junior

=== "Коротко"

    !!! abstract "Ответ вслух"
        Класс открыт для расширения, но закрыт для изменения: новая функциональность добавляется новым кодом, а не правкой работающего. Вместо `if-else` по типу скидки — интерфейс `DiscountStrategy` и новый класс на каждый тип скидки. OCP реализуется через Стратегию, Декоратор и Фабрику.

=== "Подробно"

    > **Класс должен быть открыт для расширения, но закрыт для изменения.**

    Добавление новой функциональности не должно требовать правки уже работающего кода — только написания нового.

    #### Антипаттерн { #ocp-bad }

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

    #### Правильно { #ocp-good }

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
        OCP реализуется через [Стратегию](behavioral-patterns.md#strategy), [Декоратор](structural-patterns.md#decorator) и [Factory Method](creational-patterns.md#factory-method). Когда видишь гигантский `if-else` или `switch` по типу — это сигнал применить OCP.

!!! warning "Ловушка: OCP везде и сразу"
    Выносить в стратегии каждый `if` заранее — переусложнение. Интерфейс окупается, когда вариантов действительно несколько и новые появляются регулярно. Пока вариант один, достаточно простого кода, который легко отрефакторить позже.

??? question "Проверь себя"
    1. Как звучит OCP?
    2. Почему цепочка `if-else` по типу скидки нарушает OCP?
    3. Какие паттерны помогают соблюдать OCP?

### Что такое Liskov Substitution Principle? { #lsp }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Объекты наследника должны подставляться вместо объектов родителя без изменения корректности программы. Классический пример — `Square extends Rectangle`: сеттеры квадрата меняют обе стороны, и код, ожидающий прямоугольник, ломается. Признаки нарушения — `instanceof` в клиентском коде и `UnsupportedOperationException` в наследнике.

=== "Подробно"

    > **Объекты наследника должны быть взаимозаменяемы с объектами родителя без изменения корректности программы.**

    Если код работает с типом `Animal`, он должен работать и с `Dog`, и с `Cat` без сюрпризов.

    #### Антипаттерн — квадрат и прямоугольник { #lsp-bad }

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

    #### Правильно { #lsp-good }

    ```java
    // ✅ Разделяем иерархию через общий интерфейс
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

    #### Практический маркер нарушения LSP { #lsp-marker }

    ```java
    // ❌ Если в коде встречается instanceof — это симптом нарушения LSP
    public void process(Animal animal) {
        if (animal instanceof Dog) {
            ((Dog) animal).fetch(); // тогда зачем нам полиморфизм?
        } else if (animal instanceof Cat) {
            ((Cat) animal).purr();
        }
    }

    // ✅ Полиморфизм решает это без instanceof
    public void processPolymorphic(Animal animal) {
        animal.makeSound(); // каждый знает, что делать сам
    }
    ```

!!! warning "Красный флаг"
    Если наследник **выбрасывает исключение** в переопределённом методе (`throw new UnsupportedOperationException()`), **сужает** его поведение или **нарушает инварианты** родителя — это нарушение LSP.

??? question "Проверь себя"
    1. Как звучит LSP?
    2. Почему `Square extends Rectangle` нарушает LSP, хотя квадрат — это прямоугольник?
    3. Какие признаки в коде выдают нарушение LSP?

### Что такое Interface Segregation Principle? { #isp }

**Уровень:** Junior

=== "Коротко"

    !!! abstract "Ответ вслух"
        Клиент не должен зависеть от методов, которые он не использует: лучше много маленьких интерфейсов-ролей, чем один толстый. Если `Dog` вынужден реализовать `fly()` заглушкой с исключением — интерфейс пора разделить. В Spring-мире это, например, отдельные интерфейсы для чтения, записи и аналитики.

=== "Подробно"

    > **Клиент не должен зависеть от методов, которые он не использует.**

    Лучше много маленьких специализированных интерфейсов, чем один толстый.

    #### Антипаттерн { #isp-bad }

    ```java
    // ❌ «Жирный» интерфейс — не все животные умеют всё
    public interface Animal {
        void eat();
        void sleep();
        void fly();   // Собака не летает!
        void swim();  // Орёл не плавает!
        void bark();  // Кошка не лает!
    }

    public class Dog implements Animal {
        public void eat()   { }
        public void sleep() { }
        public void fly()   { throw new UnsupportedOperationException(); } // вынуждены!
        public void swim()  { }
        public void bark()  { }
    }
    ```

    #### Правильно { #isp-good }

    ```java
    // ✅ Маленькие интерфейсы — роли
    public interface Eater    { void eat(); }
    public interface Sleeper  { void sleep(); }
    public interface Flyer    { void fly(); }
    public interface Swimmer  { void swim(); }
    public interface Barker   { void bark(); }

    // Каждый класс реализует только то, что умеет
    public class Dog implements Eater, Sleeper, Swimmer, Barker {
        public void eat() { }
        public void sleep() { }
        public void swim() { }
        public void bark() { }
    }

    public class Eagle implements Eater, Sleeper, Flyer {
        public void eat() { }
        public void sleep() { }
        public void fly() { }
    }

    public class Fish implements Eater, Swimmer {
        public void eat() { }
        public void swim() { }
    }
    ```

    #### Пример из Spring-мира { #isp-spring }

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

        public ReportService(UserAnalytics analytics) {
            this.analytics = analytics;
        }
    }
    ```

!!! warning "Ловушка: `UnsupportedOperationException` в реализации"
    Метод-заглушка, бросающий `UnsupportedOperationException`, — главный признак слишком толстого интерфейса. Он нарушает сразу и ISP, и [LSP](#lsp): код, работающий с интерфейсом, получит исключение там, где ждал поведение.

??? question "Проверь себя"
    1. Как звучит ISP?
    2. Как понять, что интерфейс пора разделить?
    3. Как ISP помогает сервису отчётов в примере со Spring?

### Что такое Dependency Inversion Principle? { #dip }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Модули высокого уровня не зависят от модулей низкого уровня — оба зависят от абстракций. Бизнес-логика знает интерфейс `OrderRepository`, а MySQL, PostgreSQL или in-memory реализация передаётся снаружи. В Spring это делает Dependency Injection через конструктор, и это же условие тестируемости.

=== "Подробно"

    > **Модули высокого уровня не должны зависеть от модулей низкого уровня. Оба должны зависеть от абстракций.**

    Бизнес-логика не должна знать о деталях инфраструктуры: БД, файловой системе, HTTP-клиентах.

    #### Антипаттерн { #dip-bad }

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

    #### Правильно { #dip-good }

    ```java
    // ✅ Бизнес-логика зависит от абстракции
    public interface OrderRepository {
        void save(Order order);
        Optional<Order> findById(Long id);
    }

    // Реализации — детали инфраструктуры
    public class MySQLOrderRepository implements OrderRepository {
        public MySQLOrderRepository(String host, int port) { }
        public void save(Order order) { }
        public Optional<Order> findById(Long id) { return Optional.empty(); }
    }

    public class PostgreSQLOrderRepository implements OrderRepository {
        public void save(Order order) { }
        public Optional<Order> findById(Long id) { return Optional.empty(); }
    }

    public class InMemoryOrderRepository implements OrderRepository { // для тестов!
        private final Map<Long, Order> storage = new HashMap<>();
        public void save(Order order) { storage.put(order.getId(), order); }
        public Optional<Order> findById(Long id) { return Optional.ofNullable(storage.get(id)); }
    }

    // OrderService не знает, что под капотом
    public class OrderService {
        private final OrderRepository repository; // зависим от абстракции

        // Зависимость передаётся снаружи (Spring DI)
        public OrderService(OrderRepository repository) {
            this.repository = repository;
        }

        public void placeOrder(Order order) {
            order.validate();
            repository.save(order);
        }
    }
    ```

    #### Как это выглядит в Spring { #dip-spring }

    ```java
    @Service
    public class OrderService {
        private final OrderRepository repository; // Spring внедрит нужную реализацию

        public OrderService(OrderRepository repository) { // Constructor Injection — лучший способ
            this.repository = repository;
        }
    }

    @Repository
    public class JpaOrderRepository implements OrderRepository {
        public void save(Order order) { }
        public Optional<Order> findById(Long id) { return Optional.empty(); }
    }
    ```

    !!! tip "DIP + тестируемость"
        DIP — не просто архитектурная красота, а условие тестируемости. Если `OrderService` зависит от интерфейса `OrderRepository`, в тесте подставляешь `InMemoryOrderRepository` или мок и проверяешь бизнес-логику без реальной БД.

!!! warning "Ловушка: DIP ≠ Dependency Injection"
    DIP — принцип: зависеть от абстракций. Dependency Injection — техника: передавать зависимости снаружи. Можно внедрять через конструктор конкретный `MySQLOrderRepository` — это DI, но DIP нарушен.

??? question "Проверь себя"
    1. Как звучит DIP?
    2. Чем DIP отличается от Dependency Injection?
    3. Как DIP помогает тестировать бизнес-логику?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **S — SRP** | Один класс — одна причина меняться; красный флаг — класс делает «X и Y и Z» |
| **O — OCP** | Расширяй новым кодом, не правь старый; красный флаг — гигантский `if-else` / `switch` по типу |
| **L — LSP** | Наследник не ломает поведение родителя; красные флаги — `instanceof` в клиенте, `UnsupportedOperationException` |
| **I — ISP** | Не заставляй реализовывать лишнее; красный флаг — «жирный» интерфейс с методами-заглушками |
| **D — DIP** | Зависи от абстракций, а не от реализаций; красный флаг — `new ConcreteClass()` внутри бизнес-логики |

<!-- --8<-- [end:cheatsheet] -->
