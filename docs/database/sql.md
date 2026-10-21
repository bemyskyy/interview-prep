---
tags:
  - Junior
  - Middle
  - Базы данных
---

# SQL и индексы

Индексы, основные конструкции SQL и нормализация на примере PostgreSQL. На собесе чаще всего спрашивают, как индекс ускоряет поиск и когда он не работает, как читать `EXPLAIN ANALYZE`, `WHERE` против `HAVING`, оконные функции и нормальные формы. Транзакции, изоляция и MVCC — на странице [Транзакции и MVCC](transactions.md).

## Индексы { #indexes }

### Как индекс ускоряет поиск? { #how-index }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    Без индекса БД делает Sequential Scan — читает строки таблицы подряд. Индекс — отдельная структура данных, по умолчанию B-Tree, которая находит строку за O(log N). Индексы бывают составные, уникальные и частичные.

Без индекса — **Sequential Scan**: PostgreSQL читает каждую строку таблицы до первого совпадения. На таблице в 10 млн строк `SELECT * WHERE email = 'a@b.com'` занимает секунды. С индексом — **Index Scan**: структура данных (B-Tree по умолчанию) позволяет найти строку за `O(log N)`.

```sql
-- Создать индекс
CREATE INDEX idx_users_email ON users(email);

-- Составной индекс (порядок колонок важен!)
CREATE INDEX idx_habits_user_status ON habits(user_id, status);

-- Уникальный индекс
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- Частичный индекс (только для части строк)
CREATE INDEX idx_active_habits ON habits(user_id) WHERE status = 'ACTIVE';
```

Расплата за индекс — место на диске и замедление записи: каждый `INSERT` или `UPDATE` обновляет и индекс.

!!! warning "Ловушка: порядок колонок в составном индексе"
    Индекс `(user_id, status)` помогает запросам по `user_id` и по `user_id + status`, а запросу только по `status` — как правило, нет: B-Tree отсортирован сначала по первой колонке.

??? question "Проверь себя"
    1. Что такое Sequential Scan?
    2. За какое время B-Tree находит строку?
    3. Что такое частичный индекс?

### Какие типы индексов есть в PostgreSQL? { #index-types }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    B-Tree — по умолчанию, для равенства, диапазонов и сортировки. Hash — только равенство. GIN — массивы, JSONB и полнотекстовый поиск, GiST — геометрия и диапазоны, BRIN — огромные таблицы с физически упорядоченными данными вроде логов.

| Тип | Когда использовать |
|---|---|
| **B-Tree** (умолчание) | `=`, `<`, `>`, `BETWEEN`, `LIKE 'prefix%'`, сортировка |
| **Hash** | Только `=`. Быстрее B-Tree для точного поиска, но не журналируется (осторожно) |
| **GIN** | Массивы, JSONB, полнотекстовый поиск (`@>`, `&&`, `@@`) |
| **GiST** | Геометрия, диапазоны (`tsrange`, `int4range`) |
| **BRIN** | Очень большие таблицы с физически упорядоченными данными (логи, временные ряды) |

!!! warning "Ловушка: B-Tree для JSONB"
    Обычный B-Tree по колонке JSONB не ускорит поиск по содержимому документа (`@>`). Для этого нужен GIN.

??? question "Проверь себя"
    1. Какой индекс создаётся по умолчанию и для каких операций он подходит?
    2. Какой индекс нужен для поиска по JSONB?
    3. Для каких таблиц подходит BRIN?

### Когда индекс не помогает? { #index-not-used }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Когда над колонкой стоит функция, когда `LIKE` начинается с wildcard, при неявном приведении типов и при низкой селективности — если значений мало, планировщик выберет Sequential Scan. Для функции лечится функциональным индексом, для поиска по подстроке — полнотекстовым поиском или GIN с `pg_trgm`.

```sql
-- ❌ Функция над колонкой — индекс не используется
SELECT * FROM users WHERE LOWER(email) = 'alice@mail.com';
-- ✅ Решение: функциональный индекс
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- ❌ LIKE с wildcard в начале
SELECT * FROM users WHERE name LIKE '%alice%';
-- ✅ Решение: полнотекстовый поиск или GIN-индекс с pg_trgm

-- ❌ Неявное приведение типов
SELECT * FROM users WHERE id = '123'; -- id integer, '123' text

-- ❌ Низкая селективность (мало уникальных значений)
-- Индекс на поле status со значениями ACTIVE/INACTIVE бесполезен на большой таблице
-- Плановщик предпочтёт Sequential Scan
```

