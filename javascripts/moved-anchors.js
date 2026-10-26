/*
 * Старые ссылки на темы, которые переехали при реструктуризации базы
 * (STRUCTURE-PLAN.md, раздел 4). mkdocs-redirects переносит якорь как есть:
 * java/multithreading/#jmm ведёт на concurrency/threads/#jmm, а тема живёт на
 * concurrency/jmm/. Если якоря из адреса нет на открытой странице, а он есть в
 * карте ниже, — переходим на страницу, где тема теперь.
 *
 * Ключ — адрес страницы, на которую попадает старая ссылка (сама страница или
 * цель редиректа), значение — {старый якорь: новый адрес от корня сайта}.
 */
(function () {
  var moved = {
    "algorithms/algorithms/": {
      "dijkstra": "algorithms/sorting-graphs/#dijkstra",
      "graph-bfs": "algorithms/sorting-graphs/#graph-bfs",
      "graph-dfs": "algorithms/sorting-graphs/#graph-dfs",
      "graph-representation": "algorithms/sorting-graphs/#graph-representation",
      "graphs": "algorithms/sorting-graphs/#graphs",
      "merge-sort": "algorithms/sorting-graphs/#merge-sort",
      "quick-sort": "algorithms/sorting-graphs/#quick-sort",
      "sorting": "algorithms/sorting-graphs/#sorting",
      "sorting-overview": "algorithms/sorting-graphs/#sorting-overview",
      "techniques": "algorithms/leetcode-patterns/"
    },
    "algorithms/leetcode-patterns/": {
      "bfs": "algorithms/leetcode-trees-dp/#bfs",
      "coin-change": "algorithms/leetcode-trees-dp/#coin-change",
      "dfs": "algorithms/leetcode-trees-dp/#dfs",
      "dp": "algorithms/leetcode-trees-dp/#dp",
      "dp-basics": "algorithms/leetcode-trees-dp/#dp-basics",
      "islands": "algorithms/leetcode-trees-dp/#islands",
      "kadane": "algorithms/leetcode-trees-dp/#kadane",
      "lcs": "algorithms/leetcode-trees-dp/#lcs",
      "maze": "algorithms/leetcode-trees-dp/#maze",
      "validate-bst": "algorithms/leetcode-trees-dp/#validate-bst"
    },
    "architecture/ddd/": {
      "hexagonal": "architecture/hexagonal/#hexagonal",
      "layered": "architecture/hexagonal/#layered",
      "layered-vs-hexagonal": "architecture/hexagonal/#layered-vs-hexagonal",
      "modular-monolith": "architecture/microservices/#modular-monolith",
      "styles": "architecture/hexagonal/#styles"
    },
    "concurrency/threads/": {
      "aqs": "concurrency/locks/#aqs",
      "async": "concurrency/executors/#async",
      "atomics": "concurrency/jmm/#atomics",
      "cas-aba": "concurrency/jmm/#cas-aba",
      "cf-errors": "concurrency/executors/#cf-errors",
      "completablefuture": "concurrency/executors/#completablefuture",
      "concurrent-collections": "concurrency/concurrent-collections/",
      "deadlock": "concurrency/deadlock/#deadlock",
      "deadlock-detection": "concurrency/deadlock/#deadlock-detection",
      "deadlock-prevention": "concurrency/deadlock/#deadlock-prevention",
      "executors": "concurrency/executors/#executors",
      "executors-factories": "concurrency/executors/#executors-factories",
      "false-sharing": "concurrency/jmm/#false-sharing",
      "final-fields": "concurrency/jmm/#final-fields",
      "forkjoinpool": "concurrency/executors/#forkjoinpool",
      "future": "concurrency/executors/#future",
      "happens-before": "concurrency/jmm/#happens-before",
      "jmm": "concurrency/jmm/#jmm",
      "jmm-basics": "concurrency/jmm/#jmm-basics",
      "latch-barrier": "concurrency/locks/#latch-barrier",
      "livelock-starvation": "concurrency/deadlock/#livelock-starvation",
      "liveness": "concurrency/deadlock/#liveness",
      "locks-atomics": "concurrency/locks/#locks-atomics",
      "longadder": "concurrency/jmm/#longadder",
      "loom": "concurrency/virtual-threads/#loom",
      "monitors": "concurrency/locks/#monitors",
      "park-unpark": "concurrency/locks/#park-unpark",
      "pinning": "concurrency/virtual-threads/#pinning",
      "reentrantlock": "concurrency/locks/#reentrantlock",
      "rwlock-condition": "concurrency/locks/#rwlock-condition",
      "semaphore": "concurrency/locks/#semaphore",
      "structured-concurrency": "concurrency/virtual-threads/#structured-concurrency",
      "synchronized": "concurrency/locks/#synchronized",
      "synchronizers": "concurrency/locks/#synchronizers",
      "thread-pool-executor": "concurrency/executors/#thread-pool-executor",
      "under-the-hood": "concurrency/locks/#under-the-hood",
      "virtual-threads": "concurrency/virtual-threads/#virtual-threads",
      "volatile": "concurrency/jmm/#volatile",
      "wait-notify": "concurrency/locks/#wait-notify",
      "why-pools": "concurrency/executors/#why-pools"
    },
    "database/nosql/": {
      "cache-aside": "spring/spring-caching/#cache-aside",
      "cap": "system-design/distributed-data/#cap",
      "cap-theorem": "system-design/distributed-data/#cap",
      "rate-limiting": "architecture/microservices/#rate-limiting",
      "redis-patterns": "database/nosql/#key-value"
    },
    "database/sql/": {
      "acid": "database/transactions/#acid",
      "acid-properties": "database/transactions/#acid-properties",
      "isolation": "database/transactions/#isolation",
      "isolation-levels": "database/transactions/#isolation-levels",
      "mvcc": "database/transactions/#mvcc",
      "mvcc-how": "database/transactions/#mvcc-how",
      "mvcc-isolation": "database/transactions/#mvcc-isolation",
      "mvcc-postgres-vs-mysql": "database/transactions/#mvcc-postgres-vs-mysql",
      "read-anomalies": "database/transactions/#read-anomalies",
      "serializable": "database/transactions/#serializable",
      "vacuum": "database/transactions/#vacuum",
      "wal": "database/transactions/#wal"
    },
    "design/creational-patterns/": {
      "behavioral": "design/behavioral-patterns/#behavioral",
      "decorator": "design/structural-patterns/#decorator",
      "observer": "design/behavioral-patterns/#observer",
      "strategy": "design/behavioral-patterns/#strategy",
      "structural": "design/structural-patterns/#structural"
    },
    "infrastructure/docker/": {
      "ci-cd": "infrastructure/cicd/#ci-cd",
      "cicd": "infrastructure/cicd/#cicd",
      "deploy-strategies": "infrastructure/cicd/#deploy-strategies",
      "flyway": "infrastructure/cicd/#flyway",
      "flyway-checksum": "infrastructure/cicd/#flyway-checksum",
      "flyway-lock": "infrastructure/cicd/#flyway-lock",
      "k8s-basics": "infrastructure/kubernetes/#k8s-basics",
      "kubernetes": "infrastructure/kubernetes/#kubernetes",
      "migrations": "infrastructure/cicd/#migrations",
      "migrations-cicd": "infrastructure/cicd/#migrations-cicd",
      "observability": "infrastructure/observability/",
      "pipeline": "infrastructure/cicd/#pipeline",
      "proxy-gateway": "infrastructure/kubernetes/#proxy-gateway",
      "reverse-proxy": "infrastructure/kubernetes/#reverse-proxy",
      "zero-downtime": "infrastructure/cicd/#zero-downtime"
    },
    "java/collections/": {
      "bucket-index": "java/hashmap/#bucket-index",
      "collisions": "java/hashmap/#collisions",
      "concurrent-collections": "concurrency/concurrent-collections/#concurrent-collections",
      "concurrenthashmap": "concurrency/concurrent-collections/#concurrenthashmap",
      "copyonwritearraylist": "concurrency/concurrent-collections/#copyonwritearraylist",
      "hashmap": "java/hashmap/#hashmap",
      "hashmap-internals": "java/hashmap/#hashmap-internals",
      "hashtable-vector": "concurrency/concurrent-collections/#hashtable-vector",
      "map-choice": "java/hashmap/#map-choice",
      "rehashing": "java/hashmap/#rehashing",
      "treeify": "java/hashmap/#treeify"
    },
    "java/oop/": {
      "cohesion-coupling": "design/composition/#cohesion-coupling",
      "composition": "design/composition/#composition",
      "coupling-cohesion": "design/composition/#coupling-cohesion",
      "delegation": "design/composition/#delegation",
      "fragile-base-class": "design/composition/#fragile-base-class",
      "high-cohesion": "design/composition/#high-cohesion",
      "inheritance": "design/composition/#fragile-base-class",
      "low-coupling": "design/composition/#low-coupling",
      "microservices": "architecture/microservices/#service-boundaries",
      "when-inherit": "design/composition/#when-inherit"
    },
    "java/streams/": {
      "core-interfaces": "java/functional/#core-interfaces",
      "custom-functional-interface": "java/functional/#custom-functional-interface",
      "effectively-final": "java/functional/#effectively-final",
      "functional": "java/functional/#functional",
      "functional-interfaces": "java/functional/#functional-interfaces",
      "method-references": "java/functional/#method-references",
      "optional": "java/functional/#optional",
      "optional-basics": "java/functional/#optional-basics",
      "optional-chains": "java/functional/#optional-chains",
      "orelse": "java/functional/#orelse"
    },
    "networks/networks/": {
      "api-styles": "networks/api-styles/#api-styles",
      "grpc": "networks/api-styles/#grpc",
      "realtime": "networks/api-styles/#realtime",
      "rest": "networks/api-styles/#rest",
      "rest-vs-grpc": "networks/api-styles/#rest-vs-grpc",
      "websocket": "networks/api-styles/#websocket"
    },
    "spring/spring-boot/": {
      "actuator": "spring/spring-actuator/"
    },
    "spring/spring-data-jpa/": {
      "isolation": "spring/spring-transactions/#isolation",
      "isolation-locking": "database/locking/#row-locking",
      "nested": "spring/spring-transactions/#nested",
      "optimistic-locking": "database/locking/#optimistic-locking",
      "other-propagation": "spring/spring-transactions/#other-propagation",
      "pessimistic-locking": "database/locking/#pessimistic-locking",
      "propagation": "spring/spring-transactions/#propagation",
      "required": "spring/spring-transactions/#required",
      "requires-new": "spring/spring-transactions/#requires-new",
      "rollback-rules": "spring/spring-transactions/#rollback-rules",
      "self-invocation-transactions": "spring/spring-transactions/#self-invocation-transactions",
      "transactional": "spring/spring-transactions/#transactional",
      "transactional-flow": "spring/spring-transactions/#transactional-flow"
    },
    "spring/spring-security/": {
      "adapters-config": "architecture/hexagonal/#adapters-config",
      "double-entities": "architecture/hexagonal/#double-entities",
      "kafka-listener": "kafka/spring-kafka/#kafka-listener",
      "listener-config": "kafka/spring-kafka/#listener-config",
      "spring-ddd": "architecture/hexagonal/#spring-ddd",
      "spring-kafka": "kafka/spring-kafka/#spring-kafka",
      "transactional-ddd": "architecture/hexagonal/#transactional-ddd",
      "where-annotations": "architecture/hexagonal/#where-annotations"
    },
    "spring/spring-testing/": {
      "actuator": "spring/spring-actuator/#actuator",
      "actuator-micrometer": "spring/spring-actuator/#actuator-micrometer",
      "cacheable": "spring/spring-caching/#cacheable",
      "caching": "spring/spring-caching/#caching",
      "condition-vs-unless": "spring/spring-caching/#condition-vs-unless",
      "micrometer": "spring/spring-actuator/#micrometer",
      "mono-flux": "spring/spring-mvc/#mono-flux",
      "prometheus": "spring/spring-actuator/#prometheus",
      "redis-cache-config": "spring/spring-caching/#redis-cache-config",
      "webflux": "spring/spring-mvc/#webflux",
      "webflux-vs-mvc": "spring/spring-mvc/#webflux-vs-mvc",
      "why-reactive": "spring/spring-mvc/#why-reactive"
    },
    "system-design/interview/": {
      "api-gateway": "architecture/microservices/#api-gateway",
      "building-blocks": "system-design/building-blocks/#building-blocks",
      "bulkhead": "architecture/microservices/#bulkhead",
      "cache-stampede": "system-design/building-blocks/#cache-stampede",
      "caching": "system-design/building-blocks/#caching",
      "cap": "system-design/distributed-data/#cap",
      "cdn": "system-design/building-blocks/#cdn",
      "circuit-breaker": "architecture/microservices/#circuit-breaker",
      "consensus": "system-design/distributed-data/#consensus",
      "consistency-models": "system-design/distributed-data/#consistency-models",
      "consistent-hashing": "system-design/distributed-data/#consistent-hashing",
      "delivery-guarantees": "architecture/distributed-transactions/#delivery-guarantees",
      "distributed": "system-design/distributed-data/#distributed",
      "eviction": "system-design/building-blocks/#eviction",
      "health-checks": "infrastructure/kubernetes/#health-checks",
      "l4-l7": "system-design/building-blocks/#l4-l7",
      "lb-algorithms": "system-design/building-blocks/#lb-algorithms",
      "message-queues": "system-design/building-blocks/#message-queues",
      "microservices": "architecture/microservices/#microservices",
      "monolith-vs-microservices": "architecture/microservices/#monolith-vs-microservices",
      "network-basics": "networks/networks/",
      "observability": "infrastructure/observability/#observability",
      "outbox": "architecture/distributed-transactions/#outbox",
      "pacelc": "system-design/distributed-data/#pacelc",
      "partitioning": "system-design/distributed-data/#partitioning",
      "polyglot-persistence": "database/nosql/#polyglot",
      "rate-limiting": "architecture/microservices/#rate-limiting",
      "redis-hazelcast": "database/nosql/#redis-cluster",
      "reliability": "architecture/microservices/#reliability",
      "replication": "system-design/distributed-data/#replication",
      "saga": "architecture/distributed-transactions/#saga",
      "security": "spring/spring-security/#sessions-vs-jwt",
      "sharding": "system-design/distributed-data/#sharding",
      "sidecar": "infrastructure/kubernetes/#sidecar",
      "sql-vs-nosql": "database/nosql/#nosql-vs-sql",
      "sticky-sessions": "system-design/building-blocks/#sticky-sessions",
      "sync-async": "architecture/microservices/#sync-async",
      "timeout-retry": "architecture/microservices/#timeout-retry",
      "two-phase-commit": "architecture/distributed-transactions/#two-phase-commit"
    }
  };

  var anchor = decodeURIComponent(location.hash.slice(1));
  if (!anchor || document.getElementById(anchor)) return;

  var path = location.pathname.replace(/index\.html$/, "");
  for (var page in moved) {
    var target = moved[page][anchor];
    if (target && path.slice(-page.length) === page) {
      location.replace(path.slice(0, path.length - page.length) + target);
      return;
    }
  }
})();
