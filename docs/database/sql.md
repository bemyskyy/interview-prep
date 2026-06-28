# SQL и Базы данных

## ACID — гарантии транзакций

Базовая единица работы с БД — **транзакция**: набор SQL-запросов, выполняемых как единое целое (списать деньги → зачислить). ACID — четыре гарантии надёжности.

### A — Atomicity (Атомарность)

**"Всё или ничего."** Если транзакция обрывается посередине — все уже выполненные шаги откатываются. Частичного сохранения быть не может.

```sql
BEGIN;
UPDATE accounts SET balance = balance - 1000 WHERE id = 1; -- списали
UPDATE accounts SET balance = balance + 1000 WHERE id = 2; -- зачислили
-- Если второй UPDATE упал — первый тоже откатится
COMMIT;
```

Связь со Spring: `@Transactional` → `RuntimeException` → `ROLLBACK`, успех → `COMMIT`.

### C — Consistency (Консистентность)

**Переход строго от одного валидного состояния к другому.** БД не даст зафиксировать изменения, нарушающие правила (Constraints, Foreign Keys, типы данных).

```sql
ALTER TABLE accounts ADD CONSTRAINT balance_positive CHECK (balance >= 0);
-- Попытка увести баланс в минус вызовет ошибку и откат транзакции
```

### I — Isolation (Изоляция)

**Параллельные транзакции не должны мешать друг другу.** Защищает от Race Condition.

Трейд-офф: выше изоляция → надёжнее данные, ниже пропускная способность.

Связь со Spring: `@Transactional(isolation = Isolation.REPEATABLE_READ)`.

### D — Durability (Долговечность)

**Закоммичено = сохранено навсегда**, даже при сбое питания.

**Под капотом — WAL (Write-Ahead Log):** все изменения сначала пишутся в лог-файл на диске, потом применяются к таблицам. При сбое БД восстанавливается по этому логу.

## Аномалии чтения

Три проблемы, которые возникают при параллельных транзакциях без изоляции:

**1. Dirty Read (Грязное чтение)** — транзакция А читает данные, которые Б изменила, но **ещё не закоммитила**. Б делает rollback → А работала с несуществующими данными.

**2. Non-repeatable Read (Неповторяющееся чтение)** — проблема **одной строки**. А читает строку дважды в рамках одной транзакции, но между чтениями Б успела сделать `UPDATE` и закоммитить. А получила разные данные для одной записи.

**3. Phantom Read (Фантомное чтение)** — проблема **множества строк**. А делает `SELECT WHERE balance > 1000` → 5 строк. Б делает `INSERT` новой строки с `balance = 2000` и коммитит. А повторяет тот же SELECT → 6 строк. Появился "фантом".

!!! tip "Чем отличается Non-repeatable от Phantom?"
    Non-repeatable Read — изменение **существующей** строки (`UPDATE`). Phantom Read — появление **новых** строк (`INSERT` / `DELETE`).

## Уровни изоляции

Компромисс между производительностью и консистентностью.

### 1. READ UNCOMMITTED — анархия ради скорости

Транзакция видит всё, включая незакоммиченные изменения чужих транзакций.

!!! note "PostgreSQL"
    Физически не поддерживается. При указании этого уровня Postgres молча работает как `READ COMMITTED`.

### 2. READ COMMITTED — умолчание PostgreSQL

Транзакция видит только закоммиченные изменения. Каждый SQL-запрос получает свежий снимок данных.

```java
@Transactional(isolation = Isolation.READ_COMMITTED) // умолчание в PostgreSQL
```

Защищает от Dirty Read. Позволяет Non-repeatable Read и Phantom Read.

### 3. REPEATABLE READ — умолчание MySQL (InnoDB)

Снимок данных делается **один раз при старте транзакции**. Все последующие SELECT видят одни и те же данные.

Защищает от Dirty Read и Non-repeatable Read.

!!! note "PostgreSQL особенность"
    В PostgreSQL `REPEATABLE READ` через MVCC дополнительно защищает и от Phantom Read — новые строки других транзакций не пройдут проверку видимости для старого снимка. По стандарту SQL фантомы на этом уровне допускаются.

### 4. SERIALIZABLE — абсолютная надёжность

Результат параллельных транзакций идентичен последовательному выполнению. Защищает от всех аномалий.

!!! warning "Использовать редко"
    Убивает пропускную способность. Транзакции часто падают с ошибкой сериализации и требуют повторного запуска. Только для критичных финансовых операций (сложные отчёты, итоговые расчёты).

### Матрица защиты