!!! warning "Ловушка: индекс на поле со статусом"
    Индекс по колонке с двумя-тремя значениями на большой таблице планировщик проигнорирует: читать половину таблицы через индекс дороже, чем подряд. Для таких случаев подходит частичный индекс по редкому значению.

??? question "Проверь себя"
    1. Почему `WHERE LOWER(email) = ...` не использует обычный индекс?
    2. Как ускорить `LIKE '%alice%'`?
    3. Почему индекс по полю `status` часто бесполезен?

### Как читать `EXPLAIN ANALYZE`? { #explain }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    `EXPLAIN` показывает план запроса с оценками планировщика, а `ANALYZE` реально выполняет запрос и добавляет фактическое время и число строк. Смотрят на тип сканирования — Seq Scan, Index Scan, Bitmap Scan — и тип соединения — Hash Join или Nested Loop.

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(h.id)
FROM users u
LEFT JOIN habits h ON h.user_id = u.id
WHERE u.city = 'Almaty'
GROUP BY u.name;
```

| Что в выводе | Что значит |
|---|---|
| `Seq Scan` | Нет индекса, или планировщик решил, что он не выгоден |
| `Index Scan` | Используется индекс (хорошо для OLTP) |
| `Bitmap Scan` | Несколько условий, объединение нескольких индексов |
| `Hash Join` | Соединение таблиц через хэш-таблицу (быстро для больших объёмов) |
| `Nested Loop` | Для каждой строки внешней таблицы — поиск во внутренней |
| `cost=0.00..100` | Оценка планировщика (приблизительно) |
| `actual time` | Реальное время выполнения (с `ANALYZE`) |
| `rows` | Реальное количество строк |

!!! warning "Ловушка: `EXPLAIN ANALYZE` выполняет запрос"
    С `ANALYZE` запрос выполняется по-настоящему. `EXPLAIN ANALYZE DELETE ...` удалит данные — такие запросы оборачивают в `BEGIN; ... ROLLBACK;`.

??? question "Проверь себя"
    1. Чем `EXPLAIN` отличается от `EXPLAIN ANALYZE`?
    2. Что означает `Seq Scan` в плане?
    3. Чем `cost` отличается от `actual time`?

## SQL-запросы { #queries }

### Чем отличаются виды `JOIN`? { #joins }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    `INNER JOIN` возвращает только строки, у которых есть совпадение в обеих таблицах. `LEFT JOIN` возвращает все строки левой таблицы, а для строк без совпадения подставляет `NULL` в колонки правой. Через `LEFT JOIN` и `WHERE ... IS NULL` ищут строки без пары.

```sql
-- INNER JOIN — только совпадающие строки
SELECT u.name, h.name AS habit
FROM users u
INNER JOIN habits h ON h.user_id = u.id;

-- LEFT JOIN — все строки левой таблицы + совпадения из правой (NULL если нет)
SELECT u.name, COUNT(h.id) AS habit_count
FROM users u
LEFT JOIN habits h ON h.user_id = u.id
GROUP BY u.name;

-- Найти пользователей БЕЗ привычек
SELECT u.name
FROM users u
LEFT JOIN habits h ON h.user_id = u.id
WHERE h.id IS NULL;
```

!!! warning "Ловушка: `COUNT(*)` вместо `COUNT(h.id)` с `LEFT JOIN`"
    У пользователя без привычек `LEFT JOIN` даёт одну строку с `NULL`. `COUNT(*)` посчитает её как 1, а `COUNT(h.id)` — как 0, потому что `NULL` не считается.

??? question "Проверь себя"
    1. Чем `INNER JOIN` отличается от `LEFT JOIN`?
    2. Как найти пользователей без привычек?
    3. Почему в примере используется `COUNT(h.id)`, а не `COUNT(*)`?

### Чем `WHERE` отличается от `HAVING`? { #group-by }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    `WHERE` фильтрует строки до группировки, `HAVING` — группы после неё, поэтому в `HAVING` можно использовать агрегаты вроде `COUNT(*)`. Агрегатные функции — `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`; в PostgreSQL есть ещё `FILTER (WHERE ...)` для условного агрегата.

```sql
-- COUNT, SUM, AVG, MIN, MAX
SELECT
    city,
    COUNT(*)                                    AS total_users,
    AVG(age)                                    AS avg_age,
    COUNT(*) FILTER (WHERE is_active = true)    AS active_users  -- PostgreSQL синтаксис
