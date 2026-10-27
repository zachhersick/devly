export default {
  id: "payment-system",
  title: "Design a Payment System",
  difficulty: "hard",
  minutes: 15,
  tags: ["consistency", "reliability", "security"],
  prompt: "Design the payment backend for a marketplace processing 10 million payments a day through external card processors. Buyers pay, sellers get paid out weekly, and the company takes a fee. Every cent must be accounted for, even when processors time out.",
  requirements: {
    functional: [
      "Charge buyers via external payment processors",
      "Record seller balances and fees",
      "Pay out sellers on a schedule",
      "Refunds"
    ],
    nonFunctional: ["Never charge twice or lose a payment", "Auditable and reconcilable", "PCI-compliant handling of card data"]
  },
  quiz: [
    {
      q: "Processor call times out. Was the card charged?",
      choices: [
        "Unknown: retry with the same idempotency key or query status",
        "Definitely not",
        "Definitely yes",
        "Charge again to be safe"
      ],
      answer: 0,
      why: "Timeouts are ambiguous; idempotent retries or status checks resolve them safely.",
      tag: "reliability"
    },
    {
      q: "How to record money movements?",
      choices: ["One balance column updated in place", "Log files", "Double-entry ledger of immutable entries", "Spreadsheet"],
      answer: 2,
      why: "Debits and credits that always balance make errors visible and audits possible.",
      tag: "data-model"
    },
    {
      q: "Raw card numbers should?",
      choices: [
        "Be stored encrypted in our main DB",
        "Never touch our servers: tokenize via the processor",
        "Be logged for debugging",
        "Go in cookies"
      ],
      answer: 1,
      why: "Client-side tokenization keeps most systems out of PCI scope.",
      tag: "security"
    },
    {
      q: "Our records vs processor's settlement file disagree. Process?",
      choices: ["Ignore it", "Trust ours", "Delete the file", "Daily reconciliation job flags mismatches"],
      answer: 3,
      why: "Reconciliation catches lost callbacks, duplicates and fee differences.",
      tag: "consistency"
    },
    {
      q: "Database for the ledger?",
      choices: ["Eventually consistent cache", "Search index", "Relational DB with ACID transactions", "Log aggregator"],
      answer: 2,
      why: "Money needs atomic, durable, consistent writes.",
      tag: "consistency"
    },
    {
      q: "Processor sends a webhook 'payment succeeded' twice. Handle by?",
      choices: ["Dedupe on the processor's event id", "Credit twice", "Ignore all webhooks", "Refund one"],
      answer: 0,
      why: "Webhooks are at-least-once, so processing must be idempotent.",
      tag: "consistency"
    },
    {
      q: "10M payments/day. Average writes/s to ledger (3 entries each)?",
      choices: ["About 35", "About 3,500", "About 35,000", "About 350"],
      answer: 3,
      why: "10M × 3 ÷ 86,400 ≈ 350 writes a second, fine for a well-run relational DB.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "buyer", label: "Buyer", kind: "client", x: 180, y: 50 },
      { id: "papi", label: "Payment API", kind: "service", x: 180, y: 126 },
      { id: "psp", label: "Card Processor", kind: "external", x: 100, y: 202 },
      { id: "ledger", label: "Ledger DB", kind: "db", x: 260, y: 202 },
      { id: "hooks", label: "Webhook Rcvr", kind: "service", x: 100, y: 278 },
      { id: "recon", label: "Reconciler", kind: "worker", x: 260, y: 278 },
      { id: "payout", label: "Payout Sched", kind: "worker", x: 180, y: 354 },
      { id: "bank", label: "Bank Rails", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "buyer", to: "papi", label: "token" },
      { from: "papi", to: "psp", label: "charge" },
      { from: "papi", to: "ledger" },
      { from: "psp", to: "hooks" },
      { from: "hooks", to: "ledger" },
      { from: "recon", to: "psp", label: "reports" },
      { from: "recon", to: "ledger" },
      { from: "payout", to: "ledger" },
      { from: "payout", to: "bank" }
    ],
    steps: [
      {
        add: ["buyer", "papi"],
        caption: "The buyer's card is tokenized by the processor's SDK; our API only sees a token."
      },
      {
        add: ["psp", "ledger"],
        caption: "The API records a pending payment, charges with an idempotency key, and writes ledger entries on success."
      },
      { add: ["hooks"], caption: "Processor webhooks confirm outcomes and are deduplicated by event id." },
      { add: ["recon"], caption: "A daily reconciler matches our ledger against processor settlement reports." },
      { add: ["payout", "bank"], caption: "A scheduler pays sellers their available balance through bank transfers." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Charge, refund, track balances and fees, and pay out sellers with exactly-once money movement, auditability and PCI safety."
    },
    {
      heading: "Payment flow",
      body: "Create payment(id, idempotency_key, amount, status=PENDING). Call the processor with that key. On success, write ledger entries in one transaction: debit buyer funds, credit seller balance and platform fee."
    },
    {
      heading: "Ledger",
      body: "Append-only double-entry entries; balances are sums (with cached snapshots). Corrections are new entries, never edits."
    },
    {
      heading: "Uncertainty",
      body: "On timeout, mark UNKNOWN and resolve via status query or webhook. Webhooks deduped by event id. Outbox pattern for downstream events."
    },
    {
      heading: "Reconciliation and payouts",
      body: "Daily jobs compare ledger to processor and bank reports. Weekly payouts create ledger entries then bank transfers, also idempotent."
    }
  ],
  keyPoints: [
    "Uses idempotency keys with the processor",
    "Treats timeouts as unknown and resolves them",
    "Uses an immutable double-entry ledger",
    "Keeps card data out via tokenization",
    "Deduplicates webhooks",
    "Reconciles daily against external reports",
    "Uses ACID transactions for ledger writes"
  ],
  cardIds: ["double-entry-ledger", "idempotency-key", "acid", "transactional-outbox"]
};
