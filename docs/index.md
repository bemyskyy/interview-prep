# Подготовка к техническому собеседованию

Личная база знаний по Java и смежным технологиям. Здесь собрано всё, что реально спрашивают на собесах — с объяснением **почему** это работает именно так, а не просто определениями.

---

## Java

Фундамент, без которого никуда. Разбираем не поверхностно, а до уровня байт-кода, JMM и архитектурных решений.

| Тема | Что внутри |
|---|---|
| [Основы JVM](java/basics.md) | JVM/JRE/JDK, Garbage Collector, Heap & Stack, Metaspace, OOM, примитивы, String Pool, autoboxing |
| [ООП](java/oop.md) | Четыре кита, интерфейсы vs абстрактные классы, Override vs Overload, композиция vs наследование, Coupling & Cohesion |
| [Коллекции](java/collections.md) | Иерархия, ArrayList vs LinkedList, HashMap под капотом (Java 8), TreeMap, HashSet, Comparable vs Comparator, PriorityQueue, ConcurrentHashMap |
| [Исключения](java/exceptions.md) | Checked vs Unchecked, иерархия Throwable, try-with-resources, кастомные исключения, обработка в Spring |
| [Дженерики](java/generics.md) | Type Erasure, Bridge Methods, Wildcards, PECS, запреты generics, Heap Pollution, @SafeVarargs |
| [Stream API](java/streams.md) | Источники, промежуточные и терминальные операции, Collectors, groupingBy, Optional, функциональные интерфейсы, лямбды |
| [Многопоточность](java/multithreading.md) | Thread vs Runnable, JMM, happens-before, volatile, synchronized, java.util.concurrent, CompletableFuture, Virtual Threads |
| [SOLID](java/solid.md) | Все пять принципов с антипаттернами и реальными примерами на Java |
| [Паттерны проектирования](java/patterns.md) | Singleton, Builder, Factory, Decorator, Strategy, Observer — с кодом и объяснением когда применять |
| [IO / NIO](java/io-nio.md) | java.io vs java.nio, Path & Files, потоковое чтение, BufferedReader/Writer, обход директорий |

---

## Как пользоваться сайтом

**Поиск** — самый быстрый способ найти нужный термин. Нажми ++s++ или ++/++ и начни вводить: `HashMap`, `volatile`, `PECS`, `CompletableFuture` — поиск подсветит все упоминания.

**Навигация** — разделы в левом меню. Внутри каждой страницы — оглавление справа для быстрого перехода к нужному заголовку.

**Тёмная тема** — переключается кнопкой в правом верхнем углу.

---

## Что будет дальше

- [ ] Spring Boot — IoC/DI, жизненный цикл бина, транзакции, N+1
- [ ] Базы данных — SQL, индексы, JPA/Hibernate
- [ ] Алгоритмы — Big O, сортировки, структуры данных, задачи
- [ ] Системное проектирование — CAP-теорема, масштабирование, кэширование