---
tags:
  - Junior
  - Middle
  - Java
---

# Stream API

Как устроены стримы: конвейер операций, ленивость, порядок выполнения, параллельные стримы и коллекторы. Чаще всего спрашивают про ленивость стримов, `map` против `flatMap`, ловушки `toMap` и группировку. Лямбды, функциональные интерфейсы и `Optional` — на странице [Лямбды и Optional](functional.md).

## Основы { #basics }

### Что такое Stream и из чего состоит конвейер? { #what-is-stream }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Stream — не структура данных, а конвейер декларативной обработки: ты описываешь, **что** сделать, а не **как**, как в цикле. Конвейер состоит из трёх этапов: источник, промежуточные операции и одна терминальная. Пока терминальная операция не вызвана, ничего не выполняется.

**Stream — это не структура данных.** Он не хранит элементы: это абстракция, конвейер для декларативной обработки данных. Ты говоришь, _что_ нужно сделать, а не _как_ — в отличие от императивных циклов `for` и `while`.

Жизненный цикл любого стрима состоит строго из трёх этапов:

```mermaid
flowchart LR
    S["Источник<br/>коллекция, массив, файл"] --> I["Промежуточные операции<br/>filter, map, sorted…<br/>ленивые"]
    I --> T["Терминальная операция<br/>collect, count, forEach…<br/>запускает конвейер"]
    T --> R["Результат"]
```

Стрим нужно из чего-то создать — это **источник**:

```java
Stream<String> fromList = list.stream();                        // из коллекции
IntStream fromArray = Arrays.stream(new int[]{1, 2, 3});         // из массива
Stream<Integer> fromValues = Stream.of(1, 2, 3);                 // из набора элементов
Stream<Double> randoms = Stream.generate(Math::random);           // бесконечная генерация
Stream<Integer> naturals = Stream.iterate(0, n -> n + 1);         // бесконечная итерация
IntStream range = IntStream.range(0, 10);                         // числа от 0 до 9
try (Stream<String> lines = Files.lines(Path.of("data.txt"))) {   // строки файла — лениво
    lines.forEach(System.out::println);
}
```

!!! warning "Ловушка: бесконечный стрим без ограничения"
    `Stream.generate()` и `Stream.iterate(seed, f)` бесконечны. Без `limit()`, `takeWhile()` или короткозамыкающей терминальной операции `collect()` на них никогда не завершится.

??? question "Проверь себя"
    1. Хранит ли Stream элементы?
    2. Из каких трёх этапов состоит конвейер?
    3. Как создать стрим из коллекции, из массива и из строк файла?

### Чем промежуточные операции отличаются от терминальных? { #intermediate-terminal }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Промежуточные операции — `filter`, `map`, `sorted` — возвращают новый стрим и ленивы: сами по себе ничего не делают. Терминальная операция — `collect`, `count`, `forEach` — запускает конвейер и возвращает результат. После неё стрим закрыт, и повторное использование даёт `IllegalStateException`.

**Промежуточные операции (intermediate)** трансформируют стрим и возвращают **новый стрим**. Главное их свойство — **ленивость (laziness)**: ни одна не выполнится, пока не вызвана терминальная.

| **Операция** | **Что делает** |
|---|---|
| `filter(Predicate)` | Отфильтровать по условию |
| `map(Function)` | Преобразовать каждый элемент |
| `flatMap(Function)` | Преобразовать каждый элемент в стрим и «сплющить» |
| `distinct()` | Оставить только уникальные (через `equals`) |
| `sorted()` / `sorted(Comparator)` | Сортировка (stateful — буферизирует все элементы) |
| `peek(Consumer)` | Посмотреть на элемент, не меняя его (отладка, лог) |
| `limit(n)` / `skip(n)` | Обрезать / пропустить первые n |

**Терминальные операции (terminal)** возвращают результат или выполняют побочное действие. Как только терминальная операция вызвана, стрим **закрывается**.

| **Операция** | **Что возвращает** |
|---|---|
| `collect(Collector)` | Коллекцию или `Map` |
| `forEach(Consumer)` | Ничего — действие для каждого элемента |
| `reduce(BinaryOperator)` | Одно значение — свёртку всех элементов |
| `count()` | Количество элементов |
| `min(Comparator)` / `max(Comparator)` | `Optional` с минимумом / максимумом |
| `anyMatch` / `allMatch` / `noneMatch` | `boolean` |
| `findFirst()` / `findAny()` | `Optional` |
| `toArray()` / `toList()` | Массив / неизменяемый список |

