export default {
  id: "key-value-store",
  title: "Design a Distributed Key-Value Store",
  difficulty: "hard",
  minutes: 15,
  tags: ["replication", "consistency", "storage"],
  prompt: "Build a Dynamo-style key-value store holding 100 TB across hundreds of nodes. It must accept writes even when some nodes are down, serve 1 million operations per second, and let clients tune consistency per request.",
  requirements: {
    functional: ["put(key, value) and get(key)", "Tunable consistency per request", "Add and remove nodes"],
    nonFunctional: ["Always writable", "Single-digit ms latency", "Survive node and rack failures"]
  },
  quiz: [
    {
      q: "How are keys spread across nodes?",
      choices: ["Alphabetical ranges by hand", "Random each time", "Consistent hashing with virtual nodes", "All on one node"],
      answer: 2,
      why: "The ring spreads keys evenly and limits movement when nodes change.",
      tag: "sharding"
    },
    {
      q: "N=3, W=2, R=2. Why is this consistent-ish?",
      choices: ["R + W > N, so reads overlap the latest write", "Because 2 is even", "W ignores replicas", "It isn't"],
      answer: 0,
      why: "Overlapping read and write sets mean at least one read replica saw the write.",
      tag: "consistency"
    },
    {
      q: "A replica is down during a write. To stay writable?",
      choices: ["Reject the write", "Wait for repair", "Write to the client disk", "Hinted handoff to another node"],
      answer: 3,
      why: "A stand-in keeps the write and hands it back when the replica returns.",
      tag: "reliability"
    },
    {
      q: "Two concurrent writes to the same key. Detect with?",
      choices: ["Wall-clock only", "Vector clocks", "Key length", "Checksums"],
      answer: 1,
      why: "Vector clocks show whether versions are ordered or concurrent siblings.",
      tag: "consistency"
    },
    {
      q: "Replicas drift after failures. Find differences efficiently?",
      choices: ["Compare Merkle trees per key range", "Copy everything nightly", "Ask clients", "Ignore drift"],
      answer: 0,
      why: "Hash trees narrow down mismatched ranges with little data transfer.",
      tag: "replication"
    },
    {
      q: "How do nodes learn about membership and failures?",
      choices: ["Central spreadsheet", "Email", "Gossip protocol", "DNS TTL"],
      answer: 2,
      why: "Gossip spreads membership info without a single coordinator.",
      tag: "reliability"
    },
    {
      q: "Storage engine for write-heavy load?",
      choices: ["Plain text files", "LSM tree with a write-ahead log", "B-tree only with in-place updates", "In-memory only"],
      answer: 1,
      why: "Sequential writes plus compaction give high write throughput and durability.",
      tag: "storage"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Client", kind: "client", x: 180, y: 50 },
      { id: "coord", label: "Coordinator", kind: "service", x: 180, y: 145 },
      { id: "a", label: "Node A", kind: "db", x: 60, y: 240 },
      { id: "b", label: "Node B", kind: "db", x: 180, y: 240 },
      { id: "c", label: "Node C", kind: "db", x: 300, y: 240 },
      { id: "d", label: "Node D (hint)", kind: "db", x: 180, y: 335 },
      { id: "engine", label: "LSM + WAL", kind: "storage", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "coord" },
      { from: "coord", to: "a", label: "W/R" },
      { from: "coord", to: "b" },
      { from: "coord", to: "c" },
      { from: "coord", to: "d", label: "hint" },
      { from: "a", to: "engine" },
      { from: "b", to: "c", label: "gossip" }
    ],
    steps: [
      {
        add: ["client", "coord"],
        caption: "Any node can coordinate a request; it hashes the key to find its replicas on the ring."
      },
      {
        add: ["a", "b", "c"],
        caption: "The key's three replicas are the next distinct nodes clockwise; the coordinator waits for W or R of them."
      },
      {
        add: ["d"],
        caption: "If a replica is down, a neighbor stores the write with a hint and hands it back later."
      },
      {
        add: ["engine"],
        caption: "Each node writes to a WAL and an in-memory table, flushing to sorted files compacted in the background."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "get/put over 100 TB, always writable, tunable consistency, elastic membership, millisecond latency."
    },
    {
      heading: "Partitioning and replication",
      body: "Consistent hashing with virtual nodes; each key replicated to N=3 distinct nodes (and racks). Any node can coordinate."
    },
    {
      heading: "Consistency",
      body: "Clients choose W and R; R + W > N for strong-ish reads, W=1 for fast writes. Versions tracked with vector clocks; concurrent siblings returned for the client or a rule to merge."
    },
    {
      heading: "Failure handling",
      body: "Sloppy quorum with hinted handoff during outages; read repair fixes stale replicas on reads; anti-entropy with Merkle trees in the background; gossip for membership."
    },
    {
      heading: "Storage engine",
      body: "WAL plus memtable plus SSTables (LSM), with bloom filters to skip files on reads and compaction to reclaim space."
    }
  ],
  keyPoints: [
    "Uses consistent hashing with virtual nodes",
    "Replicates to N nodes across racks",
    "Explains quorum R + W > N",
    "Uses hinted handoff for availability",
    "Detects conflicts with vector clocks",
    "Uses Merkle trees and read repair",
    "Uses gossip for membership",
    "Picks an LSM-based storage engine"
  ],
  cardIds: ["quorum", "hinted-handoff", "vector-clock", "merkle-tree", "lsm-tree"]
};
