# Stream API и Функциональное программирование

## Что такое Stream

**Stream — это не структура данных.** Он не хранит элементы. Это абстракция, конвейер для декларативной обработки данных. Ты говоришь _что_ нужно сделать, а не _как_ (в отличие от императивных циклов `for` или `while`).

Жизненный цикл любого стрима состоит строго из трёх этапов.

## 1. Источник (Creation)

Стрим нужно из чего-то создать.

```java
list.stream()                              // из коллекции
Arrays.stream(array)                       // из массива
Stream.of(1, 2, 3)                         // из набора элементов
Stream.generate(() -> Math.random())       // бесконечная генерация
Stream.iterate(0, n -> n + 1)             // бесконечная итерация
Files.lines(Path.of("data.txt"))          // строки файла (lazy!)
IntStream.range(0, 10)                    // числа от 0 до 9
```

## 2. Промежуточные операции (Intermediate)

Трансформируют стрим и возвращают **новый стрим**. Самая важная их характеристика — **ленивость (laziness)**. Ни одна промежуточная операция не выполнится, пока не будет вызвана терминальная.

```java
filter(Predicate)          // отфильтровать по условию
map(Function)              // преобразовать каждый элемент
flatMap(Function)          // преобразовать в стрим и "сплющить"
distinct()                 // только уникальные (через equals)
sorted() / sorted(Comp.)   // сортировка (stateful — буферизирует всё!)
peek(Consumer)             // посмотреть на элемент не меняя (дебаг/лог)
limit(n) / skip(n)         // обрезать / пропустить первые n
```

### `map` vs `flatMap` — любимый вопрос на собесах

```java
// map: каждый элемент → один элемент другого типа
List<String> names = users.stream()
    .map(User::getName)          // User → String
    .collect(toList());
// [User1, User2, User3] → ["Alice", "Bob", "Carol"]

// flatMap: каждый элемент → стрим элементов, потом всё склеивается
List<String> allTags = posts.stream()
    .flatMap(post -> post.getTags().stream()) // Post → Stream<String>
    .distinct()
    .collect(toList());
// [Post(tags=[java,spring]), Post(tags=[java,jpa])] → ["java", "spring", "jpa"]
```

!!! tip "Правило"
    `map` — один к одному. `flatMap` — один ко многим, потом всё в один плоский поток.

## 3. Терминальные операции (Terminal)

Возвращают конкретный результат или выполняют побочное действие. Как только вызвана терминальная операция, стрим **закрывается** — использовать его повторно нельзя, получишь `IllegalStateException`.

```java
collect(Collector)                  // собрать в коллекцию или Map
forEach(Consumer)                   // действие для каждого (side-effect)
reduce(BinaryOperator)             // свернуть всё к одному значению
count()                             // количество элементов
min(Comparator) / max(Comparator)  // минимум / максимум → Optional
anyMatch() / allMatch() / noneMatch(Predicate) // → boolean
findFirst() / findAny()            // → Optional
toArray()                           // → массив
```

## Что спрашивают на собесе

### Short-circuiting (Операции короткого замыкания)

Операции, которым не нужно обрабатывать весь стрим до конца:

- **Промежуточные:** `limit()`, `takeWhile()`
- **Терминальные:** `anyMatch()`, `findFirst()`, `findAny()`

```java
// Из миллиона элементов обработается только один — первый подходящий
boolean exists = hugeList.stream()
    .filter(this::isExpensive)
    .anyMatch(item -> item.getPrice() > 1000); // стоп при первом совпадении
```

### Порядок операций в конвейере

Элементы идут по конвейеру **вертикально**, а не горизонтально. Первый элемент проходит `filter` → `map` → `collect`, потом начинает второй.

