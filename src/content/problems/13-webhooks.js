export default {
  id: "webhooks",
  title: "Design a Webhook Delivery System",
  difficulty: "easy",
  minutes: 9,
  tags: ["queues", "reliability", "security"],
  prompt: "A payments platform notifies merchants' servers about events like 'payment succeeded' by sending HTTP POSTs to URLs they register. There are 100,000 merchants and 20 million events a day. Merchant servers are often slow or down.",
  requirements: {
    functional: [
      "Merchants register endpoint URLs and choose event types",
      "Deliver each event to subscribed endpoints",
      "Retry failed deliveries and show delivery history"
    ],
    nonFunctional: ["At-least-once delivery", "One slow merchant must not delay others", "Merchants can verify a webhook is genuine"]
  },
  quiz: [
    {
      q: "Merchant server returns 500. What next?",
      choices: [
        "Drop the event",
        "Retry instantly in a tight loop",
        "Email the CEO",
        "Retry with exponential backoff for up to a day or so"
      ],
      answer: 3,
      why: "Backoff gives a struggling server room to recover while still delivering eventually.",
      tag: "reliability"
    },
    {
      q: "How do merchants know a webhook really came from us?",
      choices: [
        "Check the sender's IP only",
        "Verify an HMAC signature with a shared secret",
        "Trust the User-Agent",
        "Call support"
      ],
      answer: 1,
      why: "Signing the body plus a timestamp lets merchants verify origin and reject replays.",
      tag: "security"
    },
    {
      q: "At-least-once means merchants may see duplicates. Help them by?",
      choices: ["Including a unique event id", "Sending fewer events", "Using GET", "Hiding retries"],
      answer: 0,
      why: "With a stable event id, merchants can deduplicate on their side.",
      tag: "consistency"
    },
    {
      q: "One merchant's endpoint takes 30 s per call. Risk?",
      choices: ["None", "It speeds things up", "It ties up shared workers and delays everyone", "It corrupts the DB"],
      answer: 2,
      why: "Use short timeouts and per-merchant queues or concurrency limits so one slow endpoint can't starve others.",
      tag: "reliability"
    },
    {
      q: "20M events/day. Average deliveries per second?",
      choices: ["About 23", "About 230", "About 2,300", "About 23,000"],
      answer: 1,
      why: "20M ÷ 86,400 ≈ 230 per second, more if events fan out to several endpoints.",
      tag: "estimation"
    },
    {
      q: "An endpoint has failed for 3 days. Sensible action?",
      choices: [
        "Retry every second forever",
        "Delete their account",
        "Send to another merchant",
        "Disable it and notify the merchant"
      ],
      answer: 3,
      why: "Stop wasting capacity, alert the merchant, and let them replay once fixed.",
      tag: "reliability"
    },
    {
      q: "Merchants pass a URL like http://10.0.0.5/. Risk?",
      choices: ["None", "Slow DNS", "Server-side request forgery into our network", "Wrong time zone"],
      answer: 2,
      why: "Block private and internal addresses so webhooks can't be used to probe our own systems.",
      tag: "security"
    }
  ],
  diagram: {
    nodes: [
      { id: "events", label: "Event Source", kind: "service", x: 180, y: 50 },
      { id: "q", label: "Event Queue", kind: "queue", x: 180, y: 126 },
      { id: "fan", label: "Dispatcher", kind: "worker", x: 100, y: 202 },
      { id: "subs", label: "Subscriptions", kind: "db", x: 260, y: 202 },
      { id: "dq", label: "Per-Merchant Q", kind: "queue", x: 180, y: 278 },
      { id: "send", label: "Sender Pool", kind: "worker", x: 100, y: 354 },
      { id: "log", label: "Delivery Log", kind: "db", x: 260, y: 354 },
      { id: "merchant", label: "Merchant API", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "events", to: "q" },
      { from: "q", to: "fan" },
      { from: "fan", to: "subs" },
      { from: "fan", to: "dq" },
      { from: "dq", to: "send" },
      { from: "send", to: "log" },
      { from: "send", to: "merchant", label: "POST" }
    ],
    steps: [
      { add: ["events", "q"], caption: "Business events are written to a durable queue as they happen." },
      {
        add: ["fan", "subs"],
        caption: "A dispatcher looks up which endpoints want each event type and creates one delivery task per endpoint."
      },
      { add: ["dq"], caption: "Tasks go into per-merchant queues so a slow merchant only slows itself." },
      {
        add: ["send", "merchant"],
        caption: "Senders POST signed payloads with short timeouts, scheduling retries with backoff on failure."
      },
      { add: ["log"], caption: "Every attempt is logged so merchants can see history and replay events." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Reliable, at-least-once delivery of events to merchant URLs, isolated per merchant, verifiable, with retries and history."
    },
    {
      heading: "Pipeline",
      body: "Events go to a queue. A dispatcher fans them out into delivery tasks (event id, endpoint id, attempt count) on per-merchant queues."
    },
    {
      heading: "Sending",
      body: "Workers POST JSON with headers for event id, timestamp and HMAC signature. Timeout after a few seconds. 2xx marks success."
    },
    {
      heading: "Retries",
      body: "Failures retry with exponential backoff and jitter for about 24–72 hours, then land in a dead-letter state. Endpoints failing for days get disabled with an alert."
    },
    {
      heading: "Safety",
      body: "Validate URLs to block internal addresses, rotate signing secrets, and let merchants replay any event from the log."
    }
  ],
  keyPoints: [
    "Retries with exponential backoff and jitter",
    "Signs payloads with HMAC plus a timestamp",
    "Includes a unique event id for deduplication",
    "Isolates merchants so one slow endpoint doesn't block others",
    "Uses short timeouts",
    "Keeps delivery logs and allows replay",
    "Disables persistently failing endpoints",
    "Guards against SSRF"
  ],
  cardIds: ["hmac-signing", "retry-backoff", "dead-letter-queue", "bulkhead"]
};
