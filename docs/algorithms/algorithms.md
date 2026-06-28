# Алгоритмы и структуры данных

## Big O — оценка сложности

Big O описывает, как растёт время выполнения (или объём памяти) при росте входных данных. Нас интересует **худший случай** и поведение при больших N.

### Иерархия сложностей

```
O(1)        — константа      Доступ к элементу массива по индексу
O(log N)    — логарифм       Бинарный поиск, операции с BST
O(N)        — линейная       Обход массива, поиск в списке
O(N log N)  — линлог         Merge Sort, Quick Sort (в среднем)
O(N²)       — квадратичная   Bubble Sort, два вложенных цикла
O(2^N)      — экспонента     Перебор всех подмножеств
O(N!)       — факториал      Перебор всех перестановок
```

```java
// O(1) — не зависит от размера входа
int first = array[0];

// O(N) — один проход
for (int x : array) { process(x); }

// O(N²) — два вложенных прохода по тому же массиву
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        process(i, j);

// O(log N) — делим задачу пополам на каждом шаге
int binarySearch(int[] arr, int target) {
    int left = 0, right = arr.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2; // не (left+right)/2 — риск overflow!
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}
```

### Правила упрощения

```
O(2N)     → O(N)       константы отбрасываем
O(N + N²) → O(N²)      оставляем доминирующий член
O(N + M)  → O(N + M)   разные переменные НЕ упрощаем
```

!!! warning "Частая ошибка"
    `O(N + M)` нельзя упростить до `O(N)` или `O(M)` — мы не знаем соотношение N и M. Упрощение возможно только если одно заведомо больше другого.

### Space Complexity (Сложность по памяти)

```java
// O(1) — константная память: только переменные
int sum(int[] arr) {
    int total = 0;
    for (int x : arr) total += x;
    return total;
}

// O(N) — линейная память: создаём структуру размером N
int[] copy = Arrays.copyOf(arr, arr.length);

// O(N) — стек рекурсии при глубине N
void recurse(int n) {
    if (n == 0) return;
    recurse(n - 1); // N вызовов на стеке одновременно
}
```

---

## Структуры данных

### Массив (Array)

```
Доступ по индексу:  O(1)
Поиск:              O(N)
Вставка в конец:    O(1) амортизированно (ArrayList)
Вставка в середину: O(N)  — нужен сдвиг элементов
Удаление:           O(N)  — нужен сдвиг элементов
```

```java
// В Java — ArrayList под капотом это массив с автоувеличением ×1.5
List<Integer> list = new ArrayList<>();
list.add(42);         // O(1) амортизированно
list.get(0);          // O(1)
list.add(0, 42);      // O(N) — сдвиг всех элементов
list.remove(0);       // O(N) — сдвиг всех элементов
```

### Связный список (LinkedList)

```
Доступ по индексу:   O(N)  — нет прямого доступа, нужен обход
Поиск:               O(N)
Вставка в начало:    O(1)
Вставка/удаление при известном узле: O(1)
Поиск узла для вставки: O(N)
```

```java
// В Java LinkedList — двусвязный список
Deque<Integer> deque = new LinkedList<>();
deque.addFirst(1);   // O(1)
deque.addLast(2);    // O(1)
deque.get(5);        // O(N) — обход!
```

!!! warning "LinkedList в реальном коде"
    В Java `LinkedList` проигрывает `ArrayList` почти везде из-за плохой Cache Locality (узлы разбросаны по памяти). Вместо него для очереди/стека используй `ArrayDeque`.

### HashMap

```
put / get / containsKey:  O(1) в среднем, O(N) в худшем (все коллизии в одном бакете)
Итерация:                 O(N)
```

```java
Map<String, Integer> map = new HashMap<>();
map.put("key", 1);          // O(1)
map.getOrDefault("key", 0); // O(1)
map.containsKey("key");     // O(1)

// Удобные методы
map.merge("key", 1, Integer::sum);              // добавить или суммировать
map.computeIfAbsent("key", k -> new ArrayList<>()).add(value);
```

### HashSet

```
add / remove / contains:  O(1) в среднем
```

```java
// Типичное применение — проверка уникальности или "уже видели?"
Set<Integer> seen = new HashSet<>();
for (int x : arr) {
    if (!seen.add(x)) {
        System.out.println("Дубликат: " + x);
    }
}
```

### Стек (Stack)

LIFO — Last In, First Out. В Java — `ArrayDeque`.

```java
Deque<Integer> stack = new ArrayDeque<>();
stack.push(1);       // добавить на вершину  O(1)
stack.peek();        // посмотреть вершину   O(1)
stack.pop();         // снять с вершины      O(1)
stack.isEmpty();     // O(1)
```

**Применение:** обход в глубину (DFS), проверка скобочных последовательностей, отмена операций.

### Очередь (Queue)