FROM users
GROUP BY city
HAVING COUNT(*) > 10  -- фильтрация ПОСЛЕ группировки (WHERE — ДО)
ORDER BY total_users DESC
LIMIT 5;
```

!!! warning "Ловушка: агрегат в `WHERE`"
    `WHERE COUNT(*) > 10` — ошибка: в момент работы `WHERE` групп ещё нет. Условия на агрегаты пишут в `HAVING`.

??? question "Проверь себя"
    1. Когда срабатывает `WHERE`, а когда `HAVING`?
    2. Что делает `COUNT(*) FILTER (WHERE ...)`?
    3. Почему нельзя написать `WHERE COUNT(*) > 10`?

### Как работают оконные функции? { #window-functions }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    Оконная функция считает значение по набору строк, связанных с текущей, но, в отличие от `GROUP BY`, не схлопывает строки. Окно задаётся через `OVER (PARTITION BY ... ORDER BY ...)`. Типичные функции — `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `LAG` и `LEAD`.

```sql
-- ROW_NUMBER — номер строки в разделе
SELECT
    user_id,
    name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
FROM habits;

-- Получить последнюю привычку каждого пользователя
SELECT * FROM (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS rn
    FROM habits
) t WHERE rn = 1;

-- RANK vs DENSE_RANK
-- RANK: 1, 2, 2, 4 (пропускает после ничьей)
-- DENSE_RANK: 1, 2, 2, 3 (не пропускает)
SELECT name, salary,
    RANK() OVER (ORDER BY salary DESC),
    DENSE_RANK() OVER (ORDER BY salary DESC)
FROM employees;

-- LAG / LEAD — сравнение со следующей/предыдущей строкой
SELECT date, revenue,
    LAG(revenue) OVER (ORDER BY date)              AS prev_revenue,
    revenue - LAG(revenue) OVER (ORDER BY date)    AS delta
FROM daily_stats;
```

!!! warning "Ловушка: оконная функция в `WHERE`"
    `WHERE ROW_NUMBER() OVER (...) = 1` не сработает: окна вычисляются после `WHERE`. Поэтому в примере «последняя привычка» нумерация считается в подзапросе, а фильтр `rn = 1` — снаружи.

??? question "Проверь себя"
    1. Чем оконная функция отличается от `GROUP BY`?
    2. Чем `RANK` отличается от `DENSE_RANK`?
    3. Как получить последнюю запись для каждого пользователя?

### Что такое CTE? { #cte }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    CTE (Common Table Expression) — именованный подзапрос в блоке `WITH`, который читается сверху вниз и делает сложный запрос понятнее. `WITH RECURSIVE` позволяет обходить иерархии: дерево категорий, оргструктуру.

```sql
-- WITH — именованный подзапрос, читается сверху вниз
WITH active_users AS (
    SELECT id, name, city
    FROM users
    WHERE is_active = true
),
user_habit_counts AS (
    SELECT user_id, COUNT(*) AS habit_count
    FROM habits
    GROUP BY user_id
)
SELECT u.name, u.city, COALESCE(uhc.habit_count, 0) AS habits
FROM active_users u
LEFT JOIN user_habit_counts uhc ON uhc.user_id = u.id
ORDER BY habits DESC;

-- Рекурсивный CTE — для иерархических данных (дерево категорий, оргструктура)
WITH RECURSIVE category_tree AS (
    SELECT id, name, parent_id, 0 AS level
    FROM categories
    WHERE parent_id IS NULL  -- корень

    UNION ALL

    SELECT c.id, c.name, c.parent_id, ct.level + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY level, name;
```