```java
Stream<String> names = Stream.of("Alice", "Bob")
    .peek(n -> System.out.println("вижу " + n)); // ничего не напечатано: нет терминальной операции

List<String> result = names.toList();             // теперь конвейер запустился

// names.count();                                 // IllegalStateException: stream has already been operated upon or closed
```

!!! warning "Ловушка: `count()` может пропустить `peek()`"
    С Java 9 `count()` не запускает конвейер, если размер известен заранее: `Stream.of("a", "b").peek(System.out::println).count()` вернёт 2 и ничего не напечатает. Не полагайся на побочные эффекты в `peek()` и `map()`.

??? question "Проверь себя"
    1. Что значит «промежуточные операции ленивы»?
    2. Что будет при повторном вызове терминальной операции на том же стриме?
    3. Почему `peek()` может не выполниться при `count()`?

### Чем `map` отличается от `flatMap`? { #map-flatmap }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    `map` превращает каждый элемент ровно в один элемент другого типа: один к одному. `flatMap` превращает каждый элемент в стрим элементов, а потом склеивает все эти стримы в один плоский. Классический пример — собрать все теги из всех постов.

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
// [Post(tags=[java, spring]), Post(tags=[java, jpa])] → ["java", "spring", "jpa"]
```

!!! tip "Правило"
    `map` — один к одному. `flatMap` — один ко многим, а потом всё в один плоский поток.

!!! warning "Ловушка: `map` вместо `flatMap`"
    `posts.stream().map(post -> post.getTags().stream())` даст `Stream<Stream<String>>` — стрим стримов, а не теги. Если mapper возвращает стрим (или `Optional`), нужен `flatMap`.

??? question "Проверь себя"
    1. Чем результат `map` отличается от результата `flatMap`?
    2. Что вернёт `map`, если mapper возвращает стрим?
    3. Как собрать уникальные теги из списка постов?

## Как работает конвейер { #pipeline }

### В каком порядке выполняются операции стрима? { #vertical }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Вертикально: каждый элемент проходит весь конвейер — `filter`, потом `map`, потом `collect`, — и только затем начинается следующий. Горизонтально, «сначала все фильтры, потом все map», стрим не работает. Поэтому `filter` ставят как можно раньше: отсеянные элементы не доходят до дорогих операций.

Элементы идут по конвейеру **вертикально**, а не горизонтально: первый элемент проходит `filter` → `map` → `collect`, потом начинается второй.

```java
// Порядок выполнения: filter(a), filter(bb), map(bb), filter(ccc), map(ccc)...
// а НЕ: filter(a, bb, ccc, d), потом map(...)
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

Это важно для **оптимизации**: ставь `filter` как можно раньше — отсеянные элементы не дойдут до тяжёлых операций.

!!! warning "Ловушка: `sorted()` ломает вертикальность"
    `sorted()` — stateful-операция: чтобы отсортировать, ей нужно получить **все** элементы. Всё, что стоит до `sorted()`, отработает для всех элементов, и только потом конвейер пойдёт дальше. На бесконечном стриме `sorted()` никогда не завершится.

??? question "Проверь себя"
    1. В каком порядке выполнятся `filter` и `map` для элементов `"a"` и `"bb"`?
    2. Почему `filter` выгодно ставить раньше `map`?
    3. Чем `sorted()` отличается от `filter()` с точки зрения конвейера?

### Что такое short-circuiting? { #short-circuit }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Это операции, которым не нужно обрабатывать стрим до конца: промежуточные `limit()` и `takeWhile()`, терминальные `anyMatch()`, `findFirst()`, `findAny()`. Благодаря вертикальному выполнению конвейер останавливается, как только результат известен. Поэтому такие операции работают даже на бесконечных стримах.

Операции короткого замыкания (short-circuiting) не обрабатывают стрим до конца:

- **Промежуточные:** `limit()`, `takeWhile()`.
- **Терминальные:** `anyMatch()`, `findFirst()`, `findAny()`.