```java
// Порядок выполнения: filter(1), map(1), filter(2), map(2)...
// А НЕ: filter(1,2,3...), потом map(1,2,3...)
List<String> result = Stream.of("a", "bb", "ccc", "d")
    .filter(s -> {
        System.out.println("filter: " + s);
        return s.length() > 1;
    })
    .map(s -> {
        System.out.println("map: " + s);
        return s.toUpperCase();
    })
    .collect(toList());
// Вывод: filter: a, filter: bb, map: bb, filter: ccc, map: ccc, filter: d
```

Это важно для **оптимизации**: ставь `filter` как можно раньше — отсеченные элементы не дойдут до тяжёлых операций.

### Примитивные стримы — IntStream, LongStream, DoubleStream

`Stream<Integer>` тратит память и CPU на boxing/unboxing. Для примитивов есть специализированные стримы:

```java
// ❌ Медленно — каждое число оборачивается в Integer
Stream<Integer> slow = list.stream().map(x -> x * 2);

// ✅ Быстро — работаем с примитивами напрямую
IntStream fast = list.stream().mapToInt(x -> x * 2);

// Удобные методы только у примитивных стримов:
int sum = IntStream.range(1, 101).sum();           // 5050
OptionalDouble avg = IntStream.of(1,2,3).average();
IntSummaryStatistics stats = list.stream()
    .mapToInt(User::getAge)
    .summaryStatistics(); // min, max, avg, sum, count — за один проход
```

### Параллельные стримы — parallelStream()

```java
long count = hugeList.parallelStream()
    .filter(this::isHeavyComputation)
    .count();
```

Используют общий `ForkJoinPool.commonPool()`. Звучит как волшебная кнопка "сделать быстро" — но это не так.

!!! warning "Параллельные стримы — не серебряная пуля"
    На маленьких данных или простых операциях накладные расходы на разделение и синхронизацию сделают код **медленнее**. Применяй только когда:

    1. Данных **много** (сотни тысяч элементов и больше).
    2. Операции **тяжёлые** (CPU-bound вычисления).
    3. Операции **потокобезопасны** (нет общего мутабельного состояния).
    4. **Измерил** — и параллельный вариант действительно быстрее.

## Collectors — Собираем результат

`Collectors` — это статический класс с фабричными методами для создания сборщиков. Это самая богатая часть Stream API.

### Базовые коллекторы

```java
// В список / множество
List<String> list = stream.collect(Collectors.toList());
Set<String> set = stream.collect(Collectors.toSet());

// Начиная с Java 16 — неизменяемые копии
List<String> immutable = stream.collect(Collectors.toUnmodifiableList());
// или короче:
List<String> immutable = stream.toList(); // Java 16+
```

### toMap — частый источник ошибок

```java
// Базовое использование: элемент → ключ, элемент → значение
Map<Long, String> idToName = users.stream()
    .collect(Collectors.toMap(
        User::getId,      // keyMapper
        User::getName     // valueMapper
    ));

// ❌ Если встретятся два одинаковых ключа — IllegalStateException!
// ✅ Передай mergeFunction третьим аргументом:
Map<String, User> nameToUser = users.stream()
    .collect(Collectors.toMap(
        User::getName,
        user -> user,
        (existing, duplicate) -> existing  // при дубликате — оставить первый
    ));
```

!!! warning "Ловушка toMap"
    `toMap` по умолчанию **не терпит дубликатов ключей** и бросает `IllegalStateException`. Всегда думай: могут ли ключи повториться?

### groupingBy — самый мощный коллектор

```java
// Сгруппировать пользователей по городу
Map<String, List<User>> byCity = users.stream()
    .collect(Collectors.groupingBy(User::getCity));
// {"Moscow": [User1, User3], "London": [User2]}

// С downstream-коллектором: сгруппировать и посчитать
Map<String, Long> countByCity = users.stream()
    .collect(Collectors.groupingBy(
        User::getCity,
        Collectors.counting()   // downstream
    ));

// Многоуровневая группировка
Map<String, Map<Role, List<User>>> byDeptAndRole = users.stream()
    .collect(Collectors.groupingBy(
        User::getDepartment,
        Collectors.groupingBy(User::getRole)
    ));
```