| Уровень | Dirty Read | Non-repeatable Read | Phantom Read |
|---|---|---|---|
| **READ UNCOMMITTED** | 🔴 Возможно | 🔴 Возможно | 🔴 Возможно |
| **READ COMMITTED** | ✅ Защита | 🔴 Возможно | 🔴 Возможно |
| **REPEATABLE READ** | ✅ Защита | ✅ Защита | 🔴 Возможно* |
| **SERIALIZABLE** | ✅ Защита | ✅ Защита | ✅ Защита |

_*В PostgreSQL Repeatable Read дополнительно защищает от Phantom Read через MVCC._

## MVCC (Multi-Version Concurrency Control)

### Проблема, которую решает MVCC

До MVCC БД работали через блокировки: транзакция А обновляет строку → вешает замок → транзакция Б хочет прочитать эту строку → покорно ждёт. База тормозила.

**Главное правило MVCC:**

> Читатели никогда не блокируют писателей. Писатели никогда не блокируют читателей.

### Как работает: несколько версий одной строки

База не перезаписывает данные поверх старых. Она хранит **несколько версий одной строки**.

У каждой строки два скрытых системных поля:
- `xmin` — номер транзакции, которая **создала** эту версию.
- `xmax` — номер транзакции, которая **удалила/изменила** (пустой = актуальная).

### Сценарий: UPDATE без блокировки читателя

```
Начальное состояние:
  Строка: баланс = 10 000 | xmin=50 | xmax=NULL   ← актуальная

Писатель (транзакция 100) делает UPDATE balance = 8000:
  Старая строка: баланс = 10 000 | xmin=50 | xmax=100   ← помечена удалённой
  Новая строка:  баланс = 8 000  | xmin=100 | xmax=NULL  ← новая версия

Читатель (транзакция 101) делает SELECT balance:
  Видит обе строки.
  Проверка видимости: "транзакция 100 ещё не закоммичена (или начата после меня)".
  Новая строка невидима.
  Читает старую версию → баланс = 10 000.

Никаких блокировок. Каждый работает в своём "снимке" времени.
```

### Как MVCC реализует уровни изоляции

- **READ COMMITTED** — снимок делается **заново перед каждым SQL-запросом** внутри транзакции. Поэтому между двумя SELECT-ами можно увидеть чужие закоммиченные изменения (Non-repeatable Read возможен).

- **REPEATABLE READ** — снимок делается **один раз при старте транзакции** и "замораживается". Все последующие SELECT смотрят в него. Новые строки, добавленные другими транзакциями, не пройдут проверку видимости → защита от Phantom Read в PostgreSQL.

### Тёмная сторона MVCC: Table Bloat и Autovacuum

При каждом `UPDATE` и `DELETE` старые версии строк не удаляются сразу — таблица начинает пухнуть. Старые версии, ненужные ни одной активной транзакции, становятся **Dead Tuples (мёртвыми кортежами)**.

Чтобы диск не переполнился, в PostgreSQL работает фоновый процесс **Autovacuum**:

```
Autovacuum периодически:
1. Сканирует таблицы
2. Находит Dead Tuples
3. Помечает их место как свободное для новых INSERT/UPDATE
4. (VACUUM ANALYZE) — обновляет статистику для планировщика запросов
```

!!! warning "Bloat на продакшене"
    Если Autovacuum не успевает (например, живёт долгая транзакция, удерживающая старый снимок) — таблица может раздуться в несколько раз. Симптом: `SELECT COUNT(*)` работает медленно, размер таблицы неоправданно велик. Диагностика: `pg_stat_user_tables` → колонка `n_dead_tup`.

### PostgreSQL vs MySQL (InnoDB): два подхода к MVCC

```
PostgreSQL:
  UPDATE → новая версия строки пишется в саму таблицу (heap)
  Старая версия остаётся там же
  Autovacuum чистит мёртвые кортежи

MySQL (InnoDB):
  UPDATE → строка меняется на месте
  Старая версия уходит в Undo Log
  Читатели "собирают" нужную версию из Undo Log на лету
```

Плюсы PostgreSQL подхода: проще читать, нет накладных расходов на сборку из лога.
Минусы: нужен Autovacuum, возможен Table Bloat.

## Индексы

### Зачем нужны и как работают

Без индекса — **Sequential Scan**: PostgreSQL читает каждую строку таблицы до первого совпадения. На таблице в 10 млн строк `SELECT * WHERE email = 'a@b.com'` занимает секунды.

