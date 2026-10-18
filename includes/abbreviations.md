
*[JVM]: Java Virtual Machine — виртуальная машина, исполняющая байт-код
*[JRE]: Java Runtime Environment — JVM + стандартная библиотека
*[JDK]: Java Development Kit — JRE + компилятор javac и утилиты разработчика
*[JIT]: Just-In-Time компилятор — переводит горячий байт-код в машинный код во время работы
*[JMM]: Java Memory Model — правила видимости и упорядочивания операций с памятью между потоками
*[GC]: Garbage Collector — сборщик мусора
*[ZGC]: Z Garbage Collector — сборщик с паузами до миллисекунды, не зависящими от размера кучи
*[OOM]: OutOfMemoryError — JVM не смогла выделить память
*[CAS]: Compare-And-Swap — атомарная инструкция «сравнить и заменить», основа lock-free алгоритмов
*[ABA]: Проблема ABA — значение сменилось A → B → A, и CAS не заметил изменения
*[AQS]: AbstractQueuedSynchronizer — база для ReentrantLock, Semaphore, CountDownLatch
*[CME]: ConcurrentModificationException — коллекцию изменили во время обхода итератором
*[NPE]: NullPointerException — обращение к члену через ссылку null
*[PECS]: Producer Extends, Consumer Super — правило выбора wildcard в дженериках
*[JNI]: Java Native Interface — вызов нативного кода из Java
*[JEP]: JDK Enhancement Proposal — предложение по развитию JDK
*[NIO]: New I/O — неблокирующий ввод-вывод на каналах и буферах
*[LIFO]: Last In, First Out — последним пришёл, первым ушёл (стек)
*[FIFO]: First In, First Out — первым пришёл, первым ушёл (очередь)

*[ООП]: Объектно-ориентированное программирование
*[SOLID]: Пять принципов проектирования классов: SRP, OCP, LSP, ISP, DIP
*[SRP]: Single Responsibility Principle — у класса одна причина для изменения
*[OCP]: Open/Closed Principle — открыт для расширения, закрыт для изменения
*[LSP]: Liskov Substitution Principle — наследник заменяет родителя без нарушения поведения
*[ISP]: Interface Segregation Principle — много узких интерфейсов лучше одного толстого
*[DIP]: Dependency Inversion Principle — зависимость от абстракций, а не от реализаций
*[DTO]: Data Transfer Object — объект для передачи данных между слоями или сервисами

*[IoC]: Inversion of Control — объекты создаёт и связывает контейнер, а не сам код
*[DI]: Dependency Injection — внедрение зависимостей извне
*[AOP]: Aspect-Oriented Programming — сквозная логика (транзакции, логи) через прокси
*[BPP]: BeanPostProcessor — хук Spring для обработки бинов после создания
*[BFPP]: BeanFactoryPostProcessor — хук Spring для правки определений бинов до их создания
*[CGLIB]: Библиотека генерации прокси через наследование от класса
*[BOM]: Bill of Materials — набор согласованных версий зависимостей
*[MVC]: Model-View-Controller — разделение на модель, представление и контроллер
*[JPA]: Jakarta Persistence API — стандарт ORM в Java
*[JDBC]: Java Database Connectivity — низкоуровневый API доступа к реляционным БД
*[JTA]: Jakarta Transactions — распределённые транзакции через XA
*[R2DBC]: Reactive Relational Database Connectivity — реактивный доступ к реляционным БД
*[CRUD]: Create, Read, Update, Delete — базовые операции с данными

*[СУБД]: Система управления базами данных
*[ACID]: Atomicity, Consistency, Isolation, Durability — гарантии транзакции
*[MVCC]: Multi-Version Concurrency Control — читатели видят снимок версий строк и не блокируют писателей
*[WAL]: Write-Ahead Log — журнал, который пишется на диск до изменения данных
*[CTE]: Common Table Expression — именованный подзапрос в WITH
*[OLTP]: Online Transaction Processing — много коротких транзакций
*[OLAP]: Online Analytical Processing — тяжёлые аналитические запросы
*[BRIN]: Block Range Index — компактный индекс по диапазонам блоков
*[GIN]: Generalized Inverted Index — инвертированный индекс для JSONB, массивов, полнотекста
*[BCNF]: Нормальная форма Бойса — Кодда
*[SSI]: Serializable Snapshot Isolation — SERIALIZABLE поверх снимков в PostgreSQL
*[TTL]: Time To Live — время жизни записи
*[LRU]: Least Recently Used — вытеснять то, что дольше всего не трогали
*[LFU]: Least Frequently Used — вытеснять то, что трогали реже всего

*[ISR]: In-Sync Replicas — реплики партиции, не отставшие от лидера
*[LEO]: Log End Offset — оффсет следующего сообщения в конце партиции
*[DLQ]: Dead Letter Queue — очередь для сообщений, которые не удалось обработать

*[CAP]: Consistency, Availability, Partition tolerance — при разрыве сети выбирай C или A
*[PACELC]: Расширение CAP: без аварии выбор между latency и consistency
*[ZAB]: ZooKeeper Atomic Broadcast — протокол консенсуса ZooKeeper
*[QPS]: Queries Per Second — запросов в секунду
*[RPS]: Requests Per Second — запросов в секунду
*[CDN]: Content Delivery Network — сеть edge-серверов рядом с пользователями
*[KGS]: Key Generation Service — сервис заранее сгенерированных ключей
*[SRE]: Site Reliability Engineering — подход к эксплуатации от Google
*[DDD]: Domain-Driven Design — проектирование от предметной области
*[CQRS]: Command Query Responsibility Segregation — раздельные модели записи и чтения
*[BFF]: Backend For Frontend — отдельный бэкенд под конкретный клиент

*[OSI]: Семиуровневая сетевая модель Open Systems Interconnection
*[TCP]: Transmission Control Protocol — надёжная доставка с установкой соединения
*[UDP]: User Datagram Protocol — доставка датаграмм без гарантий и соединения
*[TLS]: Transport Layer Security — шифрование и аутентификация поверх TCP
*[QUIC]: Транспорт поверх UDP со встроенным TLS, основа HTTP/3
*[DNS]: Domain Name System — превращает имя домена в IP-адрес
*[CORS]: Cross-Origin Resource Sharing — правила запросов браузера к чужому домену
*[SSE]: Server-Sent Events — односторонний поток событий от сервера по HTTP
*[JWT]: JSON Web Token — подписанный токен с данными пользователя
*[RTT]: Round-Trip Time — время туда и обратно
*[HOL]: Head-of-Line blocking — потерянный пакет задерживает всё, что за ним

*[CI]: Continuous Integration — сборка и тесты на каждый коммит
*[K8s]: Kubernetes — оркестратор контейнеров
