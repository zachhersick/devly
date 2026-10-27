export default {
  id: "collaborative-docs",
  title: "Design Collaborative Docs",
  difficulty: "hard",
  minutes: 15,
  tags: ["realtime", "consistency", "storage"],
  prompt: "Build a Google Docs-style editor where up to 100 people edit the same document at once and see each other's cursors live. There are 10 million documents edited daily. Everyone must end up with exactly the same text, even with lag or brief disconnects.",
  requirements: {
    functional: [
      "Concurrent real-time editing",
      "Live cursors and presence",
      "Full version history",
      "Offline edits that merge on reconnect"
    ],
    nonFunctional: ["Edits visible to others within ~200 ms", "All replicas converge to the same document", "No edits lost"]
  },
  quiz: [
    {
      q: "Alice inserts at position 5 while Bob deletes position 2. Naive replay breaks because?",
      choices: ["Positions shift, so ops apply in the wrong place", "Text is too long", "Fonts differ", "Nothing breaks"],
      answer: 0,
      why: "Concurrent ops must be adjusted for each other or positions drift.",
      tag: "consistency"
    },
    {
      q: "Operational transformation needs?",
      choices: ["No server", "Locking the whole doc", "A central server ordering operations", "Blockchain"],
      answer: 2,
      why: "OT relies on one authority to order ops and transform concurrent ones.",
      tag: "consistency"
    },
    {
      q: "CRDTs differ from OT because?",
      choices: [
        "They are always smaller",
        "Replicas merge in any order without a central orderer",
        "They need locks",
        "They don't converge"
      ],
      answer: 1,
      why: "CRDT ids make operations commute, which suits offline and peer sync.",
      tag: "consistency"
    },
    {
      q: "Route all editors of one doc to?",
      choices: ["Random servers", "Each user's own server", "The CDN", "The same session server (sharded by doc id)"],
      answer: 3,
      why: "One server holding the doc in memory simplifies ordering and fan-out.",
      tag: "sharding"
    },
    {
      q: "Storing history efficiently?",
      choices: ["Full copy on every keystroke", "No history", "Op log plus periodic snapshots", "Screenshots"],
      answer: 2,
      why: "Snapshots speed loading; the op log fills in between and powers history.",
      tag: "storage"
    },
    {
      q: "Cursor positions should be?",
      choices: ["Ephemeral messages, not saved in the doc history", "Saved as edits", "Emailed", "Stored forever"],
      answer: 0,
      why: "Presence is high-frequency and disposable.",
      tag: "realtime"
    },
    {
      q: "Session server crashes. Avoid losing edits?",
      choices: ["Keep edits only in memory", "Ask users to retype", "Ignore", "Persist ops to a durable log before acking"],
      answer: 3,
      why: "Acked ops are durable; a new server reloads snapshot plus log.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "a", label: "Editor A", kind: "client", x: 100, y: 50 },
      { id: "b", label: "Editor B", kind: "client", x: 260, y: 50 },
      { id: "gw", label: "WS Gateway", kind: "gateway", x: 180, y: 145 },
      { id: "sess", label: "Doc Session", kind: "service", x: 100, y: 240 },
      { id: "pres", label: "Presence Bus", kind: "queue", x: 260, y: 240 },
      { id: "oplog", label: "Op Log", kind: "db", x: 100, y: 335 },
      { id: "snap", label: "Snapshots", kind: "storage", x: 260, y: 335 },
      { id: "compact", label: "Snapshotter", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "a", to: "gw", label: "ops" },
      { from: "b", to: "gw" },
      { from: "gw", to: "sess", label: "by doc" },
      { from: "sess", to: "gw", label: "broadcast" },
      { from: "gw", to: "pres", label: "cursors" },
      { from: "sess", to: "oplog" },
      { from: "compact", to: "oplog" },
      { from: "compact", to: "snap" },
      { from: "sess", to: "snap", label: "load" }
    ],
    steps: [
      {
        add: ["a", "b", "gw"],
        caption: "Editors connect over WebSockets; the gateway routes all of a doc's editors to one session server."
      },
      {
        add: ["sess"],
        caption: "The session server orders incoming ops, transforms or merges concurrent ones, and broadcasts the result."
      },
      { add: ["oplog"], caption: "Each op is appended to a durable log before it's acknowledged." },
      {
        add: ["pres"],
        caption: "Cursor and selection updates travel on a lightweight presence channel and are never stored."
      },
      {
        add: ["compact", "snap"],
        caption: "A snapshotter periodically saves full document state so loads don't replay the whole log."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Real-time concurrent editing that always converges, live cursors, history, and offline merge."
    },
    {
      heading: "Concurrency model",
      body: "OT with a central session server per doc (server assigns a revision, transforms client ops against concurrent ones), or a sequence CRDT where each character has a unique id so ops commute."
    },
    {
      heading: "Session routing",
      body: "Shard documents to session servers by doc id; all editors of a doc connect to that server, which keeps it in memory."
    },
    {
      heading: "Persistence",
      body: "Append every op with its revision to a durable log, ack the client, then broadcast. Periodic snapshots plus the log rebuild any version."
    },
    {
      heading: "Offline and presence",
      body: "Clients buffer ops offline and rebase (OT) or merge (CRDT) on reconnect. Presence is sent on a separate ephemeral channel."
    }
  ],
  keyPoints: [
    "Explains why concurrent positional edits conflict",
    "Uses OT or CRDT and explains the difference",
    "Routes a doc's editors to one session server",
    "Persists ops durably before ack",
    "Uses snapshots plus op log",
    "Treats cursors as ephemeral presence",
    "Handles offline edits on reconnect"
  ],
  cardIds: ["operational-transform", "crdt", "websockets", "event-sourcing"]
};
