export default {
  id: "chat-app",
  title: "Design a Chat App",
  difficulty: "medium",
  minutes: 14,
  tags: ["realtime", "storage", "queues"],
  prompt: "Design one-to-one messaging like WhatsApp for 500 million daily users sending 40 messages each per day. Messages should arrive instantly when the recipient is online and be delivered when they come back if not. Users see sent, delivered and read ticks.",
  requirements: {
    functional: [
      "Send and receive 1:1 messages in real time",
      "Deliver messages to offline users later",
      "Sent / delivered / read receipts",
      "Message history on the device"
    ],
    nonFunctional: [
      "Under 500 ms delivery when both online",
      "No lost or reordered messages in a chat",
      "Huge number of concurrent connections"
    ]
  },
  quiz: [
    {
      q: "500M users × 40 messages. Messages per second?",
      choices: ["About 23,000", "About 230,000", "About 2,300", "About 2.3 million"],
      answer: 1,
      why: "20 billion a day ÷ 86,400 ≈ 230k/s on average.",
      tag: "estimation"
    },
    {
      q: "Best transport for instant delivery?",
      choices: ["Polling every 10 s", "Email", "SMS", "A persistent WebSocket per device"],
      answer: 3,
      why: "A long-lived connection lets the server push messages the moment they arrive.",
      tag: "realtime"
    },
    {
      q: "Recipient is on a different chat server. How to route?",
      choices: [
        "Broadcast to every server",
        "Store and wait for polling",
        "Look up their server in a session registry and forward",
        "Ask the client to reconnect"
      ],
      answer: 2,
      why: "A registry maps user to connected gateway so messages hop directly to the right server.",
      tag: "realtime"
    },
    {
      q: "Recipient is offline. What happens?",
      choices: [
        "Store it in an inbox and push-notify; deliver on reconnect",
        "Drop the message",
        "Bounce to sender",
        "Retry every second forever"
      ],
      answer: 0,
      why: "Persist first, then deliver on reconnect, with a push notification to wake the user.",
      tag: "reliability"
    },
    {
      q: "How to keep messages in order within a chat?",
      choices: [
        "Client wall-clock time",
        "Random ids",
        "Arrival time at the phone",
        "A per-conversation sequence number assigned by the server"
      ],
      answer: 3,
      why: "Server-assigned sequence numbers per conversation give one agreed order.",
      tag: "consistency"
    },
    {
      q: "Which store suits message history at this scale?",
      choices: ["Single SQL table", "Wide-column store partitioned by conversation", "A CDN", "In-memory only"],
      answer: 1,
      why: "Partition by conversation id and sort by sequence: perfect for 'latest messages in this chat'.",
      tag: "data-model"
    },
    {
      q: "Network blips cause resends. Avoid duplicate messages via?",
      choices: ["Client-generated message id, deduped on server", "Longer timeouts", "Turning off retries", "Bigger phones"],
      answer: 0,
      why: "The server ignores a message id it has already stored, so retries are safe.",
      tag: "consistency"
    }
  ],
  diagram: {
    nodes: [
      { id: "a", label: "User A", kind: "client", x: 100, y: 50 },
      { id: "b", label: "User B", kind: "client", x: 260, y: 50 },
      { id: "lb", label: "L4 Balancer", kind: "lb", x: 180, y: 145 },
      { id: "gw1", label: "Chat Gateway", kind: "service", x: 100, y: 240 },
      { id: "gw2", label: "Chat Gateway", kind: "service", x: 260, y: 240 },
      { id: "reg", label: "Session Reg", kind: "cache", x: 100, y: 335 },
      { id: "msg", label: "Message Svc", kind: "service", x: 260, y: 335 },
      { id: "db", label: "Messages DB", kind: "db", x: 100, y: 430 },
      { id: "push", label: "Push Notify", kind: "external", x: 260, y: 430 }
    ],
    edges: [
      { from: "a", to: "lb", label: "WS" },
      { from: "b", to: "lb", label: "WS" },
      { from: "lb", to: "gw1" },
      { from: "lb", to: "gw2" },
      { from: "gw1", to: "msg" },
      { from: "msg", to: "reg" },
      { from: "msg", to: "gw2", label: "forward" },
      { from: "msg", to: "db" },
      { from: "msg", to: "push" }
    ],
    steps: [
      { add: ["a", "b", "lb"], caption: "Each device keeps a WebSocket open through a layer-4 load balancer." },
      {
        add: ["gw1", "gw2"],
        caption: "Gateway servers hold millions of connections each and stay mostly stateless otherwise."
      },
      {
        add: ["msg", "db"],
        caption: "A message service assigns a sequence number, stores the message, then acks the sender."
      },
      {
        add: ["reg"],
        caption: "A session registry says which gateway each online user is connected to, so the message is forwarded there."
      },
      {
        add: ["push"],
        caption: "If the recipient is offline, a push notification goes out and messages wait in storage."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Real-time 1:1 messaging with offline delivery, ordered history and receipts, about 230k messages/s and hundreds of millions of connections."
    },
    {
      heading: "Connections",
      body: "Clients keep WebSockets to gateway servers. On connect, a gateway records user → gateway in a registry (Redis) with a heartbeat-refreshed TTL."
    },
    {
      heading: "Send path",
      body: "Sender sends with a client message id. The message service dedupes, assigns a per-conversation sequence, writes to storage and acks 'sent'. It looks up the recipient's gateway and forwards."
    },
    {
      heading: "Offline and receipts",
      body: "If no gateway is found, push-notify. On reconnect the client pulls messages after its last sequence. Delivered and read receipts are tiny messages that flow back the same way."
    },
    {
      heading: "Storage",
      body: "A wide-column store keyed by conversation id, clustered by sequence. Messages can be deleted from the server after delivery if the product keeps history on devices."
    }
  ],
  keyPoints: [
    "Estimates message rate around 230k/s",
    "Uses persistent WebSockets",
    "Keeps a user-to-gateway session registry",
    "Stores before delivering and handles offline users",
    "Orders with per-conversation sequence numbers",
    "Dedupes with client message ids",
    "Partitions storage by conversation",
    "Explains delivered and read receipts"
  ],
  cardIds: ["websockets", "wide-column-store", "heartbeat", "partition-ordering", "end-to-end-encryption"]
};
