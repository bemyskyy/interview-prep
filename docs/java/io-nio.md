# IO / NIO — Работа с файлами

## Две эпохи: java.io vs java.nio

В Java есть два поколения API для работы с файлами и потоками данных:

| | **java.io** (классика, Java 1.0) | **java.nio** / **java.nio.file** (Java 1.4 / Java 7) |
|---|---|---|
| **Модель** | Потоки байт/символов (streams) | Блоки данных (buffers, channels) + Path API |
| **Блокировка** | Блокирующая (поток ждёт) | Блокирующая и неблокирующая |
| **Работа с файлами** | `File` — устаревший класс | `Path` + `Files` — современный API |
| **Удобство** | Многословно, много кода | Лаконично, богатый функционал |
| **Когда использовать** | Редко в новом коде | **Всегда в современном коде** |

## java.io — Классическое API

### Иерархия потоков

```
Байтовые потоки (byte streams):
InputStream  → FileInputStream, BufferedInputStream, DataInputStream
OutputStream → FileOutputStream, BufferedOutputStream, DataOutputStream

Символьные потоки (char streams, работают с Unicode):
Reader → FileReader, BufferedReader, InputStreamReader
Writer → FileWriter, BufferedWriter, OutputStreamWriter, PrintWriter
```

!!! tip "Байты vs Символы"
    Используй байтовые потоки (`InputStream`/`OutputStream`) для бинарных данных (изображения, архивы, сериализация). Символьные (`Reader`/`Writer`) — для текстовых файлов, они корректно обрабатывают кодировки.

### Паттерн Декоратора в java.io

Всё IO API построено на паттерне Декоратор — потоки оборачиваются друг в друга:

```java
// Читаем текстовый файл построчно через цепочку декораторов
try (BufferedReader reader = new BufferedReader(
        new InputStreamReader(
            new FileInputStream("data.txt"),
            StandardCharsets.UTF_8))) {     // явно задаём кодировку!

    String line;
    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}
// FileInputStream      — читает байты из файла
// InputStreamReader    — декодирует байты в символы (кодировка)
// BufferedReader       — буферизирует, добавляет readLine()
```

!!! warning "Всегда явно указывай кодировку"
    `new FileReader("file.txt")` использует системную кодировку по умолчанию — на разных машинах она разная. Это источник ошибок при переносе кода. Всегда передавай `StandardCharsets.UTF_8`.

### Закрытие ресурсов — только try-with-resources

```java
// ❌ Старый способ — многословно и легко забыть закрыть
FileInputStream fis = null;
try {
    fis = new FileInputStream("data.txt");
    // работаем...
} finally {
    if (fis != null) {
        try { fis.close(); } catch (IOException e) { /* проглатываем */ }
    }
}

// ✅ Современный способ — AutoCloseable, всегда закрывает в обратном порядке
try (var fis = new FileInputStream("input.txt");
     var fos = new FileOutputStream("output.txt")) {
    fis.transferTo(fos); // копируем файл одной строкой (Java 9+)
}
```

### Чтение и запись с буфером — зачем нужен Buffered

```java
// ❌ Без буфера — каждый вызов read() = системный вызов к ОС
FileInputStream slow = new FileInputStream("big.txt");
int b;
while ((b = slow.read()) != -1) { // миллионы системных вызовов!
    process(b);
}

// ✅ BufferedInputStream читает блоками (8KB по умолчанию)
// Системных вызовов в тысячи раз меньше
try (BufferedInputStream fast = new BufferedInputStream(
        new FileInputStream("big.txt"), 16384)) { // 16KB буфер

    byte[] buffer = new byte[4096];
    int bytesRead;
    while ((bytesRead = fast.read(buffer)) != -1) {
        process(buffer, bytesRead);
    }
}
```

## java.nio.file — Современный API (Java 7+)

`Path` и `Files` — это то, что нужно использовать в любом новом коде.

### Path — умная замена File