```java
// Обработка остановится на первом подходящем элементе, даже если список огромный
boolean exists = hugeList.stream()
    .filter(this::isExpensive)
    .anyMatch(item -> item.getPrice() > 1000); // стоп при первом совпадении

// На бесконечном стриме — тоже работает
List<Integer> firstTen = Stream.iterate(1, n -> n + 1)
    .limit(10)
    .toList();
```

!!! warning "Ловушка: `findAny()` в параллельном стриме"
    `findAny()` в параллельном стриме может вернуть любой подходящий элемент, а не первый. Если нужен именно первый по порядку — `findFirst()`, но в параллельном режиме он дороже.

??? question "Проверь себя"
    1. Назови промежуточные и терминальные short-circuiting операции.
    2. Сколько элементов обработает `anyMatch`, если подходящий элемент первый?
    3. Чем `findFirst()` отличается от `findAny()`?

### Зачем нужны `IntStream`, `LongStream` и `DoubleStream`? { #primitive-streams }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `Stream<Integer>` тратит память и CPU на упаковку каждого числа в объект. Примитивные стримы работают с `int`, `long` и `double` напрямую и дают удобные методы: `sum()`, `average()`, `summaryStatistics()`. Переход из объектного стрима — через `mapToInt()` и аналоги.

`Stream<Integer>` тратит память и CPU на boxing и unboxing. Для примитивов есть специализированные стримы:

```java
List<Integer> numbers = List.of(1, 2, 3);

// ❌ Медленнее — каждое число оборачивается в Integer
Stream<Integer> slow = numbers.stream().map(x -> x * 2);

// ✅ Быстрее — работаем с примитивами напрямую
IntStream fast = numbers.stream().mapToInt(x -> x * 2);

// Удобные методы есть только у примитивных стримов:
int sum = IntStream.range(1, 101).sum();              // 5050
OptionalDouble avg = IntStream.of(1, 2, 3).average();
IntSummaryStatistics stats = users.stream()
    .mapToInt(User::getAge)
    .summaryStatistics(); // min, max, avg, sum, count — за один проход
```

!!! warning "Ловушка: `average()` возвращает `OptionalDouble`"
    У пустого стрима среднего нет, поэтому `average()` возвращает `OptionalDouble`, а не `double`. Нужно явно решить, что делать с пустым результатом: `avg.orElse(0)`.

??? question "Проверь себя"
    1. Чем `Stream<Integer>` хуже `IntStream`?
    2. Как перейти от `Stream<User>` к `IntStream` возрастов?
    3. Что возвращает `average()` и почему?

### Когда использовать `parallelStream()`? { #parallel }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    Только когда данных много, операции тяжёлые и CPU-bound, нет общего изменяемого состояния — и замер показал, что так быстрее. Параллельные стримы работают в общем `ForkJoinPool.commonPool()`, который делят все параллельные стримы приложения. На маленьких данных накладные расходы на разделение делают код медленнее.

```java
long count = hugeList.parallelStream()
    .filter(this::isHeavyComputation)
    .count();
```

Параллельные стримы используют общий `ForkJoinPool.commonPool()`. Но `.parallel()` не гарантирует ускорения.

!!! warning "Параллельные стримы — не серебряная пуля"
    На маленьких данных или простых операциях накладные расходы на разделение и синхронизацию сделают код **медленнее**. Применяй, только когда:

    1. Данных **много** — сотни тысяч элементов и больше.
    2. Операции **тяжёлые** — CPU-bound вычисления.
    3. Операции **потокобезопасны** — нет общего изменяемого состояния.
    4. Ты **измерил** — и параллельный вариант действительно быстрее.

