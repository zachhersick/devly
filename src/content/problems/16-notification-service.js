export default {
  id: "notification-service",
  title: "Design a Notification Service",
  difficulty: "medium",
  minutes: 12,
  tags: ["queues", "reliability", "scaling"],
  prompt: "A large app sends notifications by push, SMS and email: order updates, security alerts and marketing. It sends 100 million notifications a day with spikes during campaigns. Users can opt out per channel and type.",
  requirements: {
    functional: [
      "Other services send a notification request for a user",
      "Deliver via push, SMS or email based on preferences",
      "Respect opt-outs and quiet hours",
      "Track delivery status"
    ],
    nonFunctional: ["Critical alerts arrive within seconds", "No duplicate sends", "Survive provider outages"]
  },
  quiz: [
    {
      q: "Marketing blast of 50M floods the system. Protect alerts how?",
      choices: ["One shared queue", "Drop alerts", "Separate priority queues per type", "Send marketing first"],
      answer: 2,
      why: "High-priority alerts get their own queue and workers so bulk sends can't delay them.",
      tag: "queues"
    },
    {
      q: "Where are opt-outs checked?",
      choices: ["Centrally in the notification service before sending", "By each calling service", "By the phone", "Never"],
      answer: 0,
      why: "Central checks make preferences consistent and keep callers simple.",
      tag: "requirements"
    },
    {
      q: "SMS provider is down. Best move?",
      choices: [
        "Fail all SMS forever",
        "Send by email instead without asking",
        "Crash",
        "Retry with backoff and fail over to a second provider"
      ],
      answer: 3,
      why: "Multiple providers behind a circuit breaker keep SMS flowing during an outage.",
      tag: "reliability"
    },
    {
      q: "Caller retries a request after a timeout. Avoid double SMS by?",
      choices: ["Bigger timeouts", "Caller-supplied idempotency key", "Random delays", "Only one caller"],
      answer: 1,
      why: "The service records the key and ignores repeats.",
      tag: "consistency"
    },
    {
      q: "100M/day, 5× peak. Sends per second at peak?",
      choices: ["About 6,000", "About 600", "About 60,000", "About 600,000"],
      answer: 0,
      why: "100M ÷ 86,400 ≈ 1,160/s; × 5 ≈ 6,000/s.",
      tag: "estimation"
    },
    {
      q: "Mobile push is sent through?",
      choices: ["Directly to the phone's IP", "SMS gateway", "APNs / FCM with a stored device token", "WebSockets only"],
      answer: 2,
      why: "Apple and Google push gateways deliver to devices using tokens the app registers.",
      tag: "api"
    },
    {
      q: "Quiet hours 10pm–8am in the user's zone. Implement by?",
      choices: ["Ignoring zones", "Delaying non-urgent sends to a scheduled queue", "Dropping them", "Sending at UTC midnight"],
      answer: 1,
      why: "Hold non-urgent messages until the window ends using delayed delivery.",
      tag: "queues"
    }
  ],
  diagram: {
    nodes: [
      { id: "svc", label: "Caller Service", kind: "service", x: 180, y: 50 },
      { id: "napi", label: "Notify API", kind: "service", x: 180, y: 145 },
      { id: "prefs", label: "Preferences", kind: "db", x: 60, y: 240 },
      { id: "hi", label: "Priority Q", kind: "queue", x: 180, y: 240 },
      { id: "lo", label: "Bulk Q", kind: "queue", x: 300, y: 240 },
      { id: "w", label: "Channel Wkrs", kind: "worker", x: 100, y: 335 },
      { id: "log", label: "Status Log", kind: "db", x: 260, y: 335 },
      { id: "apns", label: "APNs / FCM", kind: "external", x: 60, y: 430 },
      { id: "sms", label: "SMS Vendors", kind: "external", x: 180, y: 430 },
      { id: "mail", label: "Email Vendor", kind: "external", x: 300, y: 430 }
    ],
    edges: [
      { from: "svc", to: "napi" },
      { from: "napi", to: "prefs" },
      { from: "napi", to: "hi", label: "alerts" },
      { from: "napi", to: "lo", label: "bulk" },
      { from: "hi", to: "w" },
      { from: "lo", to: "w" },
      { from: "w", to: "log" },
      { from: "w", to: "apns" },
      { from: "w", to: "sms" },
      { from: "w", to: "mail" }
    ],
    steps: [
      {
        add: ["svc", "napi"],
        caption: "Services send one request (user, type, template, data, idempotency key) to a notification API."
      },
      {
        add: ["prefs"],
        caption: "The API checks opt-outs, quiet hours and which channels the user wants, then renders the message."
      },
      {
        add: ["hi", "lo"],
        caption: "Critical and bulk messages go to separate queues so campaigns never delay security alerts."
      },
      { add: ["w", "log"], caption: "Channel workers send with rate limits, retries and status tracking." },
      {
        add: ["apns", "sms", "mail"],
        caption: "Third-party providers do final delivery; SMS has a backup provider behind a circuit breaker."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Multi-channel delivery honoring preferences, fast critical alerts, no duplicates, resilient to provider failures. About 6k sends/s at peak."
    },
    {
      heading: "API",
      body: "POST /notifications with user id, type, template id, variables and idempotency key. Returns 202 with a notification id."
    },
    {
      heading: "Routing",
      body: "Look up preferences and device tokens, drop opted-out channels, delay non-urgent messages in quiet hours, render templates, and enqueue per channel and priority."
    },
    {
      heading: "Delivery",
      body: "Workers call APNs/FCM, SMS and email providers with per-provider rate limits. Retries use backoff; persistent failures go to a dead-letter queue. Invalid device tokens are removed."
    },
    {
      heading: "Tracking",
      body: "A status log records queued, sent, delivered and failed, fed by provider callbacks, for support and analytics."
    }
  ],
  keyPoints: [
    "Separates priority traffic from bulk campaigns",
    "Checks preferences and opt-outs centrally",
    "Uses idempotency keys to prevent duplicates",
    "Retries with backoff and uses a DLQ",
    "Has provider failover with circuit breakers",
    "Handles quiet hours with delayed sending",
    "Estimates peak send rate",
    "Tracks delivery status"
  ],
  cardIds: ["idempotency-key", "circuit-breaker", "dead-letter-queue", "delayed-delivery"]
};
