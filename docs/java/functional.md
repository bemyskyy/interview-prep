---
tags:
  - Junior
  - Middle
  - Java
---

# Лямбды и Optional

Функциональные интерфейсы, лямбды и ссылки на методы, а также `Optional` — как его создавать и как с ним работать без `isPresent()` и `get()`. Чаще всего спрашивают, почему лямбда требует effectively final, чем `orElse` отличается от `orElseGet` и где `Optional` использовать не стоит. Сами стримы — на странице [Stream API](streams.md).

## Функциональные интерфейсы { #functional }

### Что такое функциональный интерфейс? { #functional-interfaces }

**Уровень:** Junior

=== "Коротко"

    !!! abstract "Ответ вслух"
        Это интерфейс ровно с одним абстрактным методом — SAM, Single Abstract Method; именно его можно заменить лямбдой. Основные из `java.util.function`: `Predicate`, `Function`, `Consumer` и `Supplier`. Аннотация `@FunctionalInterface` просит компилятор проверить, что абстрактный метод действительно один.

=== "Подробно"

    Функциональный интерфейс — интерфейс ровно с **одним абстрактным методом** (SAM — Single Abstract Method). Именно его можно заменить лямбда-выражением.

    #### Четыре основных из `java.util.function` { #core-interfaces }

    ```java
    // Predicate<T> — принимает T, возвращает boolean
    Predicate<String> isLong = s -> s.length() > 5;
    isLong.test("Hello");                                // false
    isLong.and(s -> s.startsWith("J")).test("JavaDev");  // true (композиция)

    // Function<T, R> — принимает T, возвращает R
    Function<String, Integer> length = String::length;
    length.apply("Hello");                               // 5
    length.andThen(n -> n * 2).apply("Hello");           // 10 (композиция)

    // Consumer<T> — принимает T, ничего не возвращает (void)
    Consumer<String> print = System.out::println;
    print.accept("Hello");

    // Supplier<T> — ничего не принимает, возвращает T
    Supplier<List<String>> listFactory = ArrayList::new;
    List<String> newList = listFactory.get();
    ```

    | **Интерфейс** | **Сигнатура** | **Метод** | **Типичное применение** |
    |---|---|---|---|
    | `Predicate<T>` | `T → boolean` | `test()` | `filter()` в стримах |
    | `Function<T,R>` | `T → R` | `apply()` | `map()` в стримах |
    | `Consumer<T>` | `T → void` | `accept()` | `forEach()` в стримах |
    | `Supplier<T>` | `() → T` | `get()` | `orElseGet()`, фабрики |
    | `BiFunction<T,U,R>` | `(T,U) → R` | `apply()` | Когда нужны два аргумента |
    | `BiPredicate<T,U>` | `(T,U) → boolean` | `test()` | Сравнение двух объектов |
    | `UnaryOperator<T>` | `T → T` | `apply()` | `replaceAll()` в списке |
    | `BinaryOperator<T>` | `(T,T) → T` | `apply()` | `reduce()` в стримах |
    | `Runnable` | `() → void` | `run()` | Задача без результата |
    | `Callable<T>` | `() → T` | `call()` | Задача с результатом (может бросить checked) |

    #### `@FunctionalInterface` — свой интерфейс { #custom-functional-interface }

    ```java
    @FunctionalInterface  // компилятор проверит, что абстрактный метод ровно один
    public interface Transformer<T, R> {
        R transform(T input);

        // default- и static-методы не считаются — это разрешено
        default Transformer<T, R> andLog() {
            return input -> {
                R result = this.transform(input);
                System.out.println(input + " → " + result);
                return result;
            };
        }
    }

    // Использование
    Transformer<String, Integer> lengthOf = String::length;
    lengthOf.andLog().transform("Hello"); // выведет "Hello → 5"
    ```

!!! warning "Ловушка: лямбда и checked-исключения"
    Методы стандартных интерфейсов (`Function.apply`, `Consumer.accept`) не объявляют `throws`. Лямбда внутри `map()` не может бросить `IOException` — её придётся обернуть в `UncheckedIOException` или вынести в метод с `try-catch`. `Callable` — исключение: его `call()` объявляет `throws Exception`.

??? question "Проверь себя"
    1. Что такое функциональный интерфейс?
    2. Назови четыре основных функциональных интерфейса и их сигнатуры.
    3. Считаются ли `default`-методы при проверке `@FunctionalInterface`?

