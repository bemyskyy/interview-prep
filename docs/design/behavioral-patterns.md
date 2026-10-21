---
tags:
  - Java
  - Архитектура
---

# Поведенческие паттерны

Поведенческие паттерны отвечают на вопрос: **как организовать взаимодействие объектов?** На собесе чаще всего просят написать Strategy и Observer и назвать их примеры в JDK и Spring.

Паттерны проектирования по классификации GoF (Gang of Four) делятся на [порождающие](creational-patterns.md), [структурные](structural-patterns.md) и поведенческие (эта страница).

## Поведенческие паттерны { #behavioral }

### Что такое Strategy? { #strategy }

**Уровень:** Junior

=== "Коротко"

    !!! abstract "Ответ вслух"
        Strategy выносит взаимозаменяемые алгоритмы в отдельные классы с общим интерфейсом, а контекст получает нужный алгоритм снаружи и может сменить его на лету. Если интерфейс функциональный, стратегию передают лямбдой. В JDK это, например, `Comparator`.

=== "Подробно"

    **Проблема:** нужно менять алгоритм в зависимости от ситуации, не меняя клиентский код.

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

    // С Java 8 — стратегии как лямбды (раз это @FunctionalInterface)
    sorter.setStrategy(array -> Arrays.sort(array));
    ```

    !!! note "Strategy везде"
        `Comparator` (см. [Коллекции → Comparator](../java/collections.md#comparable-comparator)), `Runnable` и `DiscountStrategy` из [SOLID → OCP](solid.md#ocp) — всё это Strategy. Паттерн пронизывает всю Java-экосистему.

!!! warning "Ловушка: Strategy против `switch` внутри класса"
    Если алгоритм выбирается `switch`-ем внутри одного класса, каждый новый вариант требует правки этого класса — это нарушение OCP. Признак, что пора выделять стратегии, — несколько веток с разной логикой, которые растут со временем.

??? question "Проверь себя"
    1. Из каких частей состоит паттерн Strategy?
    2. Как сменить стратегию во время работы программы?
    3. Какие примеры Strategy есть в JDK?

### Что такое Observer? { #observer }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Observer — подписка на события: субъект хранит список наблюдателей и уведомляет всех, когда что-то происходит, не зная, кто они. Наблюдатели независимы друг от друга, и новых можно добавлять без правки субъекта. В Spring это `ApplicationEvent` и `@EventListener`, на уровне микросервисов — Kafka и RabbitMQ.

=== "Подробно"

    **Проблема:** одно событие должно вызвать реакцию у нескольких независимых объектов.

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

    service.placeOrder(new Order());
    // Выполнятся все три наблюдателя, при этом они ничего не знают друг о друге
    ```

    ```mermaid
    sequenceDiagram
        participant C as Клиент
        participant S as OrderService
        participant E as EmailNotifier
        participant I as InventoryUpdater
        participant A as AnalyticsTracker
        C->>S: placeOrder(order)
        S->>S: order.confirm()
        S->>E: onOrderPlaced(order)
        S->>I: onOrderPlaced(order)
        S->>A: onOrderPlaced(order)
    ```

    !!! note "Observer в Java и Spring"
        - `java.util.EventListener` — маркерный интерфейс слушателей в стандартной библиотеке.
        - `ApplicationEvent` / `@EventListener` в Spring — Observer из коробки.
        - Kafka и RabbitMQ — Observer на уровне микросервисов (publisher/subscriber).

!!! warning "Ловушка: синхронные наблюдатели и исключения"
    В примере наблюдатели вызываются по очереди в том же потоке. Если `EmailNotifier` бросит исключение, `InventoryUpdater` и `AnalyticsTracker` не выполнятся, а `placeOrder` упадёт. Наблюдателей изолируют через `try-catch` вокруг каждого вызова или выносят в асинхронную обработку.

??? question "Проверь себя"
    1. Из каких участников состоит Observer?
    2. Что знает субъект о своих наблюдателях?
    3. Что произойдёт, если один из синхронных наблюдателей бросит исключение?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Strategy** | Интерфейс + реализации + контекст; стратегию можно передать лямбдой; `Comparator` |
| **Observer** | Субъект уведомляет список наблюдателей; `@EventListener`, Kafka |

<!-- --8<-- [end:cheatsheet] -->
