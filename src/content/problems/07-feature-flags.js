export default {
  id: "feature-flags",
  title: "Design a Feature Flag Service",
  difficulty: "easy",
  minutes: 8,
  tags: ["caching", "reliability", "api"],
  prompt: "Engineering teams want to turn features on or off without deploying, and roll them out to a percentage of users. 500 services check flags, together about 2 million checks per second. A flag change should reach every service within 30 seconds.",
  requirements: {
    functional: [
      "Create and edit flags with rules (percentage, user lists, regions)",
      "Services evaluate a flag for a given user",
      "Audit who changed what"
    ],
    nonFunctional: [
      "Flag checks add almost no latency",
      "Services keep working if the flag service is down",
      "Changes propagate within 30 seconds"
    ]
  },
  quiz: [
    {
      q: "2M checks/s. Where should evaluation happen?",
      choices: [
        "One central API call per check",
        "In an SDK inside each service, from a local copy",
        "In the database",
        "In the browser only"
      ],
      answer: 1,
      why: "A network call per check would add latency and overwhelm the server; local evaluation is a memory lookup.",
      tag: "scaling"
    },
    {
      q: "How do SDKs learn about flag changes?",
      choices: [
        "Redeploy every service",
        "Email the team",
        "Read the DB directly on each check",
        "Poll or stream updates from the flag service"
      ],
      answer: 3,
      why: "SDKs keep a local ruleset and refresh it by polling every few seconds or via a streaming connection.",
      tag: "realtime"
    },
    {
      q: "10% rollout: how to keep a user's result stable?",
      choices: [
        "Random number on each check",
        "Use the current second",
        "Hash the user id with the flag key into 0–99",
        "Ask the user"
      ],
      answer: 2,
      why: "Hashing user id + flag key gives the same bucket every time, so users don't flip between versions.",
      tag: "consistency"
    },
    {
      q: "The flag service goes down. What should SDKs do?",
      choices: [
        "Use the last known rules, then hardcoded defaults",
        "Crash the service",
        "Turn every flag on",
        "Block until it's back"
      ],
      answer: 0,
      why: "Flags must fail safe: keep serving the cached ruleset, and fall back to code defaults if there's nothing cached.",
      tag: "reliability"
    },
    {
      q: "Where to store flag definitions?",
      choices: ["A CDN only", "In each service's env vars", "A time-series DB", "A small relational DB with an audit table"],
      answer: 3,
      why: "Flags are a small, structured dataset that needs history and audit, which a relational DB handles well.",
      tag: "data-model"
    },
    {
      q: "Total ruleset is ~1 MB. How do SDKs fetch it cheaply?",
      choices: [
        "Download the full file every second",
        "Conditional GET with an ETag or version",
        "Fetch one flag per check",
        "SFTP"
      ],
      answer: 1,
      why: "With a version or ETag, an unchanged ruleset costs a tiny 304 response.",
      tag: "api"
    }
  ],
  diagram: {
    nodes: [
      { id: "admin", label: "Admin UI", kind: "client", x: 180, y: 50 },
      { id: "fapi", label: "Flag API", kind: "service", x: 180, y: 145 },
      { id: "db", label: "Flags DB", kind: "db", x: 100, y: 240 },
      { id: "cdn", label: "Ruleset CDN", kind: "cdn", x: 260, y: 240 },
      { id: "stream", label: "Update Stream", kind: "queue", x: 180, y: 335 },
      { id: "svc1", label: "Service + SDK", kind: "service", x: 100, y: 430 },
      { id: "svc2", label: "Service + SDK", kind: "service", x: 260, y: 430 }
    ],
    edges: [
      { from: "admin", to: "fapi", label: "edit" },
      { from: "fapi", to: "db" },
      { from: "fapi", to: "cdn", label: "publish" },
      { from: "fapi", to: "stream" },
      { from: "cdn", to: "svc1", label: "ruleset" },
      { from: "cdn", to: "svc2" },
      { from: "stream", to: "svc1", label: "change" },
      { from: "stream", to: "svc2" }
    ],
    steps: [
      {
        add: ["admin", "fapi", "db"],
        caption: "Teams edit flags through an API that validates rules and writes them plus an audit record."
      },
      {
        add: ["svc1", "svc2"],
        caption: "Each service embeds an SDK that evaluates flags from a local in-memory copy."
      },
      {
        add: ["cdn"],
        caption: "The full ruleset is published as a versioned file that SDKs fetch at startup and refresh cheaply."
      },
      {
        add: ["stream"],
        caption: "A streaming channel pushes change notices so updates land in seconds, not on the next poll."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Define flags with targeting rules, evaluate them per user, audit changes. Checks must be near-free and keep working if the service is down."
    },
    {
      heading: "Evaluation",
      body: "SDKs evaluate locally: check user allow lists, then attribute rules, then percentage. Percentage uses hash(flagKey + userId) mod 100 so a user's result is sticky."
    },
    {
      heading: "Distribution",
      body: "On change the API writes a new ruleset version, publishes it behind a CDN, and sends a notice on a stream. SDKs fetch with the version and fall back to polling every 30 seconds."
    },
    {
      heading: "Failure handling",
      body: "SDKs keep the last good ruleset in memory (and optionally on disk). With nothing cached they use defaults written in code."
    },
    {
      heading: "Safety",
      body: "Store every change with author and time, support instant rollback, and clean up stale flags so code doesn't fill with dead branches."
    }
  ],
  keyPoints: [
    "Evaluates flags locally in an SDK, not via a call per check",
    "Uses a deterministic hash for sticky percentage rollouts",
    "Pushes or polls for changes within the 30 s target",
    "Fails safe to last known rules and code defaults",
    "Versions the ruleset so unchanged fetches are cheap",
    "Keeps an audit log and rollback",
    "Mentions cleaning up stale flags"
  ],
  cardIds: ["local-vs-remote-cache", "graceful-degradation", "server-sent-events"]
};