!!! warning "Ловушка: рекурсия без условия остановки"
    Рекурсивная часть должна в какой-то момент перестать возвращать строки. Если в данных есть цикл (категория — родитель самой себя через цепочку), запрос будет крутиться бесконечно.

??? question "Проверь себя"
    1. Зачем нужен CTE, если есть подзапросы?
    2. Из каких двух частей состоит рекурсивный CTE?
    3. Для каких данных нужен `WITH RECURSIVE`?

## Нормализация { #normalization }

### Что такое нормальные формы? { #normal-forms }

**Уровень:** Junior

!!! abstract "Ответ вслух"
    1НФ — атомарные значения и первичный ключ. 2НФ — неключевые поля зависят от всего составного ключа, а не от его части. 3НФ — нет транзитивных зависимостей между неключевыми полями; BCNF ещё строже: каждый детерминант — потенциальный ключ.

**1НФ (первая нормальная форма).** Все значения атомарны (не массивы, не списки через запятую). Есть первичный ключ.

```sql
-- ❌ Нарушение 1НФ
users: id=1, name="Alice", phones="79001234567, 79009876543"

-- ✅ 1НФ
users: id=1, name="Alice"
user_phones: user_id=1, phone="79001234567"
user_phones: user_id=1, phone="79009876543"
```

**2НФ.** Все неключевые поля зависят от **всего** первичного ключа (актуально для составных ключей).

**3НФ.** Нет транзитивных зависимостей: неключевое поле А не зависит от неключевого поля Б.

```sql
-- ❌ Нарушение 3НФ: city_code → city_name (транзитивная зависимость)
users: id, name, city_code, city_name

-- ✅ 3НФ
users: id, name, city_id
cities: id, code, name
```

**BCNF (нормальная форма Бойса — Кодда).** Каждый детерминант — потенциальный ключ. Строже 3НФ.

!!! warning "Ловушка: 2НФ без составного ключа"
    Если первичный ключ состоит из одной колонки, таблица в 1НФ автоматически в 2НФ: зависеть «от части ключа» нечему.

??? question "Проверь себя"
    1. Что нарушает строка `phones="79001234567, 79009876543"`?
    2. Что такое транзитивная зависимость?
    3. Чем BCNF строже 3НФ?

### Когда денормализовать? { #denormalization }

**Уровень:** Middle

!!! abstract "Ответ вслух"
    В OLTP (транзакционные системы) стремятся к 3НФ. В OLAP (аналитика, хранилища данных) намеренно денормализуют — схемы «звезда» и «снежинка», — потому что джоины дорогие, а данные читаются огромными объёмами.

| | **OLTP** | **OLAP** |
|---|---|---|
| **Что это** | Транзакционные системы | Аналитика, Data Warehouse |
| **Нормализация** | Стремимся к 3НФ | Намеренно денормализуем («звезда», «снежинка») |
| **Почему** | Целостность данных при частых записях | Джоины дорогие, данные читаются огромными объёмами |

!!! warning "Ловушка: денормализация без синхронизации"
    Дублированные данные нужно обновлять во всех местах. Без механизма синхронизации копии разъедутся, и отчёты начнут противоречить друг другу.

??? question "Проверь себя"
    1. К какой нормальной форме стремятся в OLTP?
    2. Почему в OLAP денормализуют?
    3. Что такое схема «звезда»?

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **B-Tree** | Умолчание для индексов. `=`, диапазоны, сортировка |
| **GIN** | JSONB, массивы, полнотекстовый поиск |
| **Индекс не работает** | Функция над колонкой, `LIKE '%...'`, приведение типов, низкая селективность |
| **`EXPLAIN ANALYZE`** | `Seq Scan` — нет индекса или невыгоден. `Index Scan` — хорошо |
| **`WHERE` vs `HAVING`** | До группировки / после группировки |
| **Оконные функции** | `OVER (PARTITION BY ... ORDER BY ...)`. `ROW_NUMBER`, `RANK`, `LAG` |
| **CTE** | `WITH` — читаемые подзапросы. `WITH RECURSIVE` — иерархия |
| **3НФ** | Нет транзитивных зависимостей. OLTP стремится к ней, OLAP денормализует |

<!-- --8<-- [end:cheatsheet] -->