FIFO — First In, First Out. В Java — `ArrayDeque`.

```java
Deque<Integer> queue = new ArrayDeque<>();
queue.offer(1);      // добавить в хвост     O(1)
queue.peek();        // посмотреть голову    O(1)
queue.poll();        // снять из головы      O(1)
```

**Применение:** обход в ширину (BFS), обработка задач по порядку.

### PriorityQueue (Куча / Heap)

```
add / poll:   O(log N)
peek:         O(1)
```

```java
// Min-heap по умолчанию (наименьший элемент наверху)
PriorityQueue<Integer> minHeap = new PriorityQueue<>();

// Max-heap
PriorityQueue<Integer> maxHeap = new PriorityQueue<>(Comparator.reverseOrder());

minHeap.offer(5);
minHeap.offer(1);
minHeap.offer(3);
minHeap.poll(); // вернёт 1 (минимум)

// Куча объектов
PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[1] - b[1]); // по второму элементу
```

**Применение:** Top-K задачи, алгоритм Дейкстры, планировщик задач.

---

## Деревья

### Бинарное дерево поиска (BST)

```
Поиск / Вставка / Удаление:
  Среднее:  O(log N)
  Худшее:   O(N) — вырожденное дерево (все в одну сторону)
```

```java
// Рекурсивный обход
void inorder(TreeNode node) {        // Левый → Корень → Правый
    if (node == null) return;        // даёт отсортированный порядок для BST
    inorder(node.left);
    process(node.val);
    inorder(node.right);
}

void preorder(TreeNode node) {       // Корень → Левый → Правый
    if (node == null) return;        // используется для копирования дерева
    process(node.val);
    preorder(node.left);
    preorder(node.right);
}

void postorder(TreeNode node) {      // Левый → Правый → Корень
    if (node == null) return;        // используется для удаления дерева
    postorder(node.left);
    postorder(node.right);
    process(node.val);
}
```

### Обход в ширину (BFS) — итеративно через очередь

```java
void bfs(TreeNode root) {
    if (root == null) return;
    Queue<TreeNode> queue = new ArrayDeque<>();
    queue.offer(root);

    while (!queue.isEmpty()) {
        int levelSize = queue.size();         // размер текущего уровня

        for (int i = 0; i < levelSize; i++) {
            TreeNode node = queue.poll();
            process(node.val);

            if (node.left != null)  queue.offer(node.left);
            if (node.right != null) queue.offer(node.right);
        }
        // Здесь — конец одного уровня дерева
    }
}
```

### Глубина дерева — рекурсия

```java
int maxDepth(TreeNode root) {
    if (root == null) return 0;
    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
```

### Красно-чёрное дерево (Red-Black Tree)

Самобалансирующееся BST. Гарантирует `O(log N)` в худшем случае.

```
Поиск / Вставка / Удаление: O(log N) гарантированно
```

В Java используется как основа `TreeMap` и `TreeSet`. При вставке в `HashMap` — когда связный список в бакете вырастает до 8 элементов, он трансформируется в Red-Black Tree (Java 8+).

---

## Алгоритмы сортировки

| Алгоритм | Лучшее | Среднее | Худшее | Память | Стабильна |
|---|---|---|---|---|---|
| **Bubble Sort** | O(N) | O(N²) | O(N²) | O(1) | ✅ |
| **Selection Sort** | O(N²) | O(N²) | O(N²) | O(1) | ❌ |
| **Insertion Sort** | O(N) | O(N²) | O(N²) | O(1) | ✅ |
| **Merge Sort** | O(N log N) | O(N log N) | O(N log N) | O(N) | ✅ |
| **Quick Sort** | O(N log N) | O(N log N) | O(N²) | O(log N) | ❌ |
| **Heap Sort** | O(N log N) | O(N log N) | O(N log N) | O(1) | ❌ |
| **Tim Sort** | O(N) | O(N log N) | O(N log N) | O(N) | ✅ |

**Tim Sort** — используется в Java (`Arrays.sort` для объектов, `Collections.sort`). Гибрид Merge Sort + Insertion Sort.

**Quick Sort** — используется в Java для примитивов (`Arrays.sort(int[])`). Нестабильна, но очень быстра на практике.

### Merge Sort — реализация

```java
void mergeSort(int[] arr, int left, int right) {
    if (left >= right) return;

    int mid = left + (right - left) / 2;
    mergeSort(arr, left, mid);       // сортируем левую половину
    mergeSort(arr, mid + 1, right);  // сортируем правую половину
    merge(arr, left, mid, right);    // сливаем
}

void merge(int[] arr, int left, int mid, int right) {
    int[] temp = new int[right - left + 1];
    int i = left, j = mid + 1, k = 0;

    while (i <= mid && j <= right) {
        if (arr[i] <= arr[j]) temp[k++] = arr[i++];
        else                   temp[k++] = arr[j++];
    }
    while (i <= mid)    temp[k++] = arr[i++];
    while (j <= right)  temp[k++] = arr[j++];

    System.arraycopy(temp, 0, arr, left, temp.length);
}
```