```java
// Создание Path
Path absolute = Path.of("/home/user/documents/report.pdf");
Path relative = Path.of("src", "main", "resources", "config.yml");

// Операции с путями — без работы с файловой системой
Path parent   = absolute.getParent();      // /home/user/documents
Path fileName = absolute.getFileName();    // report.pdf
String ext    = absolute.toString()
    .substring(absolute.toString().lastIndexOf('.') + 1); // pdf

// Построение пути
Path config = Path.of("src").resolve("main").resolve("config.yml");

// Относительный путь между двумя точками
Path from = Path.of("/home/user");
Path to   = Path.of("/home/user/docs/file.txt");
Path rel  = from.relativize(to); // docs/file.txt

// Нормализация (убирает . и ..)
Path messy = Path.of("/home/user/../user/./docs");
Path clean = messy.normalize(); // /home/user/docs
```

### Files — все операции с файлами

```java
// === Чтение ===

// Весь файл в строку (маленькие файлы)
String content = Files.readString(Path.of("config.txt"), StandardCharsets.UTF_8);

// Все строки в список (маленькие файлы)
List<String> lines = Files.readAllLines(Path.of("data.csv"), StandardCharsets.UTF_8);

// Все байты
byte[] bytes = Files.readAllBytes(Path.of("image.png"));

// Стрим строк — ленивый, идеально для больших файлов
try (Stream<String> stream = Files.lines(Path.of("big.log"), StandardCharsets.UTF_8)) {
    long errorCount = stream
        .filter(line -> line.contains("ERROR"))
        .count();
}

// === Запись ===

// Записать строку (перезапись)
Files.writeString(Path.of("output.txt"), "Hello, World!", StandardCharsets.UTF_8);

// Записать строку (дозапись)
Files.writeString(
    Path.of("log.txt"),
    "New line\n",
    StandardCharsets.UTF_8,
    StandardOpenOption.APPEND, StandardOpenOption.CREATE
);

// Записать строки
List<String> lines2 = List.of("line1", "line2", "line3");
Files.write(Path.of("output.txt"), lines2, StandardCharsets.UTF_8);

// Записать байты
Files.write(Path.of("image.png"), imageBytes);
```

### Операции с файлами и директориями

```java
Path src  = Path.of("source.txt");
Path dest = Path.of("backup/source.txt");

// Проверки
Files.exists(src);           // существует?
Files.isDirectory(src);      // это папка?
Files.isReadable(src);       // можно читать?
Files.size(src);             // размер в байтах

// Создание
Files.createFile(Path.of("new.txt"));
Files.createDirectory(Path.of("newdir"));
Files.createDirectories(Path.of("a/b/c/d")); // создаёт всю цепочку

// Копирование / перемещение
Files.copy(src, dest);
Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING); // перезаписать если есть
Files.move(src, dest, StandardCopyOption.REPLACE_EXISTING);

// Удаление
Files.delete(src);                    // бросает исключение если нет файла
Files.deleteIfExists(src);            // тихо, если нет

// Временные файлы и папки
Path tmpFile = Files.createTempFile("prefix", ".tmp");
Path tmpDir  = Files.createTempDirectory("work");
```

### Обход директорий

```java
// Список файлов в директории (не рекурсивно)
try (Stream<Path> entries = Files.list(Path.of("src/main"))) {
    entries
        .filter(Files::isRegularFile)
        .forEach(System.out::println);
}

// Рекурсивный обход (walk)
try (Stream<Path> tree = Files.walk(Path.of("src"), 3)) { // глубина 3
    List<Path> javaFiles = tree
        .filter(p -> p.toString().endsWith(".java"))
        .collect(Collectors.toList());
}

// Поиск файлов (glob-паттерны)
try (Stream<Path> found = Files.find(
        Path.of("logs"),
        Integer.MAX_VALUE,
        (path, attrs) -> attrs.isRegularFile()
            && path.getFileName().toString().startsWith("error")
            && attrs.size() > 1024)) {

    found.forEach(System.out::println);
}

// Удалить директорию со всем содержимым
Files.walk(Path.of("temp"))
    .sorted(Comparator.reverseOrder()) // сначала вложенные
    .forEach(p -> {
        try { Files.delete(p); }
        catch (IOException e) { throw new UncheckedIOException(e); }
    });
```

### Работа с атрибутами файлов

