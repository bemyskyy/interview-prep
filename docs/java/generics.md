---
tags:
  - Junior
  - Middle
  - Senior
  - Java
---

# Дженерики

Зачем нужны дженерики (generics), как работает стирание типов, wildcards и PECS, ограничения типов и запреты компилятора, raw types и heap pollution. Чаще всего спрашивают, что такое type erasure, чем `? extends` отличается от `? super`, и почему нельзя написать `new T()`.

## Основы { #basics }

### Зачем нужны дженерики? { #why-generics }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    До Java 5 коллекции хранили `Object`: можно было положить в список строк число, при чтении нужен был ручной каст, а ошибка вылезала как `ClassCastException` уже в рантайме. Дженерики дают проверку типов на этапе компиляции: в `List<String>` не положить `Integer`, а каст при чтении не нужен.

До Java 5 (2004 год) любая коллекция хранила просто `Object`. Это порождало три проблемы:

1. Можно было случайно положить в список строк число — компилятор молчал.
2. При чтении **всегда** нужен был ручной каст: `String s = (String) list.get(0);`
3. Неправильный каст приводил к `ClassCastException` в рантайме — уже в продакшене.

**Решение — дженерики:** строгая типизация на этапе компиляции (compile-time type safety). Пишешь `List<String>` — компилятор не пустит туда `Integer`. Ручные касты не нужны, ошибки находятся до запуска.

```java
List raw = new ArrayList();      // до Java 5
raw.add("текст");
raw.add(42);                     // компилятор молчит
String s = (String) raw.get(1);  // ClassCastException в рантайме

List<String> typed = new ArrayList<>();
typed.add("текст");
// typed.add(42);                // ❌ ошибка компиляции
String t = typed.get(0);         // каст не нужен
```

