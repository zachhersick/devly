export default {
  id: "ecommerce-checkout",
  title: "Design E-commerce Checkout",
  difficulty: "medium",
  minutes: 13,
  tags: ["consistency", "reliability", "queues"],
  prompt: "An online store handles 2 million orders a day, peaking at 500 orders per second on sale days. Checkout must reserve stock, charge the card, create the order and trigger shipping. Any step can fail, and customers must never be charged for an order that doesn't exist.",
  requirements: {
    functional: ["Turn a cart into an order", "Reserve inventory and take payment", "Confirm the order and notify fulfillment"],
    nonFunctional: [
      "No charge without an order, no order without stock",
      "Checkout under 2 seconds",
      "Survive failures of any one service"
    ]
  },
  quiz: [
    {
      q: "Inventory, payments and orders are separate services. Atomic commit across them?",
      choices: [
        "One global SQL transaction",
        "Hope",
        "Saga with compensating actions",
        "Two-phase commit with the card network"
      ],
      answer: 2,
      why: "A saga runs local steps and undoes earlier ones (release stock, refund) if a later step fails.",
      tag: "consistency"
    },
    {
      q: "Payment step fails after stock was reserved. Then?",
      choices: ["Release the reservation", "Ship anyway", "Keep stock reserved forever", "Charge later silently"],
      answer: 0,
      why: "Compensation releases the hold so others can buy the item.",
      tag: "reliability"
    },
    {
      q: "Customer clicks 'Pay' twice. Prevent double charge with?",
      choices: ["Disable the network", "A larger button", "Captcha", "Idempotency key per checkout"],
      answer: 3,
      why: "The payment service returns the first result for the same key.",
      tag: "api"
    },
    {
      q: "Order service crashes after charging but before saving. Recover by?",
      choices: [
        "Nothing",
        "Orchestrator persists saga state and resumes or compensates",
        "Refund every order",
        "Ask the customer"
      ],
      answer: 1,
      why: "A durable saga log lets a restarted orchestrator finish or roll back.",
      tag: "reliability"
    },
    {
      q: "Fulfillment should start how?",
      choices: [
        "Order service emits an OrderConfirmed event to a queue",
        "Fulfillment polls payments",
        "Email the warehouse",
        "Shared DB table scan"
      ],
      answer: 0,
      why: "Events decouple services; fulfillment consumes at its own pace.",
      tag: "queues"
    },
    {
      q: "Reserve before or after charging?",
      choices: ["Charge first, then check stock", "Only reserve after shipping", "Reserve first, then charge", "Never reserve"],
      answer: 2,
      why: "Reserving first avoids charging for items you can't deliver.",
      tag: "requirements"
    },
    {
      q: "500 orders/s peak. Is the order DB the bottleneck?",
      choices: [
        "It needs 1,000 shards",
        "A single well-tuned relational primary can handle it, shard by customer later",
        "Use only Redis",
        "Store orders in logs"
      ],
      answer: 1,
      why: "Hundreds of writes per second is modest for a relational DB.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "shopper", label: "Shopper", kind: "client", x: 180, y: 50 },
      { id: "co", label: "Checkout Orch", kind: "service", x: 180, y: 126 },
      { id: "inv", label: "Inventory Svc", kind: "service", x: 60, y: 202 },
      { id: "pay", label: "Payment Svc", kind: "service", x: 180, y: 202 },
      { id: "ord", label: "Order Svc", kind: "service", x: 300, y: 202 },
      { id: "saga", label: "Saga Log", kind: "db", x: 100, y: 278 },
      { id: "psp", label: "Card Network", kind: "external", x: 260, y: 278 },
      { id: "q", label: "Order Events", kind: "queue", x: 180, y: 354 },
      { id: "ful", label: "Fulfillment", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "shopper", to: "co", label: "checkout" },
      { from: "co", to: "inv", label: "reserve" },
      { from: "co", to: "pay", label: "charge" },
      { from: "co", to: "ord", label: "create" },
      { from: "co", to: "saga" },
      { from: "pay", to: "psp" },
      { from: "ord", to: "q" },
      { from: "q", to: "ful" }
    ],
    steps: [
      { add: ["shopper", "co"], caption: "A checkout orchestrator runs the steps and owns the outcome." },
      { add: ["saga"], caption: "Every step and its result is written to a saga log so a crash can resume." },
      { add: ["inv"], caption: "First it reserves stock, with an expiry in case checkout stalls." },
      { add: ["pay", "psp"], caption: "Then it charges the card with an idempotency key." },
      { add: ["ord", "q", "ful"], caption: "Finally the order is confirmed and an event tells fulfillment to ship." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Convert carts to orders, reserve stock, charge, notify fulfillment; never charge without an order. Peak 500 orders/s."
    },
    {
      heading: "Saga",
      body: "An orchestrator runs: reserve inventory → authorize payment → create order → capture payment → emit OrderConfirmed. Each step has a compensation: release stock, void authorization, cancel order."
    },
    {
      heading: "Durability",
      body: "Saga state is stored after each step. On restart, the orchestrator resumes or compensates in-flight checkouts."
    },
    {
      heading: "Idempotency",
      body: "Every call carries the checkout id as an idempotency key, so retries after timeouts don't double reserve or charge."
    },
    {
      heading: "Async parts",
      body: "Emails, fulfillment and analytics consume order events from a queue, keeping checkout latency low."
    }
  ],
  keyPoints: [
    "Uses a saga with compensating actions",
    "Orders steps sensibly (reserve before charge)",
    "Persists saga state for recovery",
    "Uses idempotency keys on every step",
    "Sends post-checkout work through events",
    "Reserves stock with an expiry",
    "Sizes the write load realistically"
  ],
  cardIds: ["saga-pattern", "idempotency-key", "transactional-outbox", "two-phase-commit"]
};
