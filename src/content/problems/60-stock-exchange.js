export default {
  id: "stock-exchange",
  title: "Design a Stock Exchange",
  difficulty: "hard",
  minutes: 15,
  tags: ["consistency", "realtime", "reliability"],
  prompt: "Build the core of an electronic exchange: brokers send buy and sell orders for 5,000 stocks, and a matching engine pairs them by price and time. Peak load is 1 million orders per second, with microsecond-level latency targets and strictly fair ordering. Every trade must be recoverable after a crash.",
  requirements: {
    functional: [
      "Accept, cancel and modify limit and market orders",
      "Match orders by price-time priority",
      "Publish trades and order book updates",
      "Settle trades downstream"
    ],
    nonFunctional: ["Deterministic, fair ordering", "Very low and predictable latency", "No lost orders or trades after failure"]
  },
  quiz: [
    {
      q: "Price-time priority means?",
      choices: [
        "Largest order first",
        "Random among equal prices",
        "Best price first; among equal prices, earliest order first",
        "Newest order first"
      ],
      answer: 2,
      why: "This is the standard fair matching rule.",
      tag: "requirements"
    },
    {
      q: "Why is each stock's matching single-threaded?",
      choices: [
        "Deterministic order without locks, and very fast in memory",
        "Hardware limits",
        "To save money",
        "Regulations ban threads"
      ],
      answer: 0,
      why: "One thread per order book processes events in sequence with no contention.",
      tag: "consistency"
    },
    {
      q: "Scale to 5,000 stocks?",
      choices: ["One engine for all", "Shard by broker", "Random", "Partition order books by symbol across engines"],
      answer: 3,
      why: "Symbols are independent, so each engine owns a set of books.",
      tag: "sharding"
    },
    {
      q: "Order book data structure?",
      choices: ["Unsorted list", "Sorted price levels, each a FIFO queue of orders", "Hash map only", "Bloom filter"],
      answer: 1,
      why: "Sorted levels find the best price; FIFO keeps time priority.",
      tag: "data-model"
    },
    {
      q: "Recover the engine after a crash?",
      choices: ["Replay a sequenced input log from the last snapshot", "Ask brokers to resend", "Start empty", "Guess"],
      answer: 0,
      why: "Deterministic processing of a durable sequenced log rebuilds exact state.",
      tag: "reliability"
    },
    {
      q: "Fair ordering across many gateways requires?",
      choices: [
        "Gateway clocks",
        "Broker timestamps",
        "A sequencer stamping a single global order per book",
        "First TCP packet seen anywhere"
      ],
      answer: 2,
      why: "A sequencer assigns one authoritative order to all incoming events.",
      tag: "consistency"
    },
    {
      q: "Hot standby engine stays in sync by?",
      choices: [
        "Copying memory hourly",
        "Consuming the same sequenced log and processing in lockstep",
        "Polling the primary's DB",
        "Not needed"
      ],
      answer: 1,
      why: "Determinism means the standby reaches identical state and can take over instantly.",
      tag: "replication"
    }
  ],
  diagram: {
    nodes: [
      { id: "broker", label: "Broker", kind: "client", x: 180, y: 50 },
      { id: "gw", label: "Order Gateway", kind: "gateway", x: 180, y: 126 },
      { id: "risk", label: "Risk Checks", kind: "service", x: 100, y: 202 },
      { id: "seq", label: "Sequencer", kind: "queue", x: 260, y: 202 },
      { id: "me", label: "Matching Eng", kind: "service", x: 100, y: 278 },
      { id: "standby", label: "Hot Standby", kind: "service", x: 260, y: 278 },
      { id: "log", label: "Event Log", kind: "storage", x: 100, y: 354 },
      { id: "md", label: "Market Data", kind: "service", x: 260, y: 354 },
      { id: "settle", label: "Clearing", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "broker", to: "gw" },
      { from: "gw", to: "risk" },
      { from: "risk", to: "seq" },
      { from: "seq", to: "me" },
      { from: "seq", to: "standby" },
      { from: "seq", to: "log" },
      { from: "me", to: "md", label: "trades" },
      { from: "md", to: "broker" },
      { from: "me", to: "settle" }
    ],
    steps: [
      {
        add: ["broker", "gw", "risk"],
        caption: "Brokers connect to gateways; pre-trade risk checks reject orders that break limits."
      },
      {
        add: ["seq", "log"],
        caption: "A sequencer gives every accepted event a global sequence number and writes it to a replicated log."
      },
      {
        add: ["me"],
        caption: "A single-threaded matching engine per group of symbols applies events in order to in-memory order books."
      },
      { add: ["standby"], caption: "A hot standby processes the same sequence and can take over instantly." },
      {
        add: ["md", "settle"],
        caption: "Trades and book changes are published as market data and sent to clearing for settlement."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Price-time matching with strict fairness, ~1M orders/s, microsecond latency, and exact recovery."
    },
    {
      heading: "Order flow",
      body: "Gateway authenticates and normalizes, risk checks credit and limits, then a sequencer stamps events and persists them to a replicated log before matching."
    },
    {
      heading: "Matching",
      body: "Per-symbol order books: price levels sorted (bids descending, asks ascending), each with a FIFO queue. A single thread per book matches incoming orders, emitting fills and book updates."
    },
    {
      heading: "Recovery and HA",
      body: "Matching is deterministic, so replaying the sequenced log from a snapshot rebuilds state. Hot standbys consume the same stream and take over on failure."
    },
    {
      heading: "Outputs",
      body: "Market data multicast to subscribers; trades go to clearing and settlement systems asynchronously. Latency tuned with in-memory state, kernel bypass networking and avoiding garbage collection pauses."
    }
  ],
  keyPoints: [
    "Explains price-time priority",
    "Uses a single-threaded engine per book",
    "Partitions books by symbol",
    "Uses sorted price levels with FIFO queues",
    "Sequences all input through a sequencer and durable log",
    "Recovers by deterministic replay",
    "Uses hot standbys",
    "Publishes market data and settles asynchronously"
  ],
  cardIds: ["event-sourcing", "partition-ordering", "write-ahead-log", "leader-follower"]
};
