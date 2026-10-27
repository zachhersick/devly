export default {
  id: "link-analytics",
  title: "Design Link Click Analytics",
  difficulty: "easy",
  minutes: 9,
  tags: ["queues", "storage", "estimation"],
  prompt: "A link-shortening company wants a dashboard showing clicks per link by hour, country and device. Links get 50,000 clicks per second at peak. Customers check dashboards a few times a day and accept data that is a minute old.",
  requirements: {
    functional: [
      "Record every click with time, country, device and referrer",
      "Show clicks per link over time with breakdowns",
      "Show unique visitors per link"
    ],
    nonFunctional: [
      "Redirects must not slow down because of tracking",
      "Dashboards load in under a second",
      "Data at most a few minutes behind"
    ]
  },
  quiz: [
    {
      q: "How should the redirect record a click?",
      choices: [
        "Write to SQL before redirecting",
        "Fire an event to a queue and redirect immediately",
        "Skip tracking on busy days",
        "Ask the browser to report later"
      ],
      answer: 1,
      why: "Tracking must never slow the redirect; publishing to a queue is fast and durable.",
      tag: "queues"
    },
    {
      q: "50k clicks/s × 200 bytes. Raw data per day?",
      choices: ["About 8.6 GB", "About 86 TB", "About 86 MB", "About 860 GB"],
      answer: 3,
      why: "50k × 200 B = 10 MB/s; × 86,400 s ≈ 864 GB a day at that rate.",
      tag: "estimation"
    },
    {
      q: "Best way to serve 'clicks per hour for a link'?",
      choices: [
        "Scan raw clicks on each view",
        "Ask the CDN",
        "Pre-aggregate counts per link per hour",
        "Count rows in the browser"
      ],
      answer: 2,
      why: "Rolling up into hourly buckets means a dashboard reads a few hundred rows, not millions.",
      tag: "data-model"
    },
    {
      q: "Cheap way to count unique visitors?",
      choices: [
        "HyperLogLog per link per day",
        "Store every visitor id per link",
        "Count all clicks",
        "Cookie count in the browser"
      ],
      answer: 0,
      why: "HyperLogLog estimates distinct counts in about 12 KB with around 1% error.",
      tag: "storage"
    },
    {
      q: "Which store fits the rolled-up counts?",
      choices: ["A graph DB", "Plain object storage only", "A message queue", "A columnar or time-series store"],
      answer: 3,
      why: "Columnar and time-series stores scan and group time-bucketed data efficiently.",
      tag: "storage"
    },
    {
      q: "The aggregator crashes. How to avoid double counting on restart?",
      choices: [
        "Restart from the beginning",
        "Commit queue offsets together with the counts",
        "Ignore it",
        "Divide counts by two"
      ],
      answer: 1,
      why: "Saving the offset with the aggregate state lets the worker resume exactly where its counts left off.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Browser", kind: "client", x: 180, y: 50 },
      { id: "redir", label: "Redirect Svc", kind: "service", x: 180, y: 126 },
      { id: "q", label: "Click Stream", kind: "queue", x: 180, y: 202 },
      { id: "agg", label: "Aggregator", kind: "worker", x: 100, y: 278 },
      { id: "raw", label: "Raw Archive", kind: "storage", x: 260, y: 278 },
      { id: "olap", label: "Rollup Store", kind: "db", x: 180, y: 354 },
      { id: "dash", label: "Dashboard API", kind: "service", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "redir", label: "click" },
      { from: "redir", to: "q", label: "event" },
      { from: "q", to: "agg" },
      { from: "q", to: "raw" },
      { from: "agg", to: "olap", label: "per min" },
      { from: "dash", to: "olap" }
    ],
    steps: [
      {
        add: ["client", "redir"],
        caption: "The redirect service sends users on their way in milliseconds; tracking can't block it."
      },
      { add: ["q"], caption: "Each click is published as a small event to a partitioned stream." },
      { add: ["raw"], caption: "Raw events are archived cheaply to object storage for reprocessing and audits." },
      {
        add: ["agg", "olap"],
        caption: "Aggregators roll clicks into per-link, per-minute counts plus HyperLogLog sketches."
      },
      { add: ["dash"], caption: "The dashboard reads pre-aggregated rows, merging minutes into hours or days." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Track every click without slowing redirects; show counts and uniques by time, country and device, a minute or two behind."
    },
    {
      heading: "Ingestion",
      body: "Redirect servers publish click events (link id, time, country from IP, device, referrer) to a stream partitioned by link id."
    },
    {
      heading: "Aggregation",
      body: "Stream workers keep in-memory counters per link per minute per dimension and flush every minute, storing offsets with the results so restarts don't double count."
    },
    {
      heading: "Storage",
      body: "Rollups go into a columnar store; raw events go to object storage. Older minute data is merged into hourly rows to save space."
    },
    {
      heading: "Uniques",
      body: "Keep a HyperLogLog per link per day; sketches can be merged to answer weekly or monthly uniques."
    }
  ],
  keyPoints: [
    "Keeps tracking off the redirect's critical path",
    "Uses a stream or queue for click events",
    "Pre-aggregates by time bucket",
    "Uses HyperLogLog for unique visitors",
    "Estimates raw data volume",
    "Archives raw events for reprocessing",
    "Avoids double counting with offset checkpoints"
  ],
  cardIds: ["hyperloglog", "stream-windows", "checkpointing", "time-series-db"]
};