### partitioningBy — деление на две группы

```java
// Делит на true/false по предикату
Map<Boolean, List<User>> adultSplit = users.stream()
    .collect(Collectors.partitioningBy(u -> u.getAge() >= 18));

List<User> adults = adultSplit.get(true);
List<User> minors = adultSplit.get(false);
```

### joining — склейка строк

```java
// Склеить имена через запятую
String names = users.stream()
    .map(User::getName)
    .collect(Collectors.joining(", "));  // "Alice, Bob, Carol"

// С префиксом и суффиксом
String sql = ids.stream()
    .map(String::valueOf)
    .collect(Collectors.joining(", ", "WHERE id IN (", ")"));
// "WHERE id IN (1, 2, 3)"
```

### Downstream collectors — коллекторы внутри коллекторов

```java
// groupingBy + mapping + toSet = уникальные теги по категории
Map<String, Set<String>> tagsByCategory = posts.stream()
    .collect(Collectors.groupingBy(
        Post::getCategory,
        Collectors.mapping(Post::getTag, Collectors.toSet())
    ));

// groupingBy + summarizingInt = статистика по возрасту в каждом городе
Map<String, IntSummaryStatistics> statsByCity = users.stream()
    .collect(Collectors.groupingBy(
        User::getCity,
        Collectors.summarizingInt(User::getAge)
    ));
```

## Optional — Борьба с null

`Optional<T>` — это контейнер, который либо содержит значение, либо пуст. Введён в Java 8, чтобы сделать возможное отсутствие значения **явным на уровне типа**, а не скрытым `null`.

### Создание

```java
Optional<String> filled = Optional.of("value");       // значение есть (null → NPE)
Optional<String> maybe  = Optional.ofNullable(name);  // может быть null
Optional<String> empty  = Optional.empty();            // гарантированно пуст
```

### Получение значения

```java
optional.get()                        // вернёт значение или NoSuchElementException
optional.orElse("default")           // вернёт значение или дефолт
optional.orElseGet(() -> compute())  // вернёт значение или результат лямбды (ленивый)
optional.orElseThrow(() -> new NotFoundException()) // или бросит исключение
```

!!! tip "orElse vs orElseGet"
    `orElse(value)` — **всегда** вычисляет `value`, даже если Optional не пуст. `orElseGet(supplier)` — вычисляет только если Optional пуст. Если дефолтное значение дорогое (запрос в БД, сетевой вызов) — всегда используй `orElseGet`.

### Цепочки с Optional

```java
// Вместо null-проверок
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

### Антипаттерны Optional

```java
// ❌ isPresent() + get() — теряем весь смысл Optional
if (optional.isPresent()) {
    return optional.get(); // то же самое, что проверка на null
}

// ✅ Используй orElse / map / ifPresent
optional.ifPresent(value -> process(value));
optional.ifPresentOrElse(
    value -> process(value),
    () -> log.warn("Value not found")
);

// ❌ Optional в полях класса или параметрах метода
public class User {
    private Optional<String> phone; // плохо — Optional не Serializable
}

// ❌ Optional.of(null) — немедленный NPE
Optional.of(null); // бросит NullPointerException

// ✅ Optional.ofNullable(null) — вернёт Optional.empty()
```

!!! note "Для чего Optional"
    Optional задуман **только для возвращаемых типов методов** — чтобы явно сигнализировать, что результат может отсутствовать. Не используй его в полях классов, параметрах методов и коллекциях.

## Функциональные интерфейсы и лямбды

Функциональный интерфейс — это интерфейс ровно с **одним абстрактным методом** (SAM — Single Abstract Method). Именно его можно заменить лямбда-выражением.

### Четыре основных из `java.util.function`

```java
// Predicate<T> — принимает T, возвращает boolean
Predicate<String> isLong = s -> s.length() > 5;
isLong.test("Hello");        // false
isLong.and(s -> s.startsWith("J")).test("JavaDev"); // true (композиция)

