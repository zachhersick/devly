export default {
  id: "email-service",
  title: "Design an Email Service",
  difficulty: "medium",
  minutes: 13,
  tags: ["storage", "search", "queues"],
  prompt: "Build a webmail service like Gmail for 100 million users, each receiving 50 emails a day and storing years of mail. Users read, search and send emails from web and mobile, and new mail should appear within seconds.",
  requirements: {
    functional: [
      "Receive incoming mail and file it into the right mailbox",
      "Send outgoing mail",
      "List, read and search emails",
      "Labels or folders and spam filtering"
    ],
    nonFunctional: ["Never lose an accepted email", "Search returns in under a second", "New mail shows within seconds"]
  },
  quiz: [
    {
      q: "100M users × 50 emails × 50 KB. New data per day?",
      choices: ["About 2.5 TB", "About 25 PB", "About 250 TB", "About 25 GB"],
      answer: 2,
      why: "5 billion emails × 50 KB = 250 TB a day before dedupe and compression.",
      tag: "estimation"
    },
    {
      q: "Where do bodies and attachments go?",
      choices: ["Object storage, deduplicating identical attachments", "Redis", "Search index only", "The user's browser"],
      answer: 0,
      why: "Large, immutable blobs belong in object storage; identical attachments sent to many people can be stored once.",
      tag: "storage"
    },
    {
      q: "Mailbox metadata (sender, subject, labels) is best?",
      choices: ["Partitioned by sender", "One global table unsharded", "Stored in DNS", "Partitioned by user id"],
      answer: 3,
      why: "Almost every query is 'my mail', so put each user's data together.",
      tag: "sharding"
    },
    {
      q: "Searching your own email fast needs?",
      choices: ["Full scan of all email", "A per-user inverted index", "Regex in the browser", "SQL LIKE across all users"],
      answer: 1,
      why: "Index words to message ids, scoped by user, so searches hit a small posting list.",
      tag: "search"
    },
    {
      q: "Incoming mail must not be lost. When to reply 250 OK to the sender?",
      choices: ["After the message is durably stored", "Before writing anything", "After the user reads it", "Never"],
      answer: 0,
      why: "Only acknowledge once the mail is safely persisted; otherwise a crash would lose it.",
      tag: "reliability"
    },
    {
      q: "Recipient server is down when sending. Then?",
      choices: ["Bounce instantly", "Drop it", "Queue and retry for several days", "Send to a random server"],
      answer: 2,
      why: "Mail delivery retries with backoff, typically for up to a few days, before bouncing.",
      tag: "queues"
    },
    {
      q: "How does the web app learn of new mail?",
      choices: ["Poll every hour", "Push over a WebSocket or SSE connection", "Reload page", "Email notification"],
      answer: 1,
      why: "A push channel delivers 'new mail' events so the inbox updates in seconds.",
      tag: "realtime"
    }
  ],
  diagram: {
    nodes: [
      { id: "ext", label: "Other Mail Svr", kind: "external", x: 100, y: 50 },
      { id: "user", label: "Web / Mobile", kind: "client", x: 260, y: 50 },
      { id: "smtp", label: "SMTP In", kind: "service", x: 100, y: 145 },
      { id: "api", label: "Mail API", kind: "service", x: 260, y: 145 },
      { id: "proc", label: "Spam/Filter", kind: "worker", x: 100, y: 240 },
      { id: "outq", label: "Outbound Q", kind: "queue", x: 260, y: 240 },
      { id: "blob", label: "Mail Blobs", kind: "storage", x: 60, y: 335 },
      { id: "meta", label: "Mailbox DB", kind: "db", x: 180, y: 335 },
      { id: "idx", label: "Search Index", kind: "search", x: 300, y: 335 },
      { id: "sender", label: "SMTP Out", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "ext", to: "smtp" },
      { from: "smtp", to: "proc" },
      { from: "proc", to: "blob" },
      { from: "proc", to: "meta" },
      { from: "proc", to: "idx" },
      { from: "user", to: "api" },
      { from: "api", to: "meta" },
      { from: "api", to: "idx" },
      { from: "api", to: "outq", label: "send" },
      { from: "outq", to: "sender" },
      { from: "sender", to: "ext" }
    ],
    steps: [
      { add: ["ext", "smtp"], caption: "Incoming SMTP servers accept mail from the internet." },
      {
        add: ["proc", "blob", "meta"],
        caption: "A pipeline checks spam and rules, stores the body in object storage and adds a row to the recipient's mailbox."
      },
      { add: ["idx"], caption: "The message is also indexed for that user's search." },
      {
        add: ["user", "api"],
        caption: "Clients list, read and search through the mail API, getting pushes for new mail."
      },
      { add: ["outq", "sender"], caption: "Sent mail goes into an outbound queue and is delivered with retries." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Receive, store, list, search and send mail for 100M users, durably, with fast search and near-instant new-mail updates."
    },
    {
      heading: "Storage",
      body: "Bodies and attachments in object storage (with attachment dedupe by hash). Mailbox metadata (message id, thread, labels, read flag, date) in a store sharded by user id."
    },
    {
      heading: "Inbound",
      body: "SMTP servers accept mail, write to a durable queue, and reply OK. Workers run spam and filter rules, store, index and notify connected clients."
    },
    {
      heading: "Search",
      body: "A per-user inverted index over subject, body and sender, sharded by user. Recent mail is indexed within seconds."
    },
    {
      heading: "Outbound",
      body: "Sent mail is saved to the Sent label and queued; SMTP senders deliver with retries over days, handling bounces and reputation (SPF, DKIM)."
    }
  ],
  keyPoints: [
    "Estimates daily volume",
    "Stores bodies and attachments in object storage",
    "Shards mailbox metadata by user",
    "Builds per-user search indexes",
    "Acknowledges inbound mail only after durable storage",
    "Retries outbound delivery with a queue",
    "Pushes new-mail events to clients",
    "Mentions spam filtering"
  ],
  cardIds: ["inverted-index", "object-metadata-split", "shard-key", "retry-backoff"]
};
