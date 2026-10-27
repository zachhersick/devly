export default {
  id: "metrics-monitoring",
  title: "Design Metrics and Alerting",
  difficulty: "medium",
  minutes: 13,
  tags: ["observability", "storage", "reliability"],
  prompt: "Build a monitoring system for 10,000 servers. Each reports 500 metrics (CPU, latency, error counts) every 10 seconds. Engineers view dashboards and get paged when something breaks. Data is kept at full detail for a week and in summary for a year.",
  requirements: {
    functional: [
      "Collect metrics from all servers",
      "Query and graph metrics over time",
      "Alert on rules like 'error rate > 2% for 5 min'"
    ],
    nonFunctional: ["Dashboards load in seconds", "Alerts fire within a minute", "Monitoring must survive outages it reports on"]
  },
  quiz: [
    {
      q: "10k servers × 500 metrics / 10 s. Points per second?",
      choices: ["500,000", "50,000", "5 million", "50 million"],
      answer: 0,
      why: "5 million series ÷ 10 s = 500k data points per second.",
      tag: "estimation"
    },
    {
      q: "Which database fits metrics?",
      choices: [
        "A relational DB row per point",
        "A graph DB",
        "A time-series DB with compression",
        "A document store per server"
      ],
      answer: 2,
      why: "Time-series stores compress sequential values and query ranges quickly.",
      tag: "storage"
    },
    {
      q: "Pull (scrape) vs push collection: a benefit of pull?",
      choices: [
        "It's always faster",
        "The monitor knows when a target stops responding",
        "It needs no network",
        "Servers can't be scraped"
      ],
      answer: 1,
      why: "If a scrape fails, that itself signals a dead target.",
      tag: "observability"
    },
    {
      q: "Keeping a year of 10-second data is costly. Fix?",
      choices: [
        "Delete everything after a day",
        "Buy more RAM",
        "Store as images",
        "Downsample old data to 1-min and 1-hour rollups"
      ],
      answer: 3,
      why: "Rollups keep long-term trends at a fraction of the storage.",
      tag: "storage"
    },
    {
      q: "Tag 'user_id' on a metric. Problem?",
      choices: ["Makes graphs prettier", "Speeds queries", "High cardinality explodes the number of series", "None"],
      answer: 2,
      why: "Each distinct label value creates a new series; millions of users means millions of series.",
      tag: "data-model"
    },
    {
      q: "Alert on brief spikes causes noise. Fix?",
      choices: ["Require the condition for a duration (e.g. 5 min)", "Disable alerts", "Alert on every point", "Page everyone"],
      answer: 0,
      why: "A 'for' duration filters blips while still catching real problems.",
      tag: "observability"
    },
    {
      q: "Monitoring lives in the same region that fails. Risk?",
      choices: ["None", "Alerts get faster", "Cheaper", "You lose visibility exactly when you need it"],
      answer: 3,
      why: "Run a minimal watcher outside the main failure domain to alert when monitoring itself is down.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "hosts", label: "Servers", kind: "client", x: 180, y: 50 },
      { id: "coll", label: "Collectors", kind: "worker", x: 180, y: 126 },
      { id: "q", label: "Metrics Stream", kind: "queue", x: 180, y: 202 },
      { id: "tsdb", label: "TSDB", kind: "db", x: 100, y: 278 },
      { id: "rollup", label: "Downsampler", kind: "worker", x: 260, y: 278 },
      { id: "alert", label: "Alert Engine", kind: "service", x: 100, y: 354 },
      { id: "dash", label: "Dashboards", kind: "service", x: 260, y: 354 },
      { id: "pager", label: "Pager", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "coll", to: "hosts", label: "scrape" },
      { from: "coll", to: "q" },
      { from: "q", to: "tsdb" },
      { from: "rollup", to: "tsdb" },
      { from: "alert", to: "tsdb" },
      { from: "dash", to: "tsdb" },
      { from: "alert", to: "pager" }
    ],
    steps: [
      {
        add: ["hosts", "coll"],
        caption: "Collectors scrape each server's metrics endpoint every 10 seconds, sharded by target."
      },
      {
        add: ["q", "tsdb"],
        caption: "Samples flow through a stream into a sharded, compressed time-series database."
      },
      {
        add: ["rollup"],
        caption: "A downsampler writes 1-minute and 1-hour rollups and expires raw data after a week."
      },
      {
        add: ["alert", "pager"],
        caption: "An alert engine evaluates rules every 30 seconds and pages on-call when one holds."
      },
      { add: ["dash"], caption: "Dashboards query the TSDB, picking raw or rolled-up data by time range." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Collect 500k points/s, graph and alert on them, keep a week of raw data and a year of summaries, stay up during outages."
    },
    {
      heading: "Collection",
      body: "Servers expose metrics; collectors scrape them (or agents push). Collectors are sharded by target hash and add labels like service and region."
    },
    {
      heading: "Storage",
      body: "A time-series DB sharded by series id, with delta-of-delta and XOR compression. Limit label cardinality to keep series counts sane."
    },
    {
      heading: "Retention",
      body: "Raw for 7 days, 1-minute rollups for 90 days, 1-hour for a year. Queries choose resolution by range."
    },
    {
      heading: "Alerting",
      body: "Rules evaluated on a schedule with 'for' durations, deduplicated and routed to on-call. A separate meta-monitor watches the monitoring system."
    }
  ],
  keyPoints: [
    "Estimates ingest rate",
    "Uses a time-series database",
    "Discusses pull vs push",
    "Downsamples for long retention",
    "Warns about high-cardinality labels",
    "Uses durations to avoid noisy alerts",
    "Monitors the monitoring system"
  ],
  cardIds: ["time-series-db", "sli-slo", "percentile-latency", "distributed-tracing"]
};