!!! warning "Ловушка: общий пул"
    `commonPool()` один на всё приложение: долгий или блокирующий параллельный стрим (например, с HTTP-запросами внутри) займёт его и затормозит все остальные параллельные стримы. Подробнее о пуле — в [Пулы потоков → ForkJoinPool](../concurrency/executors.md#forkjoinpool).

??? question "Проверь себя"
    1. В каком пуле потоков выполняются параллельные стримы?
    2. Назови четыре условия, при которых `parallelStream()` оправдан.
    3. Почему блокирующие операции внутри параллельного стрима опасны?

## Collectors { #collectors }

### Как собрать стрим в коллекцию? { #to-list }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Через `collect()` с коллекторами из класса `Collectors`: `toList()`, `toSet()`, `toMap()` и другие. С Java 10 есть `toUnmodifiableList()`, а с Java 16 — короткий `stream.toList()`, который тоже возвращает неизменяемый список. `Collectors.toList()` на практике отдаёт изменяемый `ArrayList`, но тип списка не гарантирован.

`Collectors` — утилитный класс с фабричными методами для создания сборщиков. Это самая богатая часть Stream API.

```java
// В список / множество
List<String> list = Stream.of("a", "b").collect(Collectors.toList());
Set<String> set = Stream.of("a", "b").collect(Collectors.toSet());

// Неизменяемые копии
List<String> immutable = Stream.of("a", "b").collect(Collectors.toUnmodifiableList()); // Java 10+
List<String> shorter = Stream.of("a", "b").toList();                                   // Java 16+
```

!!! warning "Ловушка: `stream.toList()` неизменяем"
    `stream.toList()` возвращает неизменяемый список: `add()` бросит `UnsupportedOperationException`. Есть и разница с `toUnmodifiableList()`: `toList()` допускает `null`-элементы, а `toUnmodifiableList()` бросит на них `NullPointerException`.

??? question "Проверь себя"
    1. Чем `Collectors.toList()` отличается от `stream.toList()`?
    2. С каких версий Java есть `toUnmodifiableList()` и `stream.toList()`?
    3. Что будет, если добавить элемент в список из `stream.toList()`?

### Чем опасен `toMap`? { #to-map }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    По умолчанию `toMap` не терпит дубликатов ключей и бросает `IllegalStateException: Duplicate key`. Если ключи могут повторяться, нужна третья функция — merge, которая решает, какое значение оставить. Ещё одна ловушка — `null` в значениях даёт `NullPointerException`.

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

!!! warning "Ловушка toMap: дубликаты"
    `toMap` по умолчанию **не терпит дубликатов ключей** и бросает `IllegalStateException: Duplicate key`. Всегда думай: могут ли ключи повториться?

!!! warning "Ловушка toMap: `null` в значениях"
    Если `valueMapper` вернёт `null`, `toMap` бросит `NullPointerException` — даже в `HashMap`, где `null`-значения разрешены. Отфильтруй такие элементы заранее или собирай через `groupingBy` / ручной `forEach`.

??? question "Проверь себя"
    1. Что произойдёт, если в `toMap` встретятся два одинаковых ключа?
    2. Как обработать дубликаты ключей в `toMap`?
    3. Можно ли через `toMap` собрать значения `null`?

### Как группировать элементы? { #grouping }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        `groupingBy` раскладывает элементы по ключу в `Map<K, List<V>>`, а вторым аргументом принимает downstream-коллектор: посчитать, собрать в `Set`, усреднить. `partitioningBy` — частный случай: делит по предикату ровно на две группы, `true` и `false`. Группировки можно вкладывать друг в друга.

=== "Подробно"

    #### `groupingBy` — группировка по ключу { #grouping-by }

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

    #### `partitioningBy` — деление на две группы { #partitioning-by }

    ```java
    // Делит на true/false по предикату
    Map<Boolean, List<User>> adultSplit = users.stream()
        .collect(Collectors.partitioningBy(u -> u.getAge() >= 18));

    List<User> adults = adultSplit.get(true);
    List<User> minors = adultSplit.get(false);
    ```

    #### Downstream-коллекторы — коллекторы внутри коллекторов { #downstream }

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

!!! warning "Ловушка: `groupingBy` и `partitioningBy` с пустыми группами"
    `partitioningBy` всегда возвращает оба ключа — `true` и `false`, даже если одна группа пуста. А `groupingBy` создаёт ключи только для встретившихся значений: `byCity.get("Paris")` вернёт `null`, а не пустой список.

??? question "Проверь себя"
    1. Что возвращает `groupingBy` без downstream-коллектора?
    2. Как посчитать количество пользователей в каждом городе?
    3. Чем `partitioningBy` отличается от `groupingBy` по булевому ключу?

### Как склеить строки из стрима? { #joining }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Через `Collectors.joining()`: с разделителем, а при желании — с префиксом и суффиксом. Внутри он использует `StringBuilder`, так что это эффективно. Элементы должны быть строками, поэтому перед `joining` обычно стоит `map`.

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

!!! warning "Ловушка: SQL через `joining`"
    Пример выше безопасен только потому, что `ids` — числа. Склеивать в SQL строки, пришедшие от пользователя, нельзя — это SQL-инъекция. Для них используй параметры запроса.

??? question "Проверь себя"
    1. Как склеить элементы стрима через запятую?
    2. Как добавить префикс и суффикс к результату `joining`?
    3. Почему опасно собирать SQL из пользовательских строк через `joining`?

## Задачи с собесов { #tasks }

### Как решать типовые задачи на стримы? { #stream-tasks }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Почти любая задача раскладывается на три шага: отфильтровать, сгруппировать или преобразовать, собрать результат нужным коллектором. Для подсчётов — `groupingBy` с `counting()`, для средних — `averagingDouble()`, для «найти или бросить» — `findFirst().orElseThrow()`. Сначала проговори цепочку словами, потом пиши код.

=== "Подробно"

    #### Топ-3 города по числу пользователей { #task-top-cities }

    ```java
    Map<String, Long> countByCity = users.stream()
        .collect(Collectors.groupingBy(User::getCity, Collectors.counting()));

    List<String> top3 = countByCity.entrySet().stream()
        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
        .limit(3)
        .map(Map.Entry::getKey)
        .collect(Collectors.toList());
    ```

    #### Средняя зарплата по отделу { #task-avg-salary }

    ```java
    Map<String, Double> avgSalaryByDept = employees.stream()
        .collect(Collectors.groupingBy(
            Employee::getDepartment,
            Collectors.averagingDouble(Employee::getSalary)
        ));
    ```

    #### Первый пользователь старше 30 или исключение { #task-find-or-throw }

    ```java
    User older = users.stream()
        .filter(u -> u.getAge() > 30)
        .findFirst()
        .orElseThrow(() -> new UserNotFoundException("No users older than 30"));
    ```

    #### Все теги из всех постов — уникальные и отсортированные { #task-unique-tags }

    ```java
    List<String> tags = posts.stream()
        .flatMap(post -> post.getTags().stream())
        .distinct()
        .sorted()
        .collect(Collectors.toList());
    ```

    #### Разбить список на активных и неактивных { #task-partition-active }

    ```java
    Map<Boolean, List<User>> split = users.stream()
        .collect(Collectors.partitioningBy(User::isActive));

    List<User> active   = split.get(true);
    List<User> inactive = split.get(false);
    ```

!!! warning "Ловушка: `comparingByValue().reversed()` без типа"
    `Map.Entry.comparingByValue().reversed()` без явных типов не скомпилируется: после `.reversed()` компилятор не может вывести типы. Поэтому в примере стоит `Map.Entry.<String, Long>comparingByValue()` — или используй `Collections.reverseOrder(Map.Entry.comparingByValue())`.

??? question "Проверь себя"
    1. Как найти топ-3 города по числу пользователей?
    2. Как посчитать среднюю зарплату по каждому отделу?
    3. Зачем в `comparingByValue()` явно указывать типы?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Stream** | Не структура данных, а конвейер: источник → промежуточные → терминальная |
| **Ленивость** | Промежуточные операции не выполняются без терминальной; стрим одноразовый |
| **`map` / `flatMap`** | Один к одному / один ко многим со склейкой |
| **Порядок** | Вертикально: элемент проходит весь конвейер; `filter` — пораньше |
| **Short-circuiting** | `limit`, `takeWhile`, `anyMatch`, `findFirst`, `findAny` |
| **Примитивные стримы** | `IntStream` и др.: без упаковки, есть `sum`, `average`, `summaryStatistics` |
| **`parallelStream()`** | Только для больших CPU-bound задач без общего состояния и после замера; общий `commonPool()` |
| **Сбор в коллекцию** | `toUnmodifiableList()` — Java 10, `stream.toList()` — Java 16, оба неизменяемы |
| **`toMap`** | Дубликат ключа → `IllegalStateException`; `null` в значении → NPE |
| **Группировка** | `groupingBy` + downstream; `partitioningBy` — всегда два ключа |

<!-- --8<-- [end:cheatsheet] -->