### Quick Sort — реализация

```java
void quickSort(int[] arr, int left, int right) {
    if (left >= right) return;

    int pivot = partition(arr, left, right);
    quickSort(arr, left, pivot - 1);
    quickSort(arr, pivot + 1, right);
}

int partition(int[] arr, int left, int right) {
    int pivot = arr[right]; // выбираем последний элемент как пивот
    int i = left - 1;

    for (int j = left; j < right; j++) {
        if (arr[j] <= pivot) {
            i++;
            int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp; // swap
        }
    }
    int temp = arr[i+1]; arr[i+1] = arr[right]; arr[right] = temp;
    return i + 1;
}
```

!!! warning "Худший случай Quick Sort"
    Если массив уже отсортирован и пивот всегда выбирается крайним — O(N²). Решение: случайный пивот (`arr[random.nextInt(right - left + 1) + left]`) или медиана из трёх.

---

## Графы

### Представление графа

```java
// 1. Список смежности (чаще всего)
Map<Integer, List<Integer>> graph = new HashMap<>();
graph.computeIfAbsent(0, k -> new ArrayList<>()).add(1);
graph.computeIfAbsent(0, k -> new ArrayList<>()).add(2);
graph.computeIfAbsent(1, k -> new ArrayList<>()).add(3);

// 2. Матрица смежности (для плотных графов)
int[][] matrix = new int[n][n];
matrix[0][1] = 1; // ребро 0 → 1
```

### BFS (Поиск в ширину) — кратчайший путь в невзвешенном графе

```java
int bfs(Map<Integer, List<Integer>> graph, int start, int target) {
    Queue<Integer> queue = new ArrayDeque<>();
    Set<Integer> visited = new HashSet<>();
    queue.offer(start);
    visited.add(start);
    int steps = 0;

    while (!queue.isEmpty()) {
        int size = queue.size();

        for (int i = 0; i < size; i++) {
            int node = queue.poll();
            if (node == target) return steps;

            for (int neighbor : graph.getOrDefault(node, List.of())) {
                if (!visited.contains(neighbor)) {
                    visited.add(neighbor);
                    queue.offer(neighbor);
                }
            }
        }
        steps++;
    }
    return -1; // не нашли
}
```

### DFS (Поиск в глубину) — рекурсивно и итеративно

```java
// Рекурсивный DFS
void dfs(Map<Integer, List<Integer>> graph, int node, Set<Integer> visited) {
    visited.add(node);
    process(node);

    for (int neighbor : graph.getOrDefault(node, List.of())) {
        if (!visited.contains(neighbor)) {
            dfs(graph, neighbor, visited);
        }
    }
}

// Итеративный DFS (через стек — когда рекурсия глубокая и есть риск StackOverflow)
void dfsIterative(Map<Integer, List<Integer>> graph, int start) {
    Deque<Integer> stack = new ArrayDeque<>();
    Set<Integer> visited = new HashSet<>();
    stack.push(start);

    while (!stack.isEmpty()) {
        int node = stack.pop();
        if (visited.contains(node)) continue;
        visited.add(node);
        process(node);

        for (int neighbor : graph.getOrDefault(node, List.of())) {
            if (!visited.contains(neighbor)) {
                stack.push(neighbor);
            }
        }
    }
}
```

### Алгоритм Дейкстры — кратчайший путь во взвешенном графе

```java
int[] dijkstra(int[][] graph, int src) {  // graph[i][j] = вес ребра или 0
    int n = graph.length;
    int[] dist = new int[n];
    Arrays.fill(dist, Integer.MAX_VALUE);
    dist[src] = 0;

    // [дистанция, вершина]
    PriorityQueue<int[]> pq = new PriorityQueue<>((a, b) -> a[0] - b[0]);
    pq.offer(new int[]{0, src});

    while (!pq.isEmpty()) {
        int[] curr = pq.poll();
        int d = curr[0], u = curr[1];

        if (d > dist[u]) continue; // устаревшая запись

        for (int v = 0; v < n; v++) {
            if (graph[u][v] > 0) { // есть ребро
                int newDist = dist[u] + graph[u][v];
                if (newDist < dist[v]) {
                    dist[v] = newDist;
                    pq.offer(new int[]{newDist, v});
                }
            }
        }
    }
    return dist;
}
```

**Сложность:** O((V + E) log V) с PriorityQueue.

---

## Техники решения задач

### Два указателя (Two Pointers)

