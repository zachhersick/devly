export default {
  id: "config-service",
  title: "Design a Config Service",
  difficulty: "easy",
  minutes: 9,
  tags: ["consistency", "reliability", "caching"],
  prompt: "A company runs 3,000 service instances that read settings like timeouts and connection strings. Teams change config a few hundred times a day. Changes must roll out safely, be reversible in seconds, and reach all instances within a minute.",
  requirements: {
    functional: [
      "Store versioned key-value config per service and environment",
      "Instances load config at startup and get live updates",
      "Roll back to any earlier version"
    ],
    nonFunctional: [
      "Highly available reads",
      "Changes visible within 60 seconds",
      "Bad config must not take down every instance at once"
    ]
  },
  quiz: [
    {
      q: "Config reads vastly outnumber writes. Implication?",
      choices: ["Shard writes heavily", "Use a write-back cache", "Cache config on each instance", "Add a queue for reads"],
      answer: 2,
      why: "Instances can hold config in memory and only refresh on change.",
      tag: "caching"
    },
    {
      q: "Store backing a config service often is?",
      choices: ["A consensus store like etcd or ZooKeeper", "A CDN", "A data lake", "Browser localStorage"],
      answer: 0,
      why: "Consensus stores give ordered, consistent versions and watch notifications, ideal for config.",
      tag: "consistency"
    },
    {
      q: "How do instances learn about changes quickly?",
      choices: ["Restart hourly", "Read the DB on every request", "Email", "Watch / long-poll for a newer version"],
      answer: 3,
      why: "A watch or long poll returns as soon as the version changes, with no wasted polling.",
      tag: "realtime"
    },
    {
      q: "Someone pushes a typo'd timeout. Best protection?",
      choices: [
        "Push to all instances at once",
        "Validate schema, then roll out to a canary group first",
        "No validation",
        "Let the service crash"
      ],
      answer: 1,
      why: "Schema checks catch obvious mistakes; a canary rollout limits damage from subtle ones.",
      tag: "reliability"
    },
    {
      q: "Config service is unreachable at startup. Instance should?",
      choices: ["Start with the last known config cached on disk", "Refuse to start", "Use random values", "Wait forever"],
      answer: 0,
      why: "A local snapshot keeps instances bootable during an outage of the config store.",
      tag: "reliability"
    },
    {
      q: "How is rollback made instant?",
      choices: [
        "Edit values back by hand",
        "Restore DB backups",
        "Keep immutable versions and repoint 'current'",
        "Redeploy the code"
      ],
      answer: 2,
      why: "Each change creates a new version; rolling back is just moving the pointer to an older one.",
      tag: "data-model"
    },
    {
      q: "Where should secrets like DB passwords go?",
      choices: ["Plain text in config", "A secrets manager, referenced by config", "In the code", "In logs"],
      answer: 1,
      why: "Config can point to a secret, but the secret itself belongs in an encrypted, access-controlled store.",
      tag: "security"
    }
  ],
  diagram: {
    nodes: [
      { id: "eng", label: "Engineer", kind: "client", x: 180, y: 50 },
      { id: "capi", label: "Config API", kind: "service", x: 180, y: 145 },
      { id: "store", label: "etcd Cluster", kind: "db", x: 100, y: 240 },
      { id: "vault", label: "Secrets Mgr", kind: "external", x: 260, y: 240 },
      { id: "agent", label: "Local Agent", kind: "worker", x: 180, y: 335 },
      { id: "inst", label: "Service", kind: "service", x: 100, y: 430 },
      { id: "disk", label: "Disk Snapshot", kind: "storage", x: 260, y: 430 }
    ],
    edges: [
      { from: "eng", to: "capi", label: "change" },
      { from: "capi", to: "store" },
      { from: "agent", to: "store", label: "watch" },
      { from: "agent", to: "inst" },
      { from: "agent", to: "disk" },
      { from: "inst", to: "vault" }
    ],
    steps: [
      {
        add: ["eng", "capi"],
        caption: "Engineers change config through an API that validates schemas and records who did it."
      },
      {
        add: ["store"],
        caption: "Versions are stored in a consensus store, so every reader sees the same ordered history."
      },
      {
        add: ["agent", "inst"],
        caption: "A sidecar agent watches for new versions and hands them to the service in memory."
      },
      {
        add: ["disk"],
        caption: "The agent snapshots config to disk so instances start even if the store is unreachable."
      },
      { add: ["vault"], caption: "Secrets stay in a dedicated secrets manager; config only holds references." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Versioned config per service and environment, fast propagation, instant rollback, and reads that survive outages."
    },
    {
      heading: "Storage",
      body: "Each change writes a new immutable version in etcd (or a DB plus a watch mechanism). A 'current' pointer per service selects the active version."
    },
    {
      heading: "Distribution",
      body: "An agent on each host watches for changes and updates an in-memory copy. Services read locally, so config lookups cost nothing."
    },
    {
      heading: "Safe rollout",
      body: "Validate against a schema, apply to a small canary group, watch error rates, then promote. Rollback moves the pointer back."
    },
    {
      heading: "Resilience",
      body: "Agents cache the last good config on disk. Secrets are fetched from a secrets manager with their own access control."
    }
  ],
  keyPoints: [
    "Caches config locally on each instance",
    "Uses watches or long polling for fast updates",
    "Keeps immutable versions for instant rollback",
    "Validates changes and rolls out to canaries first",
    "Survives config-store outages with a local snapshot",
    "Keeps secrets out of plain config",
    "Audits who changed what"
  ],
  cardIds: ["raft", "long-polling", "graceful-degradation"]
};