```java
Path file = Path.of("report.pdf");

// Базовые атрибуты
BasicFileAttributes attrs = Files.readAttributes(file, BasicFileAttributes.class);
attrs.creationTime();       // время создания
attrs.lastModifiedTime();   // время изменения
attrs.size();               // размер
attrs.isDirectory();

// Установить время изменения
Files.setLastModifiedTime(file, FileTime.from(Instant.now()));
```

## Практические паттерны

### Потоковое чтение большого файла (Stream vs readAllLines)

```java
// ❌ readAllLines загружает весь файл в память
List<String> all = Files.readAllLines(hugePath); // OutOfMemoryError на файле в 10 ГБ!

// ✅ Files.lines — ленивый стрим, читает построчно
long count;
try (Stream<String> lines = Files.lines(hugePath, StandardCharsets.UTF_8)) {
    count = lines
        .filter(line -> line.contains("CRITICAL"))
        .count();
}
// В памяти одновременно только несколько строк
```

### BufferedReader с try-with-resources (для кастомной обработки)

```java
try (BufferedReader reader = Files.newBufferedReader(
        Path.of("data.csv"), StandardCharsets.UTF_8)) {

    reader.readLine(); // пропускаем заголовок

    String line;
    while ((line = reader.readLine()) != null) {
        String[] parts = line.split(",");
        processRow(parts);
    }
}
```

### Запись с BufferedWriter

```java
try (BufferedWriter writer = Files.newBufferedWriter(
        Path.of("output.csv"),
        StandardCharsets.UTF_8,
        StandardOpenOption.CREATE,
        StandardOpenOption.TRUNCATE_EXISTING)) {

    writer.write("id,name,age");
    writer.newLine();

    for (User user : users) {
        writer.write(user.getId() + "," + user.getName() + "," + user.getAge());
        writer.newLine();
    }
} // flush и close — автоматически
```

### Копирование файла через потоки (с прогрессом)

```java
public void copyWithProgress(Path src, Path dest) throws IOException {
    long totalSize = Files.size(src);
    long copied = 0;

    try (InputStream in  = new BufferedInputStream(Files.newInputStream(src));
         OutputStream out = new BufferedOutputStream(Files.newOutputStream(dest))) {

        byte[] buffer = new byte[8192];
        int bytesRead;

        while ((bytesRead = in.read(buffer)) != -1) {
            out.write(buffer, 0, bytesRead);
            copied += bytesRead;
            System.out.printf("%.1f%%%n", (double) copied / totalSize * 100);
        }
    }
}
```

### Работа с Properties файлами

```java
// Чтение
Properties props = new Properties();
try (InputStream in = Files.newInputStream(Path.of("app.properties"))) {
    props.load(in);
}
String host = props.getProperty("db.host", "localhost"); // с дефолтом

// Запись
props.setProperty("db.port", "5432");
try (OutputStream out = Files.newOutputStream(Path.of("app.properties"))) {
    props.store(out, "Application config");
}
```

## Итоговая шпаргалка

| Задача | Рекомендуемый способ |
|---|---|
| Прочитать небольшой текстовый файл целиком | `Files.readString(path, UTF_8)` |
| Прочитать небольшой файл построчно в список | `Files.readAllLines(path, UTF_8)` |
| Обработать большой файл построчно | `Files.lines(path)` в try-with-resources |
| Прочитать бинарный файл | `Files.readAllBytes(path)` |
| Записать строку в файл | `Files.writeString(path, text, UTF_8)` |
| Дозаписать в файл | `Files.writeString(path, text, UTF_8, APPEND, CREATE)` |
| Копировать файл | `Files.copy(src, dest, REPLACE_EXISTING)` |
| Создать директории рекурсивно | `Files.createDirectories(path)` |
| Обойти директорию рекурсивно | `Files.walk(path)` в try-with-resources |
| Работа с кастомной логикой парсинга | `Files.newBufferedReader(path, UTF_8)` |
| Построчная запись | `Files.newBufferedWriter(path, UTF_8)` |

!!! tip "Правило большого пальца"
    Если нужна простая операция — `Files.*`. Если нужен контроль над буфером, кодировкой или построчной обработкой — `Files.newBufferedReader` / `Files.newBufferedWriter`. `FileInputStream`/`FileOutputStream` напрямую — только для бинарных данных или совместимости со старым кодом.