### Что такое ссылки на методы? { #method-references }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Это короткая запись лямбды, которая просто вызывает существующий метод: `Integer::parseInt` вместо `s -> Integer.parseInt(s)`. Есть четыре вида: статический метод, метод экземпляра через тип, метод конкретного объекта и конструктор.

Ссылки на методы (method references) — более читаемая альтернатива лямбдам, когда лямбда просто вызывает метод:

```java
// Статический метод
Function<String, Integer> parse = Integer::parseInt;
// эквивалентно: s -> Integer.parseInt(s)

// Метод экземпляра через тип
Function<String, String> upper = String::toUpperCase;
// эквивалентно: s -> s.toUpperCase()

// Метод экземпляра через конкретный объект
Consumer<String> info = logger::info;
// эквивалентно: s -> logger.info(s)

// Конструктор
Supplier<ArrayList<String>> factory = ArrayList::new;
// эквивалентно: () -> new ArrayList<>()
```

!!! warning "Ловушка: `obj::method` вычисляет `obj` сразу"
    В `logger::info` объект `logger` берётся в момент создания ссылки. Если `logger` равен `null`, `NullPointerException` вылетит сразу, а не при вызове. У лямбды `s -> logger.info(s)` переменная читается только при вызове.

??? question "Проверь себя"
    1. Назови четыре вида ссылок на методы.
    2. Во что раскрывается `String::toUpperCase` как `Function<String, String>`?
    3. Когда вычисляется объект в ссылке `obj::method`?

### Почему лямбда требует effectively final? { #effectively-final }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Лямбда захватывает не переменную, а копию её значения: локальная переменная живёт в стеке и может исчезнуть раньше, чем лямбда выполнится. Чтобы копия и оригинал не расходились, Java требует, чтобы переменная не менялась после инициализации — была effectively final. Типичная ловушка — счётчик цикла `i` внутри лямбды.

Лямбда может захватывать переменные из внешней области видимости, но они обязаны быть **effectively final** — не изменяться после инициализации.

```java
String prefix = "Hello, ";   // effectively final — не меняется
Consumer<String> greeter = person -> System.out.println(prefix + person); // ✅

// prefix = "Hi, ";          // ❌ ошибка компиляции: prefix больше не effectively final
```

!!! warning "Ловушка в цикле"
    Типичная ловушка — захват переменной цикла, которая меняется.

    ```java
    for (int i = 0; i < 5; i++) {
        // buttons.get(i).setOnClick(() -> System.out.println(i)); // ❌ i не effectively final
    }

    // ✅ Решение: скопировать в локальную переменную
    for (int i = 0; i < 5; i++) {
        final int index = i;
        buttons.get(i).setOnClick(() -> System.out.println(index));
    }
    ```

??? question "Проверь себя"
    1. Что значит effectively final?
    2. Почему лямбда не может захватить изменяемую локальную переменную?
    3. Как использовать счётчик цикла внутри лямбды?

## Optional { #optional }

### Что такое `Optional` и как его создать? { #optional-basics }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    `Optional<T>` (Java 8) — контейнер, в котором либо есть значение, либо нет: отсутствие становится явным на уровне типа, а не скрытым `null`. Создаётся через `Optional.of()` для гарантированно не-`null` значения, `ofNullable()` — для значения, которое может быть `null`, и `empty()`.

`Optional<T>` — контейнер, который либо содержит значение, либо пуст. Он появился в Java 8, чтобы сделать возможное отсутствие значения **явным на уровне типа**, а не скрытым `null`.

```java
Optional<String> filled = Optional.of("value");      // значение есть (null → NPE)
Optional<String> maybe  = Optional.ofNullable(name); // может быть null
Optional<String> empty  = Optional.empty();          // гарантированно пуст
```

Получение значения:

```java
String a = optional.get();                                   // значение или NoSuchElementException
String b = optional.orElse("default");                       // значение или дефолт
String c = optional.orElseGet(() -> compute());              // значение или результат лямбды (лениво)
String d = optional.orElseThrow(() -> new NotFoundException()); // значение или исключение
```

!!! warning "Ловушка: `Optional.of(null)`"
    `Optional.of(null)` сразу бросает `NullPointerException`. Если значение может быть `null`, нужен `Optional.ofNullable()` — он вернёт `Optional.empty()`.

