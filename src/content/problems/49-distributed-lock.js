export default {
  id: "distributed-lock",
  title: "Design a Distributed Lock Service",
  difficulty: "hard",
  minutes: 14,
  tags: ["consistency", "reliability", "replication"],
  prompt: "Many services need to make sure only one worker does a job at a time, such as one instance running a nightly billing run or one writer per shard. Build a lock service used by 2,000 services with 50,000 lock operations per second, safe even when clients pause or networks split.",
  requirements: {
    functional: ["Acquire and release named locks", "Locks expire if the holder dies", "Notify waiters when a lock frees up"],
    nonFunctional: ["Never two holders at once (safety)", "Survive node failures", "Low latency acquire"]
  },
  quiz: [
    {
      q: "Holder crashes without releasing. Prevent a stuck lock?",
      choices: ["Admin unlocks by hand", "Never expire", "Reboot cluster", "Lease with a TTL that the holder must renew"],
      answer: 3,
      why: "Expiring leases free locks from dead holders automatically.",
      tag: "reliability"
    },
    {
      q: "Holder pauses 30 s for GC, lease expires, wakes and writes. Danger?",
      choices: ["No danger", "Two writers act at once; fix with fencing tokens", "Lock gets faster", "Lease renews itself"],
      answer: 1,
      why: "A monotonically increasing token lets storage reject the stale holder's writes.",
      tag: "consistency"
    },
    {
      q: "Lock service state should be replicated using?",
      choices: ["A consensus protocol like Raft", "Async replication only", "No replication", "Client caches"],
      answer: 0,
      why: "Consensus ensures a majority agrees on who holds each lock, even across failures.",
      tag: "replication"
    },
    {
      q: "Why need a majority of nodes to grant a lock?",
      choices: ["For speed", "It's cheaper", "So a partitioned minority can't grant a conflicting lock", "To save memory"],
      answer: 2,
      why: "Only one side of a partition can have a majority, avoiding split brain.",
      tag: "consistency"
    },
    {
      q: "Single Redis node SETNX lock. Weakness?",
      choices: ["Too slow", "If the node fails over, a replica may not have the lock", "Can't set TTL", "No weakness"],
      answer: 1,
      why: "Async replication can lose the lock on failover, letting two clients hold it.",
      tag: "reliability"
    },
    {
      q: "Waiters learn a lock is free by?",
      choices: ["Polling every millisecond", "Email", "Restart", "Watch notifications on the lock key"],
      answer: 3,
      why: "Watches avoid busy polling and wake waiters promptly.",
      tag: "realtime"
    },
    {
      q: "50k ops/s on a 5-node Raft group is too much. Scale by?",
      choices: [
        "Add more voters to one group",
        "Remove consensus",
        "Partition lock names across many Raft groups",
        "Bigger timeout"
      ],
      answer: 2,
      why: "More voters slows each write; independent groups scale out.",
      tag: "sharding"
    }
  ],
  diagram: {
    nodes: [
      { id: "c1", label: "Worker A", kind: "client", x: 100, y: 50 },
      { id: "c2", label: "Worker B", kind: "client", x: 260, y: 50 },
      { id: "api", label: "Lock API", kind: "service", x: 180, y: 145 },
      { id: "l", label: "Raft Leader", kind: "db", x: 180, y: 240 },
      { id: "f1", label: "Follower", kind: "db", x: 100, y: 335 },
      { id: "f2", label: "Follower", kind: "db", x: 260, y: 335 },
      { id: "store", label: "Protected DB", kind: "db", x: 180, y: 430 }
    ],
    edges: [
      { from: "c1", to: "api", label: "acquire" },
      { from: "c2", to: "api", label: "wait" },
      { from: "api", to: "l" },
      { from: "l", to: "f1", label: "replicate" },
      { from: "l", to: "f2" },
      { from: "c1", to: "store", label: "token 42" }
    ],
    steps: [
      { add: ["c1", "c2", "api"], caption: "Workers ask the lock API to acquire a named lock with a lease time." },
      { add: ["l"], caption: "A Raft leader orders every acquire, renew and release for a group of lock names." },
      {
        add: ["f1", "f2"],
        caption: "A grant only counts once a majority has stored it, so a cut-off minority can never hand out the same lock."
      },
      {
        add: ["store"],
        caption: "Each grant carries a fencing token; the protected resource rejects writes with an older token."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Named locks with automatic expiry and waiter notifications, strictly one holder at a time, fault tolerant, about 50k ops/s."
    },
    {
      heading: "Core",
      body: "A replicated state machine (Raft, as in etcd/ZooKeeper) storing lock → holder, lease expiry and token. Acquire succeeds only if free or expired; release deletes it."
    },
    {
      heading: "Leases",
      body: "Holders renew every few seconds via keepalive sessions. If renewals stop, the lease expires and waiters are notified."
    },
    {
      heading: "Fencing",
      body: "Every grant increments a token. Clients pass it to the resource they modify, which rejects lower tokens, so a paused old holder can't do damage."
    },
    {
      heading: "Scale",
      body: "Shard lock names across several independent Raft groups, keep groups at 3–5 voters, and use read-only followers for lock status queries."
    }
  ],
  keyPoints: [
    "Uses leases with TTL and renewal",
    "Explains the paused-holder problem",
    "Uses fencing tokens",
    "Replicates with consensus and majority",
    "Explains weakness of a single Redis lock",
    "Notifies waiters with watches",
    "Scales by partitioning across consensus groups"
  ],
  cardIds: ["fencing-token", "lease", "raft", "split-brain"]
};
