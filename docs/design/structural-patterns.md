---
tags:
  - Java
  - Архитектура
---

# Структурные паттерны

Структурные паттерны отвечают на вопрос: **как организовать классы и объекты?** На собесе чаще всего просят написать Decorator и показать, где он используется в JDK.

Паттерны проектирования по классификации GoF (Gang of Four) делятся на [порождающие](creational-patterns.md), структурные (эта страница) и [поведенческие](behavioral-patterns.md).

## Структурные паттерны { #structural }

### Что такое Decorator? { #decorator }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Decorator добавляет объекту поведение во время работы программы, оборачивая его в объект того же интерфейса. Каждая обёртка делегирует вызов внутреннему объекту и добавляет своё. Классический пример — `java.io`: `BufferedInputStream` и `GZIPInputStream` оборачивают `FileInputStream`.

=== "Подробно"

    **Проблема:** нужно добавить объекту новое поведение, не меняя его класс и не плодя наследников.

    Классический пример — Java I/O, подробно в [IO / NIO → Декоратор в java.io](../java/io-nio.md#io-decorator):

    ```java
    // Вся система I/O в Java — это декораторы
    InputStream base      = new FileInputStream("file.txt");     // базовый компонент
    InputStream buffered  = new BufferedInputStream(base);       // декоратор: буферизация
    InputStream gzipped   = new GZIPInputStream(buffered);       // декоратор: распаковка
    ```

    Реализуем сами:

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

    ```mermaid
    flowchart LR
        C["Клиент"] -- "getCost()" --> S["SugarDecorator<br/>+0.25"]
        S -- "getCost()" --> M["MilkDecorator<br/>+0.5"]
        M -- "getCost()" --> B["SimpleCoffee<br/>1.0"]
    ```

    !!! tip "Decorator vs наследование"
        Наследование — статическое (на этапе компиляции). Декоратор — динамическое (в рантайме): объект можно обернуть любым числом декораторов в любом порядке. Это реализация принципа [OCP](solid.md#ocp).

!!! warning "Ловушка: порядок обёрток важен"
    Декораторы применяются снаружи внутрь, и порядок меняет результат. `new GZIPInputStream(new BufferedInputStream(file))` и `new BufferedInputStream(new GZIPInputStream(file))` работают по-разному: в первом случае буферизируются сжатые байты, во втором — уже распакованные.

??? question "Проверь себя"
    1. Какую проблему решает Decorator?
    2. Чем Decorator отличается от наследования?
    3. Где Decorator используется в JDK?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Decorator** | Обёртка с тем же интерфейсом добавляет поведение в рантайме; `java.io` |

<!-- --8<-- [end:cheatsheet] -->
