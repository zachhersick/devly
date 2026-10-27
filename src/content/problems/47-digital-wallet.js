export default {
  id: "digital-wallet",
  title: "Design a Digital Wallet",
  difficulty: "hard",
  minutes: 15,
  tags: ["consistency", "sharding", "reliability"],
  prompt: "A wallet app holds balances for 100 million users who send money to each other instantly. Peak load is 50,000 transfers per second during holidays. Balances must never go negative or drift, and every transfer must be traceable.",
  requirements: {
    functional: [
      "Hold a balance per user",
      "Transfer money between users instantly",
      "Top up from and withdraw to bank accounts",
      "Show transaction history"
    ],
    nonFunctional: ["No lost or duplicated transfers", "Balances never negative", "Scale to 50k transfers/s"]
  },
  quiz: [
    {
      q: "50k transfers/s on one DB. Problem?",
      choices: ["Fine on a laptop", "Too much for one primary; must shard accounts", "DBs can't store money", "Need a CDN"],
      answer: 1,
      why: "Each transfer touches two accounts with transactions; one primary won't keep up.",
      tag: "scaling"
    },
    {
      q: "After sharding, sender and receiver are on different shards. Transfer atomically via?",
      choices: [
        "Two independent writes and hope",
        "Skip the credit",
        "Lock all shards",
        "Saga or 2PC; debit first, then credit, compensate on failure"
      ],
      answer: 3,
      why: "Cross-shard moves need a coordination protocol so money can't vanish or double.",
      tag: "consistency"
    },
    {
      q: "Prevent negative balance on debit?",
      choices: [
        "Check in the client",
        "Daily batch check",
        "UPDATE ... SET bal = bal - x WHERE bal >= x",
        "Overdraft always allowed"
      ],
      answer: 2,
      why: "The conditional update is atomic per account.",
      tag: "consistency"
    },
    {
      q: "Event sourcing here means?",
      choices: [
        "Storing every transfer event and deriving balances from them",
        "Logging only errors",
        "Emailing receipts",
        "Caching balances"
      ],
      answer: 0,
      why: "The event log is the truth; balances are a replayable projection.",
      tag: "data-model"
    },
    {
      q: "Client retries a transfer after timeout. Avoid double send?",
      choices: ["Longer timeout", "Ask support", "Disable retry", "Idempotency key per transfer request"],
      answer: 3,
      why: "The server recognizes the repeat and returns the original result.",
      tag: "api"
    },
    {
      q: "Shard key for accounts?",
      choices: ["Country", "Account id (hashed)", "Balance size", "Signup year"],
      answer: 1,
      why: "Hashed ids spread accounts evenly across shards.",
      tag: "sharding"
    },
    {
      q: "How to prove balances haven't drifted?",
      choices: [
        "Periodic reconciliation: sum of all balances equals ledger totals",
        "Trust the code",
        "Ask users",
        "Restart weekly"
      ],
      answer: 0,
      why: "Invariant checks catch bugs before they become real losses.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "Wallet App", kind: "client", x: 180, y: 50 },
      { id: "api", label: "Transfer API", kind: "service", x: 180, y: 145 },
      { id: "coord", label: "Saga Coord", kind: "service", x: 100, y: 240 },
      { id: "log", label: "Transfer Log", kind: "queue", x: 260, y: 240 },
      { id: "s1", label: "Account Shard1", kind: "db", x: 100, y: 335 },
      { id: "s2", label: "Account Shard2", kind: "db", x: 260, y: 335 },
      { id: "recon", label: "Reconciler", kind: "worker", x: 100, y: 430 },
      { id: "bank", label: "Bank Gateway", kind: "external", x: 260, y: 430 }
    ],
    edges: [
      { from: "user", to: "api" },
      { from: "api", to: "coord" },
      { from: "coord", to: "log" },
      { from: "coord", to: "s1", label: "debit" },
      { from: "coord", to: "s2", label: "credit" },
      { from: "recon", to: "s1" },
      { from: "recon", to: "s2" },
      { from: "api", to: "bank", label: "top-up" }
    ],
    steps: [
      { add: ["user", "api"], caption: "Transfers arrive with an idempotency key and are validated." },
      { add: ["coord", "log"], caption: "A coordinator records the transfer in a durable log before acting on it." },
      {
        add: ["s1", "s2"],
        caption: "Accounts are sharded by id; the coordinator debits the sender, then credits the receiver, compensating if the credit fails."
      },
      { add: ["bank"], caption: "Top-ups and withdrawals go through a bank gateway, treated as their own transfers." },
      { add: ["recon"], caption: "A reconciler continuously checks that balances match the transfer log." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Instant P2P transfers at 50k/s with no lost, duplicated or negative-balance moves, plus history and bank in/out."
    },
    {
      heading: "Data",
      body: "Accounts sharded by hashed account id with balance and version. Each transfer is an event (id, from, to, amount, state) in a durable, partitioned log."
    },
    {
      heading: "Transfer protocol",
      body: "Coordinator writes the transfer as PENDING, debits sender with a conditional update, credits receiver, then marks COMPLETED. If the credit fails, it refunds the sender. Every step is idempotent by transfer id."
    },
    {
      heading: "History",
      body: "Per-user history is a projection of transfer events, partitioned by user, used for statements."
    },
    {
      heading: "Safety",
      body: "Reconciliation verifies balances against events; alerting on any mismatch. Hot accounts (merchants) can use sub-accounts to spread load."
    }
  ],
  keyPoints: [
    "Recognizes the need to shard accounts",
    "Handles cross-shard transfers with saga or 2PC",
    "Prevents negative balances with conditional updates",
    "Uses idempotency keys",
    "Keeps an immutable transfer log or event sourcing",
    "Reconciles balances against the log",
    "Addresses hot merchant accounts"
  ],
  cardIds: ["saga-pattern", "event-sourcing", "double-entry-ledger", "two-phase-commit"]
};
