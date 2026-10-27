export default {
  id: "log-aggregation",
  title: "Design Log Aggregation",
  difficulty: "medium",
  minutes: 13,
  tags: ["observability", "queues", "storage"],
  prompt: "5,000 servers produce application logs that engineers search during incidents. Together they emit 2 GB of logs per second at peak. Logs must be searchable within 30 seconds, kept hot for 14 days and archived for a year.",
  requirements: {
    functional: ["Collect logs from every server", "Search by text, service, level and time range", "Archive older logs cheaply"],
    nonFunctional: ["Searchable within 30 seconds", "No log loss during spikes", "Cost-efficient at 2 GB/s"]
  },
  quiz: [
    {
      q: "2 GB/s for 14 days. Hot storage before compression?",
      choices: ["About 240 TB", "About 24 TB", "About 24 PB", "About 2.4 PB"],
      answer: 3,
      why: "2 GB × 86,400 ≈ 173 TB a day; × 14 ≈ 2.4 PB, which is why compression and tiering matter.",
      tag: "estimation"
    },
    {
      q: "How do logs leave each server?",
      choices: [
        "Apps write directly to the search cluster",
        "A local agent tails files and ships batches",
        "Engineers SSH and copy",
        "Email"
      ],
      answer: 1,
      why: "A lightweight agent buffers, batches and retries without the app caring.",
      tag: "queues"
    },
    {
      q: "Why put a durable queue in the middle?",
      choices: [
        "To absorb spikes and let indexers fall behind safely",
        "To make logs slower",
        "To encrypt them",
        "It's required by law"
      ],
      answer: 0,
      why: "A log stream like Kafka buffers bursts and allows replay if indexing breaks.",
      tag: "queues"
    },
    {
      q: "Full-text indexing every log is costly. Cheaper option?",
      choices: [
        "Index nothing",
        "Store in SQL with LIKE queries",
        "Index only labels/time, scan compressed chunks for text",
        "Keep logs in RAM forever"
      ],
      answer: 2,
      why: "Label-indexed, chunked storage (Loki-style) trades slower grep for much lower cost.",
      tag: "search"
    },
    {
      q: "Archive after 14 days to?",
      choices: ["More SSDs", "Object storage in compressed columnar files", "Tape on each server", "Delete them"],
      answer: 1,
      why: "Cheap object storage holds a year of compressed logs; queries can still scan it.",
      tag: "storage"
    },
    {
      q: "A noisy service spams logs. Protect the system?",
      choices: ["Delete the service", "Bigger disks only", "Ignore", "Per-service rate limits and sampling of debug logs"],
      answer: 3,
      why: "Quotas keep one service's flood from drowning everyone else.",
      tag: "reliability"
    },
    {
      q: "Partition the index by?",
      choices: ["User name", "Log length", "Time (daily indexes), then service", "Random"],
      answer: 2,
      why: "Time partitions make retention a matter of dropping whole old indexes.",
      tag: "sharding"
    }
  ],
  diagram: {
    nodes: [
      { id: "srv", label: "App Servers", kind: "client", x: 180, y: 50 },
      { id: "agent", label: "Log Agent", kind: "worker", x: 180, y: 126 },
      { id: "q", label: "Log Stream", kind: "queue", x: 180, y: 202 },
      { id: "idx", label: "Indexers", kind: "worker", x: 100, y: 278 },
      { id: "arch", label: "Archiver", kind: "worker", x: 260, y: 278 },
      { id: "hot", label: "Hot Store", kind: "search", x: 100, y: 354 },
      { id: "cold", label: "Object Archive", kind: "storage", x: 260, y: 354 },
      { id: "ui", label: "Search UI", kind: "service", x: 180, y: 430 }
    ],
    edges: [
      { from: "srv", to: "agent" },
      { from: "agent", to: "q", label: "batches" },
      { from: "q", to: "idx" },
      { from: "q", to: "arch" },
      { from: "idx", to: "hot" },
      { from: "arch", to: "cold" },
      { from: "ui", to: "hot" },
      { from: "ui", to: "cold", label: "slow" }
    ],
    steps: [
      {
        add: ["srv", "agent"],
        caption: "An agent on each server tails log files, adds labels, compresses and ships batches."
      },
      { add: ["q"], caption: "Batches land in a partitioned log stream that buffers spikes and allows replay." },
      {
        add: ["idx", "hot"],
        caption: "Indexers write logs into time-partitioned hot storage, searchable within seconds."
      },
      {
        add: ["arch", "cold"],
        caption: "An archiver copies compressed chunks to object storage for the year-long retention."
      },
      { add: ["ui"], caption: "The search UI queries hot data fast and can scan the archive for older incidents." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Collect 2 GB/s from 5,000 servers, searchable in 30 s, 14 days hot, a year archived, at reasonable cost."
    },
    {
      heading: "Collection",
      body: "Agents tail files, attach service, host and level labels, batch and compress, and retry with local disk buffering."
    },
    {
      heading: "Pipeline",
      body: "A partitioned log stream decouples producers from indexers and enables replay after indexer failures."
    },
    {
      heading: "Storage",
      body: "Hot tier: time-partitioned indexes (daily), either full-text or label-only with compressed chunks to cut cost. Cold tier: compressed files in object storage."
    },
    {
      heading: "Operations",
      body: "Per-service quotas and sampling, retention by dropping old partitions, and dashboards for ingestion lag."
    }
  ],
  keyPoints: [
    "Estimates storage at petabyte scale",
    "Uses local agents with buffering",
    "Puts a durable stream between agents and indexers",
    "Partitions by time for easy retention",
    "Considers label-only indexing to save cost",
    "Archives to object storage",
    "Rate limits noisy services"
  ],
  cardIds: ["queue-vs-log", "inverted-index", "backpressure", "storage-math"]
};
