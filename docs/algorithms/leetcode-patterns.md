# Паттерны задач (LeetCode)

Большинство задач на собесах — это вариации одних и тех же паттернов. Узнать паттерн важнее, чем выучить конкретные задачи.

## Как подходить к задаче (фреймворк)

```
1. Clarify     — уточни ограничения: размер входа, типы, null/empty, дубликаты
2. Examples    — разбери примеры вручную, добавь edge cases (пустой, один элемент)
3. Brute Force — озвучь наивное решение и его сложность
4. Optimize    — найди узкое место, выбери паттерн
5. Code        — пиши чистый код с говорящими именами переменных
6. Test        — прогони по примерам и edge cases вслух
```

На собесе важно **думать вслух**. "Я вижу, что тут можно применить скользящее окно, потому что..." — это уже половина успеха.

---

## Паттерн 1: Two Pointers (Два указателя)

**Когда:** отсортированный массив, поиск пары/тройки, разворот, удаление дубликатов.

### Задача: Три числа с нулевой суммой (3Sum)

```
Дан массив. Найди все уникальные тройки [a, b, c] такие, что a + b + c = 0.
Input: [-1, 0, 1, 2, -1, -4]
Output: [[-1, -1, 2], [-1, 0, 1]]
```

```java
List<List<Integer>> threeSum(int[] nums) {
    Arrays.sort(nums); // O(N log N)
    List<List<Integer>> result = new ArrayList<>();

    for (int i = 0; i < nums.length - 2; i++) {
        // Пропускаем дубликаты для i
        if (i > 0 && nums[i] == nums[i - 1]) continue;
        if (nums[i] > 0) break; // все оставшиеся тоже > 0, сумма не будет 0

        int left = i + 1, right = nums.length - 1;

        while (left < right) {
            int sum = nums[i] + nums[left] + nums[right];

            if (sum == 0) {
                result.add(List.of(nums[i], nums[left], nums[right]));
                // Пропускаем дубликаты для left и right
                while (left < right && nums[left] == nums[left + 1]) left++;
                while (left < right && nums[right] == nums[right - 1]) right--;
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    return result;
}
// Сложность: O(N²) время, O(1) доп. память
```

---

## Паттерн 2: Sliding Window (Скользящее окно)

**Когда:** подстрока/подмассив с условием, максимум/минимум в окне.

### Задача: Наидлиннейшая подстрока без повторений

```
Input: "abcabcbb"
Output: 3  ("abc")
```

```java
int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> lastSeen = new HashMap<>(); // символ → последний индекс
    int maxLen = 0;
    int left = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);

        // Если символ уже в окне — сдвигаем левую границу за него
        if (lastSeen.containsKey(c) && lastSeen.get(c) >= left) {
            left = lastSeen.get(c) + 1;
        }

        lastSeen.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
// O(N) время, O(min(N, alphabet)) память
```

### Задача: Минимальная покрывающая подстрока (Minimum Window Substring)

```
Дана строка s и шаблон t. Найди наименьшую подстроку s, содержащую все символы t.
Input: s = "ADOBECODEBANC", t = "ABC"
Output: "BANC"
```

```java
String minWindow(String s, String t) {
    Map<Character, Integer> need = new HashMap<>();
    for (char c : t.toCharArray()) need.merge(c, 1, Integer::sum);

    int have = 0, required = need.size();
    Map<Character, Integer> window = new HashMap<>();
    int[] ans = {-1, 0, 0}; // длина, left, right
    int left = 0;

    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        window.merge(c, 1, Integer::sum);

        if (need.containsKey(c) && window.get(c).equals(need.get(c))) have++;

        // Сжимаем окно пока оно валидно
        while (have == required) {
            if (ans[0] == -1 || right - left + 1 < ans[0]) {
                ans = new int[]{right - left + 1, left, right};
            }
            char leftChar = s.charAt(left++);
            window.merge(leftChar, -1, Integer::sum);
            if (need.containsKey(leftChar) && window.get(leftChar) < need.get(leftChar)) {
                have--;
            }
        }
    }
    return ans[0] == -1 ? "" : s.substring(ans[1], ans[2] + 1);
}
// O(|S| + |T|) время и память
```

---

## Паттерн 3: HashMap для частот и индексов

**Когда:** поиск пар/совпадений, анаграммы, счётчики символов.

### Задача: Два числа с заданной суммой (Two Sum)

```
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1]  (nums[0] + nums[1] = 9)
```

