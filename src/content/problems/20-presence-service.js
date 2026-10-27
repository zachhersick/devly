export default {
  id: "presence-service",
  title: "Design Online Presence",
  difficulty: "medium",
  minutes: 11,
  tags: ["realtime", "caching", "scaling"],
  prompt: "A team chat app shows a green dot next to people who are online, and 'last seen' for others. There are 50 million connected users, each in groups with up to 1,000 members. Status should update within a few seconds.",
  requirements: {
    functional: [
      "Show online / away / offline for contacts and group members",
      "Show last seen time",
      "Update status when users connect, go idle or disconnect"
    ],
    nonFunctional: ["Status changes visible within ~5 seconds", "Low cost per connected user", "Tolerates abrupt disconnects"]
  },
  quiz: [
    {
      q: "Phone loses signal without closing the socket. Detect it how?",
      choices: ["Wait for a goodbye message", "Ask the carrier", "Heartbeats with a timeout", "Never"],
      answer: 2,
      why: "If no heartbeat arrives within, say, 30 seconds, the user is marked offline.",
      tag: "reliability"
    },
    {
      q: "Where to keep current status?",
      choices: ["In-memory store with TTL keys", "Cold object storage", "Spreadsheet", "Transactional SQL row per heartbeat"],
      answer: 0,
      why: "Status is small and short-lived; a key that expires without heartbeats marks offline automatically.",
      tag: "caching"
    },
    {
      q: "50M users heartbeat every 30 s. Writes/s?",
      choices: ["About 170k", "About 17k", "About 1,700", "About 1.7M"],
      answer: 3,
      why: "50 million ÷ 30 seconds ≈ 1.7 million heartbeats a second, which is why presence lives in memory, not a database.",
      tag: "estimation"
    },
    {
      q: "User in 20 groups of 1,000 goes online. Push to everyone?",
      choices: [
        "Yes, to all 20,000 immediately",
        "Only to members currently viewing that group or chat",
        "Never push",
        "Email them"
      ],
      answer: 1,
      why: "Fan-out only to people who are actively looking avoids a storm of useless updates.",
      tag: "scaling"
    },
    {
      q: "User flickers online/offline on a bad network. Smooth it by?",
      choices: [
        "Debounce: wait a few seconds before announcing offline",
        "Show every flicker",
        "Ban the user",
        "Shorten heartbeats to 1 ms"
      ],
      answer: 0,
      why: "A grace period hides brief disconnects and saves a lot of fan-out.",
      tag: "realtime"
    },
    {
      q: "Opening a group of 1,000 members. Get statuses via?",
      choices: ["1,000 separate HTTP calls", "Wait for pushes", "One batched lookup of all member keys", "Scan all users"],
      answer: 2,
      why: "A single multi-get against the presence store returns all statuses at once.",
      tag: "api"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Chat Client", kind: "client", x: 180, y: 50 },
      { id: "gw", label: "WS Gateway", kind: "service", x: 180, y: 126 },
      { id: "pres", label: "Presence Svc", kind: "service", x: 180, y: 202 },
      { id: "store", label: "Presence KV", kind: "cache", x: 100, y: 278 },
      { id: "subs", label: "Watchers Map", kind: "cache", x: 260, y: 278 },
      { id: "bus", label: "Pub/Sub", kind: "queue", x: 180, y: 354 },
      { id: "db", label: "Last Seen DB", kind: "db", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "gw", label: "heartbeat" },
      { from: "gw", to: "pres" },
      { from: "pres", to: "store", label: "TTL" },
      { from: "pres", to: "subs" },
      { from: "pres", to: "bus", label: "change" },
      { from: "bus", to: "gw" },
      { from: "pres", to: "db" }
    ],
    steps: [
      {
        add: ["client", "gw"],
        caption: "Clients send heartbeats over their existing WebSocket every 30 seconds or so."
      },
      {
        add: ["pres", "store"],
        caption: "The presence service refreshes a TTL key per user; if heartbeats stop, the key expires and they're offline."
      },
      {
        add: ["subs"],
        caption: "It tracks who is currently watching whom, based on open chats and visible member lists."
      },
      { add: ["bus"], caption: "Status changes are published only to gateways holding interested watchers." },
      {
        add: ["db"],
        caption: "Last-seen times are written to a durable store on disconnect, not on every heartbeat."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Near-real-time online/offline status and last seen, cheap per user, robust to sudden disconnects."
    },
    {
      heading: "Detecting status",
      body: "Heartbeats refresh presence:{user} with a 60-second TTL. Expiry or socket close triggers an offline event after a short grace period."
    },
    {
      heading: "Storage",
      body: "An in-memory KV store sharded by user id holds status; last seen is persisted on transitions only."
    },
    {
      heading: "Fan-out",
      body: "Only push changes to users actively viewing a contact or group. Large groups show statuses by polling a batched lookup when opened, rather than live pushes for all members."
    },
    {
      heading: "Cost control",
      body: "Debounce flapping, coalesce updates per second, and piggyback heartbeats on the chat connection."
    }
  ],
  keyPoints: [
    "Uses heartbeats with timeouts to detect disconnects",
    "Stores presence as TTL keys in memory",
    "Estimates heartbeat write load",
    "Limits fan-out to active watchers",
    "Debounces flapping connections",
    "Persists last seen only on transitions",
    "Uses batched lookups for group member lists"
  ],
  cardIds: ["heartbeat", "websockets", "pub-sub"]
};
