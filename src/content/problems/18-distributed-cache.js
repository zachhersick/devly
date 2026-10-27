export default {
  id: "distributed-cache",
  title: "Design a Distributed Cache",
  difficulty: "medium",
  minutes: 12,
  tags: ["caching", "sharding", "replication"],
  prompt: "Build an in-memory cache cluster like Memcached or Redis for a company's services. It must hold 2 TB of hot data and serve 5 million reads per second with sub-millisecond latency. Nodes fail and get added regularly.",
  requirements: {
    functional: [
      "get, set and delete by key with optional TTL",
      "Evict entries when memory is full",
      "Add or remove nodes without a full reshuffle"
    ],
    nonFunctional: ["Sub-millisecond p99 reads", "Lose a node without losing much hit rate", "Scale linearly with nodes"]
  },
  quiz: [
    {
      q: "2 TB of data on 64 GB nodes (50 GB usable). Nodes needed?",
      choices: ["About 40", "About 4", "About 400", "About 4,000"],
      answer: 0,
      why: "2,000 GB ÷ 50 GB ≈ 40 nodes, before replicas.",
      tag: "estimation"
    },
    {
      q: "Why not route with hash(key) mod N?",
      choices: ["It's slow", "It isn't deterministic", "Changing N remaps almost every key", "It needs a DB"],
      answer: 2,
      why: "Adding one node to mod-N moves most keys, causing a hit-rate collapse.",
      tag: "sharding"
    },
    {
      q: "What does consistent hashing give us?",
      choices: ["Strong consistency", "Only ~1/N of keys move when a node joins", "Encryption", "Faster hashing"],
      answer: 1,
      why: "Keys map to points on a ring; a new node takes over only its neighbors' slices.",
      tag: "sharding"
    },
    {
      q: "Why use virtual nodes on the ring?",
      choices: ["To save memory", "To encrypt keys", "To store logs", "To spread load evenly across nodes"],
      answer: 3,
      why: "Many small slices per physical node smooth out uneven ranges and spread a failed node's load.",
      tag: "load-balancing"
    },
    {
      q: "Memory is full. Common eviction?",
      choices: ["Random server restart", "Oldest server first", "Least recently used", "Largest key first always"],
      answer: 2,
      why: "LRU (or an approximation) keeps the entries most likely to be used again.",
      tag: "caching"
    },
    {
      q: "One key gets 500k reads/s. Fix?",
      choices: ["Replicate it across nodes or cache it in-process on clients", "Bigger TTL", "Delete it", "Use mod-N hashing"],
      answer: 0,
      why: "Spread a hot key by copying it or keeping a short-lived local copy in each client.",
      tag: "caching"
    },
    {
      q: "Node dies. How to keep hit rate up?",
      choices: ["Restart all nodes", "Disable caching", "Shrink TTLs", "Replicate each shard to a follower"],
      answer: 3,
      why: "A replica can take over quickly; without one, its keys miss until refilled from the database.",
      tag: "replication"
    }
  ],
  diagram: {
    nodes: [
      { id: "app", label: "App Server", kind: "service", x: 180, y: 50 },
      { id: "lib", label: "Client Lib", kind: "service", x: 180, y: 145 },
      { id: "ring", label: "Hash Ring Cfg", kind: "db", x: 180, y: 240 },
      { id: "n1", label: "Cache Node A", kind: "cache", x: 60, y: 335 },
      { id: "n2", label: "Cache Node B", kind: "cache", x: 180, y: 335 },
      { id: "n3", label: "Cache Node C", kind: "cache", x: 300, y: 335 },
      { id: "r1", label: "Replica A", kind: "cache", x: 100, y: 430 },
      { id: "r3", label: "Replica C", kind: "cache", x: 260, y: 430 }
    ],
    edges: [
      { from: "app", to: "lib" },
      { from: "lib", to: "ring", label: "watch" },
      { from: "lib", to: "n1" },
      { from: "lib", to: "n2" },
      { from: "lib", to: "n3" },
      { from: "n1", to: "r1", label: "async" },
      { from: "n3", to: "r3" }
    ],
    steps: [
      {
        add: ["app", "lib"],
        caption: "Apps use a client library that picks the right node for each key itself, avoiding an extra hop."
      },
      {
        add: ["n1", "n2", "n3"],
        caption: "Keys are spread over cache nodes with consistent hashing and virtual nodes."
      },
      { add: ["ring"], caption: "A small config service holds the ring membership; clients watch it for changes." },
      { add: ["r1", "r3"], caption: "Each node streams writes to a replica that can take over if it fails." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "get/set/delete with TTL, eviction, elastic membership, sub-millisecond reads at 5M/s over 2 TB."
    },
    {
      heading: "Partitioning",
      body: "Consistent hashing with ~100 virtual nodes per server. Clients compute the owner locally from a ring config held in etcd or ZooKeeper."
    },
    {
      heading: "Node internals",
      body: "A hash table plus LRU list per node, with slab or arena allocation to limit fragmentation. Expired keys are removed lazily on access and by a background sampler."
    },
    {
      heading: "Replication",
      body: "Each shard has an async replica; on failure, the config service promotes it and clients update their ring. Some recent writes may be lost, which is fine for a cache."
    },
    {
      heading: "Hot keys and scale",
      body: "Detect hot keys and replicate them or cache locally in clients for a second. Add nodes to scale; only ~1/N of keys move."
    }
  ],
  keyPoints: [
    "Estimates node count from memory",
    "Explains why mod-N hashing breaks on resize",
    "Uses consistent hashing with virtual nodes",
    "Describes an eviction policy like LRU",
    "Handles TTL expiry lazily and in the background",
    "Replicates shards for failover",
    "Addresses hot keys",
    "Routes in the client library to save a hop"
  ],
  cardIds: ["consistent-hashing", "lru-eviction", "hot-key", "cache-stampede", "write-through"]
};
