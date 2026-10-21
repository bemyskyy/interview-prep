---
tags:
  - Java
  - Многопоточность
---

# Потокобезопасные коллекции

Коллекции для многопоточного кода: какие очереди из `java.util.concurrent` брать для передачи задач между потоками.

## Блокирующие очереди { #blocking-queues }

`BlockingQueue` блокирует поток, который берёт элемент из пустой очереди или кладёт в полную. На ней строят producer-consumer и очереди задач пулов потоков ([`ThreadPoolExecutor`](executors.md#thread-pool-executor)).

| Очередь | Когда использовать |
|---|---|
| `ArrayBlockingQueue` | Ограниченная очередь задач, жёсткий лимит |
| `LinkedBlockingQueue` | Очередь задач с высокой пропускной способностью |
| `SynchronousQueue` | Передача «из рук в руки» без буфера |

## Шпаргалка { #cheatsheet }

<!-- --8<-- [start:cheatsheet] -->
| Тема | Запомнить |
|---|---|
| **`BlockingQueue`** | `ArrayBlockingQueue` — ограниченная, `LinkedBlockingQueue` — для пропускной способности, `SynchronousQueue` — без буфера |

<!-- --8<-- [end:cheatsheet] -->