// Function<T, R> — принимает T, возвращает R
Function<String, Integer> length = String::length;
length.apply("Hello");       // 5
length.andThen(n -> n * 2).apply("Hello"); // 10 (композиция)

// Consumer<T> — принимает T, ничего не возвращает (void)
Consumer<String> print = System.out::println;
print.accept("Hello");

// Supplier<T> — ничего не принимает, возвращает T
Supplier<List<String>> listFactory = ArrayList::new;
List<String> newList = listFactory.get();
```

### Полная таблица

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
| `Callable<T>` | `() → T` | `call()` | Задача с результатом (throws) |

### Ссылки на методы (Method References)

Более читаемая альтернатива лямбдам, когда лямбда просто вызывает метод:

```java
// Статический метод
Function<String, Integer> parse = Integer::parseInt;
// эквивалентно: s -> Integer.parseInt(s)

// Метод экземпляра через тип
Function<String, String> upper = String::toUpperCase;
// эквивалентно: s -> s.toUpperCase()

// Метод экземпляра через конкретный объект
Consumer<String> log = logger::info;
// эквивалентно: s -> logger.info(s)

// Конструктор
Supplier<ArrayList<String>> factory = ArrayList::new;
// эквивалентно: () -> new ArrayList<>()
```

### Замыкания и effectively final

Лямбда может захватывать переменные из внешней области видимости, но они обязаны быть **effectively final** — не изменяться после инициализации.

```java
String prefix = "Hello, "; // effectively final — не меняется
Consumer<String> greeter = name -> System.out.println(prefix + name); // ✅

prefix = "Hi, ";  // ❌ ошибка компиляции — prefix больше не effectively final
```

!!! warning "Ловушка в цикле"
    Типичная ловушка: захват переменной цикла, которая меняется.

    ```java
    for (int i = 0; i < 5; i++) {
        // ❌ i не effectively final — меняется на каждой итерации
        buttons.get(i).setOnClick(() -> System.out.println(i));
    }

    // ✅ Решение: скопировать в локальную переменную
    for (int i = 0; i < 5; i++) {
        final int index = i;
        buttons.get(i).setOnClick(() -> System.out.println(index));
    }
    ```

### `@FunctionalInterface` — своя аннотация

```java
@FunctionalInterface  // компилятор проверит, что метод ровно один
public interface Transformer<T, R> {
    R transform(T input);

    // Дефолтные и статические методы не считаются — это разрешено
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

## Реальные примеры (собесные задачки)

### Топ-3 города по числу пользователей

```java
Map<String, Long> countByCity = users.stream()
    .collect(Collectors.groupingBy(User::getCity, Collectors.counting()));

List<String> top3 = countByCity.entrySet().stream()
    .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
    .limit(3)
    .map(Map.Entry::getKey)
    .collect(Collectors.toList());
```

### Средняя зарплата по отделу

```java
Map<String, Double> avgSalaryByDept = employees.stream()
    .collect(Collectors.groupingBy(
        Employee::getDepartment,
        Collectors.averagingDouble(Employee::getSalary)
    ));
```

### Найти первого пользователя старше 30 или бросить исключение

```java
User senior = users.stream()
    .filter(u -> u.getAge() > 30)
    .findFirst()
    .orElseThrow(() -> new UserNotFoundException("No users older than 30"));
```

### Flat-список всех тегов из всех постов (уникальные, отсортированные)

```java
List<String> tags = posts.stream()
    .flatMap(post -> post.getTags().stream())
    .distinct()
    .sorted()
    .collect(Collectors.toList());
```

### Разбить список на две группы: активные и нет

```java
Map<Boolean, List<User>> split = users.stream()
    .collect(Collectors.partitioningBy(User::isActive));

List<User> active   = split.get(true);
List<User> inactive = split.get(false);
```