!!! warning "Ловушка: дженерики защищают только при компиляции"
    Проверки дженериков работают в компиляторе. Если обойти их через raw type или каст, в рантайме JVM уже не поймает несоответствие типов в момент записи — ошибка вылезет позже, при чтении. Подробнее — в [Heap Pollution](#heap-pollution).

??? question "Проверь себя"
    1. Какие три проблемы были у коллекций до Java 5?
    2. На каком этапе дженерики ловят ошибки типов?
    3. Нужен ли каст при чтении из `List<String>`?

### Что такое стирание типов? { #type-erasure }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    JVM ничего не знает о дженериках: после компиляции `List<String>` и `List<Integer>` — один и тот же класс `List`. Компилятор проверяет типы, заменяет параметры на их верхнюю границу (обычно `Object`) и сам вставляет касты при чтении. Так сделали ради полной обратной совместимости с кодом до Java 5.

Главный сюрприз: **JVM понятия не имеет о дженериках.** Для неё нет разницы между `List<String>` и `List<Integer>`, в скомпилированном байт-коде угловых скобок нет. Дженерики существуют **только в исходном коде — для компилятора**.

Что делает компилятор при сборке:

1. Проверяет, что ты не положил число в список строк.
2. **Стирает** все `<String>` и `<T>`. Параметры типа заменяются верхней границей (если ограничений нет — `Object`).
3. Там, где ты достаёшь элемент, **сам вставляет каст**: `String s = (String) list.get(0);`.

То есть скомпилированный код с дженериками выглядит **так же, как код Java 1.4**.

```java
List<String> strings = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();

System.out.println(strings.getClass() == numbers.getClass()); // true: в рантайме это один класс ArrayList
```

!!! info "Почему не сделали как в C#?"
    Интервьюер спросит: _"Почему JVM не научили понимать дженерики?"_ Ответ: **ради 100% обратной совместимости.** Новый код на Java 5 должен был работать со старыми библиотеками, скомпилированными на Java 1.4. Компромисс удачный, но за него расплачиваются до сих пор — все запреты ниже растут из стирания.

!!! warning "Ловушка: `instanceof List<String>`"
    Проверить параметр типа в рантайме нельзя: `obj instanceof List<String>` не скомпилируется, если тип `obj` не гарантирует, что это список строк. Можно проверить только `obj instanceof List<?>`.

??? question "Проверь себя"
    1. Что происходит с `<T>` при компиляции?
    2. Чему равно `new ArrayList<String>().getClass() == new ArrayList<Integer>().getClass()`?
    3. Почему дженерики в Java реализованы через стирание?

### Что такое bridge-методы? { #bridge-methods }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    Из-за стирания переопределённый метод с конкретным типом в наследнике перестаёт совпадать по сигнатуре с методом родителя — вместо override получается overload. Компилятор молча добавляет в наследника мостовой метод с сигнатурой родителя, который делает каст и вызывает настоящий метод. Увидеть его можно через `javap`.

Из-за стирания типов при наследовании возникает проблема, которая ломает полиморфизм.

```java
public class Node<T> {
    public void setData(T data) { }
}

public class MyNode extends Node<Integer> {
    @Override
    public void setData(Integer data) { }
}
```

После стирания типов методы превращаются в:

- родитель: `public void setData(Object data)`;
- наследник: `public void setData(Integer data)`.

Сигнатуры перестали совпадать: вместо override получилась перегрузка, полиморфизм сломан.

**Как компилятор спасает ситуацию:** он молча генерирует в `MyNode` невидимый **мостовой метод (bridge method)**:

```java
// Твой метод
public void setData(Integer data) { }

// СГЕНЕРИРОВАННЫЙ КОМПИЛЯТОРОМ — в исходниках его нет
public void setData(Object data) {
    this.setData((Integer) data); // делегирует твоему методу с кастом
}
```

Благодаря bridge-методу сигнатура родителя корректно переопределяется, полиморфизм работает. Увидеть его можно дизассемблером:

```bash
javap -p MyNode.class
# public void setData(java.lang.Integer);
# public void setData(java.lang.Object);   ← bridge-метод
```

!!! warning "Ловушка: каст в bridge-методе"
    Bridge-метод делает каст. Если через raw type передать в `MyNode` строку — `((Node) myNode).setData("текст")` — получишь `ClassCastException` внутри метода, которого нет в исходниках. В стектрейсе он выглядит как обычный `MyNode.setData` со ссылкой на строку объявления класса — это и есть подсказка, что упал bridge-метод.

??? question "Проверь себя"
    1. Почему без bridge-метода переопределение `setData(Integer)` превратилось бы в перегрузку?
    2. Что делает bridge-метод?
    3. Как увидеть bridge-метод в скомпилированном классе?

## Wildcards { #wildcards }

### Что значит `? extends T`? { #extends }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `List<? extends Animal>` — список `Animal` или любого его наследника, но какого именно — неизвестно. Читать из него можно: что бы там ни лежало, это `Animal`. Писать нельзя (кроме `null`): под этой маской может оказаться `List<Cat>`, и собака в нём была бы ошибкой.

_"Этот список хранит объекты класса `T` или любого его наследника — но я не знаю, какого именно."_ Это ковариантность (upper bound).

- В параметр `List<? extends Animal>` можно передать `List<Dog>`, `List<Cat>`, `List<Animal>`.
- **МОЖНО читать:** кто бы там ни лежал, он точно `Animal`.
- **НЕЛЬЗЯ писать:** под маской `List<? extends Animal>` могут передать `List<Cat>`. Если добавить `new Dog()`, собака окажется среди котов. Компилятор запрещает `add()` для любых элементов, кроме `null`.

```java
static void feedAll(List<? extends Animal> animals) {
    for (Animal a : animals) {   // ✅ читать безопасно
        a.makeSound();
    }
    // animals.add(new Dog());   // ❌ ошибка компиляции: вдруг это List<Cat>
}

feedAll(List.of(new Dog()));     // List<Dog> подходит
feedAll(List.of(new Cat()));     // List<Cat> тоже
```

!!! warning "Ловушка: `List<Dog>` — не `List<Animal>`"
    Дженерики инвариантны: `List<Dog>` нельзя передать в параметр `List<Animal>`, хотя `Dog` — наследник `Animal`. Иначе в него можно было бы добавить `Cat`. Нужна ковариантность — пиши `List<? extends Animal>`.

??? question "Проверь себя"
    1. Какие списки можно передать в параметр `List<? extends Animal>`?
    2. Почему в `List<? extends Animal>` нельзя добавить `Dog`?
    3. Можно ли передать `List<Dog>` в параметр `List<Animal>`?

### Что значит `? super T`? { #super }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `List<? super Dog>` — список `Dog` или любого его предка вплоть до `Object`. Писать в него `Dog` можно всегда: собаку можно положить и в список собак, и в список животных, и в список объектов. А читать можно только как `Object`: там может лежать что угодно.

_"Этот список хранит объекты класса `T` или любого его предка (вплоть до `Object`)."_ Это контравариантность (lower bound).

- В параметр `List<? super Dog>` можно передать `List<Dog>`, `List<Animal>`, `List<Object>`.
- **МОЖНО писать:** в список собак, животных или объектов собаку можно положить в любом случае.
- **НЕЛЬЗЯ читать** как `Dog` или `Animal`: под маской `List<? super Dog>` могли передать `List<Object>`, где лежат стулья, машины и коты. Читать можно только как `Object obj = list.get(0)`.

```java
static void addDogs(List<? super Dog> shelter) {
    shelter.add(new Dog());             // ✅ писать Dog безопасно
    Object first = shelter.get(0);      // читать — только как Object
    // Dog dog = shelter.get(0);        // ❌ ошибка компиляции: там может быть не Dog
}

addDogs(new ArrayList<Animal>());       // List<Animal> подходит
addDogs(new ArrayList<Object>());       // и List<Object> тоже
```

!!! warning "Ловушка: `super` не про чтение"
    Если метод должен и читать, и писать элементы конкретного типа, wildcard не нужен — нужен обычный параметр `List<T>`. Wildcards — для методов, которые с коллекцией делают что-то одно.

??? question "Проверь себя"
    1. Какие списки можно передать в параметр `List<? super Dog>`?
    2. Почему из `List<? super Dog>` можно читать только `Object`?
    3. Что выбрать, если метод и читает, и пишет элементы?

### Чем `List<?>` отличается от `List<Object>`? { #wildcard-vs-object }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `List<Object>` — конкретный тип: в него можно и писать, и читать, но передать туда `List<String>` нельзя из-за инвариантности. `List<?>` — список неизвестно чего: туда можно передать любой список, но добавить ничего нельзя, кроме `null`.

- `List<Object>` строго типизирован: можно и читать, и писать. Но передать туда `List<String>` нельзя (инвариантность).
- `List<?>` — сокращение для `List<? extends Object>`. Можно передать `List<String>` или `List<Integer>`, но добавить ничего нельзя (кроме `null`) — компилятор не знает конкретного типа.

```java
static int countAll(List<?> anything) {       // примет любой список
    // anything.add("x");                      // ❌ ошибка компиляции: тип элементов неизвестен
    return anything.size();
}

static void addMarker(List<Object> objects) {
    objects.add("маркер");                     // ✅ в List<Object> писать можно
}

countAll(List.of("a", "b"));                   // ✅
countAll(List.of(1, 2, 3));                    // ✅
// addMarker(new ArrayList<String>());         // ❌ ошибка компиляции: List<String> — не List<Object>
```

!!! warning "Ловушка: `List<?>` не равен raw `List`"
    `List<?>` безопасен: компилятор запрещает писать в него. Сырой `List` проверку отключает вовсе — туда можно положить что угодно и получить `ClassCastException` позже. Подробнее — в [Raw Types](#raw).

??? question "Проверь себя"
    1. Можно ли передать `List<String>` в параметр `List<Object>`? А в `List<?>`?
    2. Что можно добавить в `List<?>`?
    3. Чем `List<?>` безопаснее сырого `List`?

### Что такое PECS? { #pecs }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    PECS — Producer Extends, Consumer Super: если коллекция в методе только отдаёт данные — ты из неё читаешь, — это producer, пиши `? extends T`. Если только принимает — ты в неё пишешь, — это consumer, пиши `? super T`. Пример из JDK — `Collections.copy(List<? super T> dest, List<? extends T> src)`.

Джошуа Блох (_Effective Java_) вывел мнемонику, которую спрашивают на каждом мидл-интервью.

!!! tip "PECS — Producer Extends, Consumer Super"
    Задай себе вопрос: **что коллекция делает в этом методе?**

    - **Producer (поставщик данных) → `? extends T`** — коллекция только выдаёт данные, ты из неё читаешь.
    - **Consumer (потребитель данных) → `? super T`** — коллекция только принимает данные, ты в неё пишешь.

**Пример из JDK** — метод `Collections.copy()`:

```java
public static <T> void copy(List<? super T> dest, List<? extends T> src) {
    for (int i = 0; i < src.size(); i++) {
        dest.set(i, src.get(i));   // читаем из producer, пишем в consumer
    }
}
```

- `src` (откуда копируем) — **producer**, только читаем → `extends`.
- `dest` (куда копируем) — **consumer**, только пишем → `super`.

!!! warning "Ловушка: wildcard в возвращаемом типе"
    PECS — про параметры методов. Возвращать `List<? extends T>` не стоит: вызывающему коду придётся работать с wildcard-типом, в который нельзя писать. Возвращай конкретный тип.

??? question "Проверь себя"
    1. Как расшифровывается PECS?
    2. Почему в `Collections.copy()` у `src` стоит `extends`, а у `dest` — `super`?
    3. Стоит ли использовать wildcards в возвращаемых типах?

## Ограничения типов { #bounds }

### Как ограничить параметр типа? { #upper-bound }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Через `<T extends SomeClass>`: тогда `T` — этот класс или его наследник, и у `T` можно вызывать его методы. Можно перечислить несколько ограничений через `&`: один класс и любое число интерфейсов, причём класс обязан стоять первым.

#### Upper bound — `<T extends SomeClass>` { #bounded-type }

Ограничим тип так, чтобы он был определённым классом или его наследником:

```java
// Только сущности с полем id — никаких произвольных классов
public class BaseRepository<T extends BaseEntity> {

    public T findById(Long id) {
        return null; // поиск в хранилище
    }

    public void save(T entity) {
        System.out.println("Saving entity with id: " + entity.getId()); // безопасно!
    }
}
```

Без ограничения `T extends BaseEntity` компилятор не дал бы вызвать `entity.getId()` — он не знал бы, что у `T` есть такой метод.

#### Множественные ограничения (multiple bounds) { #multiple-bounds }

Тип можно ограничить сразу несколькими интерфейсами и одним классом:

```java
// T обязан быть Animal И реализовывать Serializable И Comparable
public <T extends Animal & Serializable & Comparable<T>> void process(T entity) {
    entity.makeSound();
}
```

!!! warning "Ловушка: порядок в multiple bounds"
    Если среди ограничений есть **класс** (не интерфейс), он **обязан стоять первым**. Иначе — ошибка компиляции.

    ```java
    <T extends Animal & Serializable> void ok(T t) { }       // ✅ класс первый
    // <T extends Serializable & Animal> void bad(T t) { }   // ❌ ошибка компиляции
    ```

??? question "Проверь себя"
    1. Что даёт ограничение `<T extends BaseEntity>`?
    2. Сколько классов и интерфейсов можно указать в multiple bounds?
    3. Почему `<T extends Serializable & Animal>` не компилируется?

### Что такое generic-метод? { #generic-methods }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Это метод со своим параметром типа, объявленным перед возвращаемым типом: `<T> T max(T a, T b)`. Параметр живёт только в этом методе, а класс может быть обычным. Тип компилятор обычно выводит сам по аргументам.

Параметр типа можно задать не на уровне класса, а на уровне отдельного метода:

```java
public class Utils {
    // <T> перед возвращаемым типом — объявление параметра типа метода
    public static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }
}

// Компилятор сам выводит тип:
String s = Utils.max("apple", "banana");   // T = String
Integer i = Utils.max(10, 42);             // T = Integer
```

!!! warning "Ловушка: где объявляется `<T>`"
    `<T>` пишется **перед** возвращаемым типом: `public static <T> T max(...)`. Запись `public static T max(...)` без объявления — ошибка компиляции, если `T` не объявлен на уровне класса.

??? question "Проверь себя"
    1. Где объявляется параметр типа generic-метода?
    2. Как компилятор определяет `T` при вызове `Utils.max("apple", "banana")`?
    3. Может ли generic-метод быть в обычном, не generic-классе?

## Запреты дженериков { #restrictions }

### Чего нельзя делать с дженериками? { #generics-restrictions }

**Уровень:** Middle

=== "Коротко"

    !!! abstract "Ответ вслух"
        Все запреты растут из стирания типов: нельзя `new T()`, нельзя создать массив `new T[]` или `new List<String>[]`, нельзя использовать примитивы вроде `List<int>` и нельзя объявить статическое поле типа `T`. В рантайме конкретного `T` просто нет.

=== "Подробно"

    Интервьюеры любят давать куски кода и спрашивать: _"Скомпилируется ли это? Если нет — почему?"_

    #### Нельзя создать экземпляр `new T()` { #no-new-t }

    ```java
    public class Box<T> {
        public T create() {
            return new T(); // ❌ ОШИБКА КОМПИЛЯЦИИ
        }
    }
    ```

    **Почему:** после стирания `T` превращается в `Object`, и компилятор не знает, какой конструктор вызывать. А если у конкретного `T` нет конструктора без аргументов?

    **Решение — `Supplier` или рефлексия:**

    ```java
    public static <T> T create(Supplier<T> supplier) {
        return supplier.get(); // ✅
    }

    // Использование:
    String empty = create(String::new);              // ""
    List<String> list = create(ArrayList::new);      // пустой ArrayList
    ```

    #### Нельзя создать массив generic-типа { #no-generic-arrays }

    ```java
    static <T> void arrays() {
        T[] arr = new T[10];                       // ❌ ошибка компиляции
        List<String>[] lists = new List<String>[10]; // ❌ ошибка компиляции
    }
    ```

    **Почему:** массивы в Java проверяют тип элементов в рантайме (они **ковариантны**: `String[]` — это `Object[]`). Но в рантайме `T` уже стёрт до `Object`, и JVM не смогла бы проверить, что в массив кладут нужный тип.

    **Решение:**

    ```java
    @SuppressWarnings("unchecked")
    static <T> T[] newArray(int size) {
        return (T[]) new Object[size];               // обходной путь через каст
    }

    @SuppressWarnings("unchecked")
    static <T> T[] newArray(Class<T> clazz, int size) {
        return (T[]) Array.newInstance(clazz, size); // через рефлексию — настоящий массив нужного типа
    }

    @SuppressWarnings("unchecked")
    List<String>[] lists = new List[10];             // сырой тип: компилируется, но с unchecked-предупреждением
    ```

    #### Нельзя использовать примитивы { #no-primitives }

    ```java
    List<int> numbers = new ArrayList<>();    // ❌ ошибка компиляции
    List<double> prices = new ArrayList<>();  // ❌ ошибка компиляции
    ```

    **Почему:** после стирания параметр превращается в `Object`, а примитивы (`int`, `double`) не объекты и не наследуют `Object`. JVM не может положить `int` туда, где ожидается ссылка.

    **Решение — классы-обёртки:**

    ```java
    List<Integer> numbers = new ArrayList<>(); // ✅ автоупаковка сделает остальное
    ```

    Именно поэтому существуют `Integer`, `Double`, `Long` и другие обёртки — они позволяют примитивам жить в дженерик-коллекциях. Подробнее — в [Основы языка → автоупаковка](basics.md#autoboxing).

    #### Нельзя делать статические поля типа `T` { #no-static-t }

    ```java
    public class Holder<T> {
        private static T instance; // ❌ ошибка компиляции
    }
    ```

    **Почему:** статическое поле одно на весь класс, а `Holder<String>` и `Holder<Integer>` — один и тот же класс в байт-коде. Какой тип должен быть у `instance` — `String` или `Integer`? Противоречие нерешаемо.

!!! warning "Ловушка: `(T[]) new Object[size]` наружу"
    Каст `(T[]) new Object[size]` безопасен, только пока массив не уходит за пределы класса. Если вернуть его вызывающему коду, который ждёт `String[]`, получишь `ClassCastException`: на самом деле это `Object[]`. Для массива нужного типа используй `Array.newInstance(clazz, size)`.

??? question "Проверь себя"
    1. Почему нельзя написать `new T()` и как обойти это ограничение?
    2. Почему нельзя создать `new List<String>[10]`?
    3. Почему нельзя объявить `static T instance`?

## Raw types и heap pollution { #raw-types }

### Почему raw types опасны? { #raw }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Raw type — дженерик-класс без угловых скобок, например `List` вместо `List<String>`. Для такой переменной компилятор отключает проверку типов, и ошибки снова переезжают в рантайм. Raw types существуют только ради совместимости с кодом до Java 5 и на ревью считаются красным флагом.

Raw type — использование дженерик-класса **без угловых скобок** в современном коде:

```java
List list = new ArrayList();  // ❌ raw type — компилятор выдаёт предупреждение
list.add("Текст");
list.add(42);

String s = (String) list.get(1); // ClassCastException в рантайме!
```

Компилятор видит `List` без типа и «отключает» для него проверку типов. Ошибки снова переезжают в рантайм.

!!! warning "Raw types в современном коде"
    Raw types существуют только для совместимости с кодом до Java 5. В новом коде их использование — **красный флаг на код-ревью**. Если видишь raw type без `@SuppressWarnings("rawtypes")` и объяснения — это баг.

??? question "Проверь себя"
    1. Что такое raw type?
    2. Что происходит с проверкой типов для raw-переменной?
    3. Зачем raw types оставили в языке?

### Что такое heap pollution? { #heap-pollution }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    Это ситуация, когда переменная дженерик-типа ссылается на объект, не совместимый с её параметром: например, в `List<String>` через raw-ссылку положили `Integer`. Компилятор лишь предупреждает, а падает программа позже — `ClassCastException` при чтении, в совсем другом месте.

Heap pollution (загрязнение кучи) — ситуация, когда переменная дженерик-типа ссылается на объект, **не совместимый с её параметром типа**. Возникает при смешивании raw types и дженериков:

```java
List<String> strings = new ArrayList<>();
List rawList = strings;          // raw type — компилятор предупреждает, но пускает
rawList.add(42);                 // добавляем Integer в List<String>!

String s = strings.get(0);       // ClassCastException в рантайме — куча «загрязнена»
```

Особенно коварна ситуация с **varargs и дженериками** — о ней в [`@SafeVarargs`](#safevarargs).

!!! warning "Ловушка: исключение далеко от причины"
    `ClassCastException` вылетает не в строке `rawList.add(42)`, а там, где элемент читают — возможно, в другом модуле и через час. Поэтому unchecked-предупреждения компилятора нельзя игнорировать.

??? question "Проверь себя"
    1. Что такое heap pollution?
    2. Где именно вылетит исключение в примере выше?
    3. Почему unchecked-предупреждения нельзя игнорировать?

### Когда ставить `@SafeVarargs`? { #safevarargs }

**Уровень:** Senior

!!! abstract "Ответ вслух"
    Varargs — это массив, а массив дженериков создать безопасно нельзя, поэтому компилятор предупреждает о возможном heap pollution. `@SafeVarargs` — обещание, что метод только читает varargs-массив и не отдаёт его наружу. Ставится только на `static`, `final` или `private` методы и конструкторы.

Varargs под капотом — массив. А массив дженериков безопасно создать нельзя (см. [запреты](#generics-restrictions)). Поэтому компилятор предупреждает о такой комбинации:

```java
public static <T> void addAll(List<T> list, T... elements) { // ⚠️ unchecked-предупреждение
    for (T e : elements) list.add(e);
}
```

Компилятор создаёт для `elements` массив стёртого типа — и через него в метод может попасть значение не того типа.

Аннотация `@SafeVarargs` — твоё обещание компилятору: _"Varargs-массив внутри метода используется только для чтения и не передаётся наружу. Heap pollution невозможен."_

```java
@SafeVarargs // ✅ глушим предупреждение — метод действительно безопасен
public static <T> List<T> listOf(T... elements) {
    return Arrays.asList(elements); // только читаем — безопасно
}
```

!!! warning "Когда НЕ ставить `@SafeVarargs`"
    Если varargs-массив **возвращается**, **передаётся в другой метод** или **сохраняется в поле**, ставить аннотацию нельзя. Это ложь компилятору, которая обернётся `ClassCastException` в рантайме.

    ```java
    @SafeVarargs // ❌ ОПАСНО — отдаём массив наружу
    static <T> T[] toArray(T... elements) {
        return elements;
    }

    static <T> T[] pickTwo(T a, T b) {
        return toArray(a, b); // здесь T стёрт → создастся Object[]
    }

    String[] pair = pickTwo("a", "b"); // ClassCastException: Object[] не String[]
    ```

??? question "Проверь себя"
    1. Почему компилятор предупреждает о generic varargs?
    2. Что обещает `@SafeVarargs`?
    3. Почему `pickTwo("a", "b")` падает с `ClassCastException`?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **Зачем дженерики** | Проверка типов при компиляции, без ручных кастов |
| **Type erasure** | JVM не знает о дженериках: `List<String>` и `List<Integer>` в байт-коде одинаковы |
| **Bridge-метод** | Компилятор генерирует его для сохранения полиморфизма; виден через `javap -p` |
| **`? extends T`** | Читать можно, писать нельзя — producer |
| **`? super T`** | Писать можно, читать только как `Object` — consumer |
| **`List<?>` vs `List<Object>`** | Любой список, но без записи vs конкретный тип с записью, но инвариантный |
| **PECS** | Producer Extends, Consumer Super — правило Джошуа Блоха |
| **Bounds** | `<T extends A & B>` — класс первым, интерфейсы потом |
| **Запреты** | Нет `new T()`, `new T[]`, `List<int>`, `static T` — всё из-за стирания |
| **Raw types** | Дженерик без `<T>` отключает проверку типов — красный флаг на ревью |
| **Heap pollution** | Дженерик-переменная ссылается на несовместимый объект → `ClassCastException` при чтении |
| **`@SafeVarargs`** | Только если varargs-массив не уходит наружу; только `static`, `final`, `private` |

<!-- --8<-- [end:cheatsheet] -->