```java
// Пример: найти пару с заданной суммой в отсортированном массиве
int[] twoSum(int[] arr, int target) {
    int left = 0, right = arr.length - 1;

    while (left < right) {
        int sum = arr[left] + arr[right];
        if (sum == target) return new int[]{left, right};
        if (sum < target) left++;
        else right--;
    }
    return new int[]{-1, -1};
}

// Пример: удалить дубликаты из отсортированного массива на месте
int removeDuplicates(int[] arr) {
    if (arr.length == 0) return 0;
    int slow = 0;

    for (int fast = 1; fast < arr.length; fast++) {
        if (arr[fast] != arr[slow]) {
            slow++;
            arr[slow] = arr[fast];
        }
    }
    return slow + 1;
}
```

### Скользящее окно (Sliding Window)

```java
// Максимальная сумма подмассива длиной K
int maxSumSubarray(int[] arr, int k) {
    int windowSum = 0;
    for (int i = 0; i < k; i++) windowSum += arr[i]; // начальное окно

    int maxSum = windowSum;

    for (int i = k; i < arr.length; i++) {
        windowSum += arr[i] - arr[i - k]; // добавляем новый, убираем старый
        maxSum = Math.max(maxSum, windowSum);
    }
    return maxSum;
}

// Динамическое окно: наименьший подмассив с суммой ≥ target
int minSubarrayLen(int target, int[] arr) {
    int left = 0, sum = 0, minLen = Integer.MAX_VALUE;

    for (int right = 0; right < arr.length; right++) {
        sum += arr[right];

        while (sum >= target) {             // сжимаем окно пока выполняется условие
            minLen = Math.min(minLen, right - left + 1);
            sum -= arr[left++];
        }
    }
    return minLen == Integer.MAX_VALUE ? 0 : minLen;
}
```

### Префиксные суммы (Prefix Sum)

```java
// Сумма подмассива [left, right] за O(1) после O(N) предобработки
int[] prefixSum(int[] arr) {
    int[] prefix = new int[arr.length + 1];
    for (int i = 0; i < arr.length; i++) {
        prefix[i + 1] = prefix[i] + arr[i];
    }
    return prefix;
}

// Сумма arr[left..right] = prefix[right+1] - prefix[left]
int rangeSum(int[] prefix, int left, int right) {
    return prefix[right + 1] - prefix[left];
}
```

### Динамическое программирование (DP)

**Ключевая идея:** разбить задачу на подзадачи, сохранить результаты чтобы не пересчитывать.

```java
// Классика: Fibonacci с мемоизацией (top-down)
Map<Integer, Long> memo = new HashMap<>();

long fib(int n) {
    if (n <= 1) return n;
    if (memo.containsKey(n)) return memo.get(n);
    long result = fib(n - 1) + fib(n - 2);
    memo.put(n, result);
    return result;
}

// Fibonacci с табуляцией (bottom-up, O(N) память → можно O(1))
long fibDP(int n) {
    if (n <= 1) return n;
    long prev2 = 0, prev1 = 1;
    for (int i = 2; i <= n; i++) {
        long curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}

// Задача о рюкзаке (0/1 Knapsack)
int knapsack(int[] weights, int[] values, int capacity) {
    int n = weights.length;
    int[][] dp = new int[n + 1][capacity + 1];

    for (int i = 1; i <= n; i++) {
        for (int w = 0; w <= capacity; w++) {
            dp[i][w] = dp[i-1][w]; // не берём предмет i
            if (weights[i-1] <= w) {
                dp[i][w] = Math.max(dp[i][w],
                    dp[i-1][w - weights[i-1]] + values[i-1]); // берём
            }
        }
    }
    return dp[n][capacity];
}
```

## Итоговая шпаргалка

| **Структура** | **Доступ** | **Поиск** | **Вставка** | **Удаление** |
|---|---|---|---|---|
| **Array / ArrayList** | O(1) | O(N) | O(N) | O(N) |
| **LinkedList** | O(N) | O(N) | O(1)* | O(1)* |
| **HashMap / HashSet** | — | O(1) | O(1) | O(1) |
| **TreeMap / TreeSet** | — | O(log N) | O(log N) | O(log N) |
| **Stack / Queue (ArrayDeque)** | O(N) | O(N) | O(1) | O(1) |
| **PriorityQueue** | O(1) peek | O(N) | O(log N) | O(log N) |

_*При наличии указателя на узел_

| **Алгоритм** | **Сложность** | **Когда** |
|---|---|---|
| **Бинарный поиск** | O(log N) | Отсортированный массив |
| **BFS** | O(V + E) | Кратчайший путь, обход уровнями |
| **DFS** | O(V + E) | Обход, поиск циклов, топологическая сортировка |
| **Дейкстра** | O((V+E) log V) | Кратчайший путь, взвешенный граф (без отриц. весов) |
| **Merge Sort** | O(N log N) | Стабильная сортировка, внешняя сортировка |
| **Quick Sort** | O(N log N) | Быстрая сортировка примитивов |