??? question "Проверь себя"
    1. Зачем нужен `Optional`?
    2. Чем `Optional.of()` отличается от `Optional.ofNullable()`?
    3. Что бросит `get()` на пустом `Optional`?

### Чем `orElse` отличается от `orElseGet`? { #orelse }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `orElse(value)` вычисляет `value` всегда, даже если в `Optional` есть значение: аргумент считается до вызова метода. `orElseGet(supplier)` вызывает лямбду только для пустого `Optional`. Если дефолт дорогой — запрос в БД, сетевой вызов, — всегда `orElseGet`.

```java
Optional<String> present = Optional.of("value");

String a = present.orElse(loadFromDb());        // loadFromDb() ВЫЗОВЕТСЯ, хотя значение есть
String b = present.orElseGet(() -> loadFromDb()); // loadFromDb() не вызовется
```

!!! tip "orElse vs orElseGet"
    `orElse(value)` **всегда** вычисляет `value`, даже если `Optional` не пуст. `orElseGet(supplier)` вычисляет только если `Optional` пуст. Если дефолтное значение дорогое (запрос в БД, сетевой вызов), всегда используй `orElseGet`.

!!! warning "Ловушка: побочные эффекты в `orElse`"
    Если в `orElse(createUser())` метод что-то сохраняет или отправляет, это произойдёт на каждом вызове — даже когда пользователь уже найден. Такие ошибки находят по дублям в базе.

??? question "Проверь себя"
    1. Когда вычисляется аргумент `orElse`?
    2. Когда вызывается лямбда в `orElseGet`?
    3. Почему `orElse(createUser())` опасен?

### Как правильно работать с `Optional`? { #optional-chains }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Через цепочки `map`, `flatMap`, `filter` и завершающие `orElse`, `orElseGet`, `orElseThrow`, `ifPresent`. Пара `isPresent()` + `get()` — та же проверка на `null`, только длиннее. `Optional` задуман для возвращаемых значений методов, а не для полей, параметров и коллекций.

```java
// Вместо цепочки null-проверок
String city = Optional.ofNullable(user)
    .map(User::getAddress)
    .map(Address::getCity)
    .orElse("Unknown");

// filter + map
Optional<String> upperName = Optional.ofNullable(name)
    .filter(s -> !s.isEmpty())
    .map(String::toUpperCase);

// flatMap — когда mapper сам возвращает Optional
Optional<String> email = Optional.ofNullable(user)
    .flatMap(u -> userRepository.findById(u.getId()))  // возвращает Optional<User>
    .map(User::getEmail);
```

Антипаттерны:

```java
// ❌ isPresent() + get() — теряем смысл Optional
if (optional.isPresent()) {
    System.out.println(optional.get()); // то же самое, что проверка на null
}

// ✅ Используй ifPresent / ifPresentOrElse / map / orElse
optional.ifPresent(value -> System.out.println(value));
optional.ifPresentOrElse(
    value -> System.out.println(value),
    () -> log.warn("Value not found")
);

// ❌ Optional в полях класса или параметрах метода
public class Profile {
    private Optional<String> phone; // плохо — Optional не Serializable
}
```

!!! note "Для чего Optional"
    `Optional` задуман **только для возвращаемых типов методов** — чтобы явно сигнализировать, что результат может отсутствовать. Не используй его в полях классов, параметрах методов и коллекциях.

!!! warning "Ловушка: `Optional` в поле"
    `Optional` не реализует `Serializable` и плохо дружит с JPA и Jackson. В поле храни обычное значение, которое может быть `null`, а `Optional` возвращай из геттера: `Optional.ofNullable(phone)`.

??? question "Проверь себя"
    1. Почему пара `isPresent()` + `get()` считается антипаттерном?
    2. Когда в цепочке нужен `flatMap` вместо `map`?
    3. Где не стоит использовать `Optional`?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Функциональные интерфейсы** | Один абстрактный метод; `Predicate`, `Function`, `Consumer`, `Supplier` |
| **Effectively final** | Лямбда захватывает копию значения — переменная не должна меняться |
| **`Optional`** | Для возвращаемых значений; `orElseGet` для дорогого дефолта; не `isPresent` + `get` |

<!-- --8<-- [end:cheatsheet] -->