```java
int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>(); // значение → индекс

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];

        if (seen.containsKey(complement)) {
            return new int[]{seen.get(complement), i};
        }
        seen.put(nums[i], i);
    }
    return new int[]{-1, -1};
}
// O(N) время и память — вместо O(N²) наивного подхода
```

### Задача: Группировка анаграмм

```
Input: ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
```

```java
List<List<String>> groupAnagrams(String[] strs) {
    Map<String, List<String>> groups = new HashMap<>();

    for (String s : strs) {
        char[] chars = s.toCharArray();
        Arrays.sort(chars);                     // ключ — отсортированная строка
        String key = new String(chars);         // анаграммы дают одинаковый ключ

        groups.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
    }
    return new ArrayList<>(groups.values());
}
// O(N × K log K), где K — длина слова
```

---

## Паттерн 4: Бинарный поиск

**Когда:** отсортированный массив, поиск границы, "найди первый/последний элемент, удовлетворяющий условию".

### Задача: Поиск в ротированном массиве

```
Отсортированный массив повернули: [4, 5, 6, 7, 0, 1, 2]
Найти элемент target = 0.
Output: 4
```

```java
int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;

    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;

        // Определяем, какая половина отсортирована
        if (nums[left] <= nums[mid]) {          // левая половина отсортирована
            if (nums[left] <= target && target < nums[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        } else {                                // правая половина отсортирована
            if (nums[mid] < target && target <= nums[right]) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
    }
    return -1;
}
// O(log N)
```

---

## Паттерн 5: DFS на дереве/графе

### Задача: Проверка валидности BST

```java
boolean isValidBST(TreeNode root) {
    return validate(root, Long.MIN_VALUE, Long.MAX_VALUE);
}

boolean validate(TreeNode node, long min, long max) {
    if (node == null) return true;
    if (node.val <= min || node.val >= max) return false;

    return validate(node.left, min, node.val) &&   // левое поддерево: все < node.val
           validate(node.right, node.val, max);     // правое поддерево: все > node.val
}
// O(N) — посещаем каждый узел один раз
```

### Задача: Количество островов (Number of Islands)

```
Дана сетка из '1' (земля) и '0' (вода). Найти количество островов.
```

```java
int numIslands(char[][] grid) {
    int count = 0;

    for (int i = 0; i < grid.length; i++) {
        for (int j = 0; j < grid[0].length; j++) {
            if (grid[i][j] == '1') {
                dfs(grid, i, j);  // "топим" весь остров
                count++;
            }
        }
    }
    return count;
}

void dfs(char[][] grid, int r, int c) {
    if (r < 0 || r >= grid.length || c < 0 || c >= grid[0].length) return;
    if (grid[r][c] != '1') return;

    grid[r][c] = '0'; // помечаем посещённой (вместо отдельного visited)

    dfs(grid, r + 1, c);
    dfs(grid, r - 1, c);
    dfs(grid, r, c + 1);
    dfs(grid, r, c - 1);
}
// O(N×M) время и пространство (стек рекурсии)
```

---

## Паттерн 6: BFS — кратчайший путь

### Задача: Кратчайший путь в лабиринте

```
Сетка 0/1, 0 — проход, 1 — стена. Найти длину кратчайшего пути из (0,0) в (n-1,m-1).
```

```java
int shortestPath(int[][] grid) {
    int n = grid.length, m = grid[0].length;
    if (grid[0][0] == 1 || grid[n-1][m-1] == 1) return -1;

    Queue<int[]> queue = new ArrayDeque<>();
    queue.offer(new int[]{0, 0, 1}); // row, col, path_length
    grid[0][0] = 1; // помечаем посещённой

    int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};

    while (!queue.isEmpty()) {
        int[] curr = queue.poll();
        int r = curr[0], c = curr[1], dist = curr[2];

        if (r == n - 1 && c == m - 1) return dist;

        for (int[] d : dirs) {
            int nr = r + d[0], nc = c + d[1];
            if (nr >= 0 && nr < n && nc >= 0 && nc < m && grid[nr][nc] == 0) {
                grid[nr][nc] = 1; // помечаем
                queue.offer(new int[]{nr, nc, dist + 1});
            }
        }
    }
    return -1;
}
// O(N×M)
```

---

## Паттерн 7: Динамическое программирование

### Задача: Максимальный подмассив (Kadane's Algorithm)

```
Input: [-2, 1, -3, 4, -1, 2, 1, -5, 4]
Output: 6  (подмассив [4, -1, 2, 1])
```

