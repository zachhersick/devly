export default {
  id: "message-queue",
  title: "Design a Distributed Message Queue",
  difficulty: "hard",
  minutes: 15,
  tags: ["queues", "replication", "storage"],
  prompt: "Build a Kafka-style message system for a company's event pipelines: 2 million messages per second at 1 KB each, kept for 7 days so consumers can replay. Many consumer teams read the same topics at their own pace, and no acknowledged message may be lost.",
  requirements: {
    functional: [
      "Producers publish to named topics",
      "Consumers read in order within a partition and track their position",
      "Multiple consumer groups read independently",
      "Retain messages for a set period"
    ],
    nonFunctional: ["2M msgs/s with low latency", "No loss once acknowledged", "Scale by adding brokers"]
  },
  quiz: [
    {
      q: "2M msgs/s × 1 KB × 7 days. Storage before replication?",
      choices: ["About 1.2 PB", "About 120 TB", "About 12 PB", "About 12 TB"],
      answer: 0,
      why: "2 GB/s × 604,800 s ≈ 1.2 PB, and roughly 3.6 PB with 3 replicas.",
      tag: "estimation"
    },
    {
      q: "Why can a log store sustain huge write rates?",
      choices: [
        "Everything in RAM",
        "Random writes are fast",
        "Append-only sequential disk writes and batching",
        "It skips disks"
      ],
      answer: 2,
      why: "Sequential appends and batched I/O make disks and page cache very efficient.",
      tag: "storage"
    },
    {
      q: "How does a topic scale beyond one broker?",
      choices: [
        "Bigger broker only",
        "Split it into partitions spread over brokers",
        "Copy every message to every broker",
        "Use one partition per message"
      ],
      answer: 1,
      why: "Partitions are the unit of parallelism for both writes and consumers.",
      tag: "sharding"
    },
    {
      q: "Ordering guarantee?",
      choices: [
        "Global across the topic",
        "None at all",
        "Alphabetical",
        "Within a partition only; key messages to keep related ones together"
      ],
      answer: 3,
      why: "Same key → same partition → ordered relative to each other.",
      tag: "consistency"
    },
    {
      q: "When should the broker ack a producer for durability?",
      choices: [
        "Immediately on receipt in memory",
        "After consumers read it",
        "After the leader and in-sync replicas have the message",
        "Never"
      ],
      answer: 2,
      why: "Waiting for in-sync replicas means a leader crash doesn't lose acked data.",
      tag: "replication"
    },
    {
      q: "How do consumers track progress?",
      choices: [
        "Committed offsets per partition per group",
        "Broker deletes messages as read",
        "Timestamps in the client only",
        "Message ids in email"
      ],
      answer: 0,
      why: "Offsets let each group resume and replay independently.",
      tag: "queues"
    },
    {
      q: "Consumer joins or dies in a group. Then?",
      choices: [
        "All consumers stop forever",
        "Messages are dropped",
        "Topic is deleted",
        "Partitions are rebalanced among live members"
      ],
      answer: 3,
      why: "A group coordinator reassigns partitions so all keep being consumed.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "prod", label: "Producers", kind: "client", x: 180, y: 50 },
      { id: "b1", label: "Broker 1", kind: "queue", x: 60, y: 145 },
      { id: "b2", label: "Broker 2", kind: "queue", x: 180, y: 145 },
      { id: "b3", label: "Broker 3", kind: "queue", x: 300, y: 145 },
      { id: "ctrl", label: "Controller", kind: "service", x: 180, y: 240 },
      { id: "disk", label: "Segment Files", kind: "storage", x: 180, y: 335 },
      { id: "g1", label: "Consumer Grp A", kind: "worker", x: 100, y: 430 },
      { id: "g2", label: "Consumer Grp B", kind: "worker", x: 260, y: 430 }
    ],
    edges: [
      { from: "prod", to: "b1", label: "P0" },
      { from: "prod", to: "b2", label: "P1" },
      { from: "b1", to: "b3", label: "replicate" },
      { from: "b2", to: "b3" },
      { from: "ctrl", to: "b1" },
      { from: "ctrl", to: "b2" },
      { from: "b1", to: "disk" },
      { from: "g1", to: "b1", label: "offset" },
      { from: "g2", to: "b2" }
    ],
    steps: [
      {
        add: ["prod", "b1", "b2"],
        caption: "Producers send batches to the leader broker of each partition, choosing the partition by key."
      },
      { add: ["b3"], caption: "Followers copy each partition; the leader acks once in-sync replicas have the batch." },
      { add: ["disk"], caption: "Brokers append to segment files on disk and delete whole segments after retention." },
      {
        add: ["ctrl"],
        caption: "A controller (backed by consensus) tracks brokers, partition leaders and replica sets."
      },
      { add: ["g1", "g2"], caption: "Consumer groups pull from partitions and commit offsets, each at its own pace." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Durable pub/sub at 2M msgs/s, 7-day retention with replay, independent consumer groups, ordered per partition."
    },
    {
      heading: "Data model",
      body: "Topic → partitions → append-only logs made of segment files with an offset index. Messages are immutable and addressed by offset."
    },
    {
      heading: "Replication",
      body: "Each partition has a leader and followers; in-sync replicas must ack before the producer is acknowledged (acks=all). If the leader fails, the controller elects an in-sync follower."
    },
    {
      heading: "Consumers",
      body: "Pull model with long polling. Groups split partitions among members; offsets are committed to an internal topic. At-least-once by default; idempotent consumers or transactions for effectively-once."
    },
    {
      heading: "Performance",
      body: "Batching, compression, zero-copy reads from page cache, and adding partitions and brokers to scale."
    }
  ],
  keyPoints: [
    "Estimates retained storage",
    "Uses append-only partitioned logs",
    "Explains per-partition ordering and keys",
    "Acks after in-sync replicas",
    "Elects new leaders through a controller",
    "Tracks consumer offsets per group",
    "Rebalances partitions in a group",
    "Mentions batching and zero-copy"
  ],
  cardIds: ["queue-vs-log", "consumer-groups", "partition-ordering", "delivery-semantics", "leader-follower"]
};