С индексом — **Index Scan**: структура данных (B-Tree по умолчанию) позволяет найти строку за `O(log N)`.

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

### Типы индексов PostgreSQL

| Тип | Когда использовать |
|---|---|
| **B-Tree** (умолчание) | `=`, `<`, `>`, `BETWEEN`, `LIKE 'prefix%'`, сортировка |
| **Hash** | Только `=`. Быстрее B-Tree для точного поиска, но не журналируется (осторожно) |
| **GIN** | Массивы, JSONB, полнотекстовый поиск (`@>`, `&&`, `@@`) |
| **GiST** | Геометрия, диапазоны (`tsrange`, `int4range`) |
| **BRIN** | Очень большие таблицы с физически упорядоченными данными (логи, временные ряды) |

### Когда индекс НЕ помогает

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

### EXPLAIN ANALYZE — понять план запроса

```sql
EXPLAIN ANALYZE
SELECT u.name, COUNT(h.id)
FROM users u
LEFT JOIN habits h ON h.user_id = u.id
WHERE u.city = 'Almaty'
GROUP BY u.name;
```

```
-- Что смотреть в выводе:
Seq Scan       → нет индекса или плановщик решил что он не выгоден
Index Scan     → используется индекс (хорошо для OLTP)
Bitmap Scan    → несколько условий, объединение нескольких индексов
Hash Join      → соединение таблиц через хэш-таблицу (быстро для больших объёмов)
Nested Loop    → для каждой строки внешней таблицы — поиск во внутренней
cost=0.00..100 → оценка планировщика (приблизительно)
actual time    → реальное время выполнения (с ANALYZE)
rows           → реальное количество строк
```

## SQL: Основные операции

### JOIN-ы

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

### Агрегация и GROUP BY

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

### Оконные функции (Window Functions)

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

### CTE (Common Table Expressions)

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

## Нормализация

### Нормальные формы (кратко)

**1НФ (Первая нормальная форма):** Все значения атомарны (не массивы, не списки через запятую). Есть первичный ключ.

```sql
-- ❌ Нарушение 1НФ
users: id=1, name="Alice", phones="79001234567, 79009876543"

-- ✅ 1НФ
users: id=1, name="Alice"
user_phones: user_id=1, phone="79001234567"
user_phones: user_id=1, phone="79009876543"
```

**2НФ:** Все неключевые поля зависят от **всего** первичного ключа (актуально для составных ключей).

**3НФ:** Нет транзитивных зависимостей (неключевое поле А не зависит от неключевого поля Б).

```sql
-- ❌ Нарушение 3НФ: city_code → city_name (транзитивная зависимость)
users: id, name, city_code, city_name

-- ✅ 3НФ
users: id, name, city_id
cities: id, code, name
```

**BCNF (Бойс-Кодд):** Каждый детерминант — потенциальный ключ. Строже 3НФ.

!!! tip "Денормализация на практике"
    В OLTP (транзакционные системы) стремимся к 3НФ. В OLAP (аналитика, Data Warehouse) намеренно денормализуем (звезда/снежинка) для скорости аналитических запросов — джоины дорогие, а данные читаются огромными объёмами.

## Итоговая шпаргалка

| **Тема** | **Запомнить** |
|---|---|
| **ACID** | Атомарность, Консистентность, Изоляция, Долговечность |
| **WAL** | Изменения сначала в лог, потом в таблицы → восстановление при сбое |
| **READ COMMITTED** | Умолчание PostgreSQL. Снимок на каждый запрос |
| **REPEATABLE READ** | Умолчание MySQL. Один снимок на транзакцию. В Postgres защищает и от Phantom |
| **SERIALIZABLE** | Абсолютная надёжность. Дорого. Только для критичных операций |
| **MVCC** | Читатели не блокируют писателей. Несколько версий строки через xmin/xmax |
| **Autovacuum** | Чистит мёртвые кортежи после UPDATE/DELETE. Следить чтобы успевал |
| **B-Tree** | Умолчание для индексов. `=`, диапазоны, сортировка |
| **GIN** | JSONB, массивы, полнотекстовый поиск |
| **EXPLAIN ANALYZE** | `Seq Scan` = нет индекса или невыгоден. `Index Scan` = хорошо |
| **Оконные функции** | `OVER (PARTITION BY ... ORDER BY ...)`. `ROW_NUMBER`, `RANK`, `LAG` |
| **CTE** | `WITH` — читаемые подзапросы. `WITH RECURSIVE` — иерархия |
| **3НФ** | Нет транзитивных зависимостей. OLTP стремится к ней |