```java
int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currentSum = nums[0];

    for (int i = 1; i < nums.length; i++) {
        // Либо расширяем текущий подмассив, либо начинаем новый с текущего элемента
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
}
// O(N) время, O(1) память — классика DP без таблицы
```

### Задача: Монеты (Coin Change)

```
Монеты [1, 5, 6, 9], сумма = 11. Минимальное количество монет.
Output: 2  (5 + 6)
```

```java
int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1); // "бесконечность"
    dp[0] = 0;

    for (int i = 1; i <= amount; i++) {
        for (int coin : coins) {
            if (coin <= i) {
                dp[i] = Math.min(dp[i], dp[i - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
// O(amount × coins) время, O(amount) память
```

### Задача: Наибольшая общая подпоследовательность (LCS)

```
Input: s1 = "abcde", s2 = "ace"
Output: 3  ("ace")
```

```java
int longestCommonSubsequence(String s1, String s2) {
    int m = s1.length(), n = s2.length();
    int[][] dp = new int[m + 1][n + 1];

    for (int i = 1; i <= m; i++) {
        for (int j = 1; j <= n; j++) {
            if (s1.charAt(i - 1) == s2.charAt(j - 1)) {
                dp[i][j] = dp[i-1][j-1] + 1;        // символы совпали
            } else {
                dp[i][j] = Math.max(dp[i-1][j], dp[i][j-1]); // берём лучший из двух
            }
        }
    }
    return dp[m][n];
}
// O(M×N) время и память
```

---

## Паттерн 8: Стек для скобок и монотонных задач

### Задача: Проверка скобочной последовательности

```
Input: "()[]{}"  → true
Input: "([)]"    → false
```

```java
boolean isValid(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    Map<Character, Character> pairs = Map.of(')', '(', ']', '[', '}', '{');

    for (char c : s.toCharArray()) {
        if (!pairs.containsKey(c)) {
            stack.push(c); // открывающая скобка
        } else {
            if (stack.isEmpty() || stack.peek() != pairs.get(c)) return false;
            stack.pop();
        }
    }
    return stack.isEmpty();
}
// O(N)
```

### Задача: Следующий больший элемент (Monotonic Stack)

```
Input: [2, 1, 2, 4, 3]
Output: [4, 2, 4, -1, -1]  // для каждого элемента — следующий больший
```

```java
int[] nextGreaterElement(int[] nums) {
    int n = nums.length;
    int[] result = new int[n];
    Arrays.fill(result, -1);
    Deque<Integer> stack = new ArrayDeque<>(); // хранит индексы

    for (int i = 0; i < n; i++) {
        // Пока стек не пуст и текущий элемент больше элемента на вершине
        while (!stack.isEmpty() && nums[i] > nums[stack.peek()]) {
            result[stack.pop()] = nums[i]; // нашли следующий больший
        }
        stack.push(i);
    }
    return result;
}
// O(N) — каждый элемент заходит и выходит из стека один раз
```

---

## Частые edge cases (проверяй всегда)

```java
// Пустой/null ввод
if (nums == null || nums.length == 0) return ...;

// Один элемент
if (nums.length == 1) return nums[0];

// Переполнение при сложении (используй long или проверяй)
int mid = left + (right - left) / 2;  // не (left + right) / 2 !

// Деление на ноль
if (divisor == 0) throw new ArithmeticException();

// Отрицательные числа в задачах на сумму/произведение
// Нулевые веса/стоимости в задачах на рюкзак
```

## Шпаргалка по паттернам

| **Паттерн** | **Сигналы в условии** | **Сложность** |
|---|---|---|
| **Two Pointers** | Отсортирован, пара/тройка с суммой, разворот | O(N) |
| **Sliding Window** | Подстрока/подмассив, максимум/минимум с условием | O(N) |
| **HashMap** | Частоты, пары, "видели ли раньше" | O(N) |
| **Бинарный поиск** | Отсортирован, найти границу, "первый/последний" | O(log N) |
| **DFS** | Дерево, граф, перебор вариантов, backtracking | O(V+E) |
| **BFS** | Кратчайший путь, обход уровнями | O(V+E) |
| **Prefix Sum** | Сумма подотрезка, кол-во подмассивов с суммой | O(N) |
| **Monotonic Stack** | Следующий больший/меньший, гистограмма | O(N) |
| **DP** | Максимум/минимум, кол-во способов, подпоследовательность | Varies |
| **Heap/PriorityQueue** | Top-K, k-й наибольший/наименьший, медиана | O(N log K) |