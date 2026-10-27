export default {
  id: "ad-click-aggregation",
  title: "Design Ad Click Aggregation",
  difficulty: "hard",
  minutes: 15,
  tags: ["queues", "consistency", "realtime"],
  prompt: "An ad network records clicks so advertisers can see results per minute and are billed accurately. There are 1 billion clicks a day, peaking at 50,000 per second. Bills must be exact, while dashboards can lag by a minute. Some clicks arrive late or twice.",
  requirements: {
    functional: [
      "Count clicks per ad per minute",
      "Query counts by ad, campaign and time range",
      "Filter duplicate and fraudulent clicks",
      "Produce exact numbers for billing"
    ],
    nonFunctional: [
      "Dashboard lag under a few minutes",
      "Exact counts for billing (no double count)",
      "Recover from failures without data loss"
    ]
  },
  quiz: [
    {
      q: "Why keep raw click events, not just counts?",
      choices: [
        "To recompute counts after bugs or for audits",
        "They're smaller",
        "Dashboards need each click",
        "Law requires deletion"
      ],
      answer: 0,
      why: "Immutable raw events let you fix and replay aggregation.",
      tag: "storage"
    },
    {
      q: "Aggregate per minute using?",
      choices: ["Nightly SQL only", "Client-side counting", "Tumbling windows in a stream processor", "Random sampling"],
      answer: 2,
      why: "Fixed one-minute windows map directly to the per-minute view.",
      tag: "realtime"
    },
    {
      q: "Clicks arriving 2 minutes late?",
      choices: [
        "Drop them always",
        "Watermarks with an allowed lateness, update the window",
        "Assign to current minute",
        "Crash"
      ],
      answer: 1,
      why: "Event time with watermarks counts late clicks in the right minute.",
      tag: "realtime"
    },
    {
      q: "Same click sent twice by the client. Dedupe by?",
      choices: ["IP only", "Ad id", "Ignore", "Click id within a time window"],
      answer: 3,
      why: "A unique click id lets the pipeline drop repeats.",
      tag: "consistency"
    },
    {
      q: "Aggregator restarts. Avoid double counting?",
      choices: [
        "Start from latest",
        "Recount everything always",
        "Checkpoint state and offsets together (exactly-once processing)",
        "Halve counts"
      ],
      answer: 2,
      why: "Atomic checkpoints of offsets and state give effectively-once results.",
      tag: "reliability"
    },
    {
      q: "Hot ad gets huge share of clicks on one partition. Fix?",
      choices: [
        "Pre-aggregate locally then merge, or salt the key",
        "One bigger partition",
        "Drop clicks",
        "Use a single worker"
      ],
      answer: 0,
      why: "Spreading or combining early prevents one worker from being overwhelmed.",
      tag: "sharding"
    },
    {
      q: "Billing needs exact numbers. Approach?",
      choices: [
        "Trust real-time numbers only",
        "Estimate",
        "Ask advertisers",
        "Batch reconciliation over raw events (lambda/kappa style)"
      ],
      answer: 3,
      why: "A batch recount over stored events confirms or corrects streaming results before invoices.",
      tag: "consistency"
    }
  ],
  diagram: {
    nodes: [
      { id: "click", label: "Ad Click", kind: "client", x: 180, y: 50 },
      { id: "log", label: "Click Logger", kind: "service", x: 180, y: 126 },
      { id: "q", label: "Click Stream", kind: "queue", x: 180, y: 202 },
      { id: "agg", label: "Stream Agg", kind: "worker", x: 100, y: 278 },
      { id: "raw", label: "Raw Events", kind: "storage", x: 260, y: 278 },
      { id: "olap", label: "Counts DB", kind: "db", x: 100, y: 354 },
      { id: "batch", label: "Batch Recount", kind: "worker", x: 260, y: 354 },
      { id: "dash", label: "Dashboard", kind: "service", x: 180, y: 430 }
    ],
    edges: [
      { from: "click", to: "log" },
      { from: "log", to: "q" },
      { from: "q", to: "agg" },
      { from: "q", to: "raw" },
      { from: "agg", to: "olap", label: "per min" },
      { from: "batch", to: "raw" },
      { from: "batch", to: "olap", label: "fix" },
      { from: "dash", to: "olap" }
    ],
    steps: [
      {
        add: ["click", "log", "q"],
        caption: "Click redirects log an event with a unique click id into a partitioned stream."
      },
      { add: ["raw"], caption: "Raw events are archived immutably for audits and recomputation." },
      {
        add: ["agg", "olap"],
        caption: "A stream processor dedupes, filters fraud, and counts per ad per minute with watermarks for late events."
      },
      { add: ["batch"], caption: "A daily batch job recounts from raw events and corrects any drift before billing." },
      { add: ["dash"], caption: "Dashboards query the per-minute counts store." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Per-minute click counts per ad for dashboards (minutes of lag OK) and exact counts for billing, with late and duplicate clicks."
    },
    {
      heading: "Ingestion",
      body: "Click service writes events (click id, ad id, time, user signals) to a stream partitioned by ad id, and archives raw events to object storage."
    },
    {
      heading: "Streaming",
      body: "Event-time tumbling windows of one minute with a watermark and allowed lateness. Deduplicate by click id, apply fraud rules, and write upserts keyed by (ad, minute). Checkpoints make results effectively exactly-once."
    },
    {
      heading: "Batch correction",
      body: "A batch job over raw events recomputes daily totals; billing uses these, and dashboards are corrected if they differ."
    },
    {
      heading: "Hot ads",
      body: "Combine counts locally before shuffling, or salt hot keys across partitions and merge."
    }
  ],
  keyPoints: [
    "Keeps immutable raw events",
    "Uses tumbling windows by event time",
    "Handles late events with watermarks",
    "Deduplicates by click id",
    "Checkpoints for exactly-once results",
    "Reconciles with a batch recount for billing",
    "Handles hot ads",
    "Writes idempotent upserts"
  ],
  cardIds: ["stream-windows", "checkpointing", "delivery-semantics", "idempotency-key"]
};
