export default {
  id: "developer-api-platform",
  title: "Design a Public Developer API",
  difficulty: "medium",
  minutes: 12,
  tags: ["api", "security", "scaling"],
  prompt: "A weather company sells API access to developers on free, pro and enterprise plans with different monthly quotas and per-second limits. 200,000 API keys make 30,000 requests per second in total. Usage must be billed accurately each month.",
  requirements: {
    functional: [
      "Developers create and rotate API keys",
      "Enforce per-second limits and monthly quotas by plan",
      "Show usage dashboards and bill monthly"
    ],
    nonFunctional: ["Limit checks add under 2 ms", "Billing counts are accurate", "Leaked keys can be revoked instantly"]
  },
  quiz: [
    {
      q: "How should API keys be stored?",
      choices: ["Plain text", "A hash of the key, shown to the user once", "In the URL", "Encrypted with the key itself"],
      answer: 1,
      why: "Like passwords: store a hash so a DB leak doesn't expose usable keys.",
      tag: "security"
    },
    {
      q: "Per-second limit (e.g. 10 rps). Algorithm?",
      choices: ["Monthly counter only", "No limit", "Sleep 100 ms always", "Token bucket per key"],
      answer: 3,
      why: "A token bucket allows short bursts while holding the average rate.",
      tag: "api"
    },
    {
      q: "Monthly quota needs exact counts for billing. Approach?",
      choices: [
        "Approximate in-memory counter only",
        "Estimate from CPU",
        "Count every request in a durable usage log, then aggregate",
        "Ask developers"
      ],
      answer: 2,
      why: "Fast counters enforce the quota live; a durable log is the source of truth for invoices.",
      tag: "consistency"
    },
    {
      q: "What response when limit is exceeded?",
      choices: ["429 with Retry-After and limit headers", "500", "200 with empty body", "Drop the connection"],
      answer: 0,
      why: "429 tells clients it's a rate limit, and headers say when to retry.",
      tag: "api"
    },
    {
      q: "Key lookup on every request without hitting the DB?",
      choices: [
        "Query DB each time",
        "Embed the plan in the URL",
        "Skip it",
        "Cache key → plan in memory with short TTL and revocation events"
      ],
      answer: 3,
      why: "A cache keeps lookups fast; revocation events invalidate keys immediately.",
      tag: "caching"
    },
    {
      q: "30k req/s, each usage event 100 bytes. Data/day?",
      choices: ["About 26 GB", "About 260 GB", "About 2.6 TB", "About 2.6 GB"],
      answer: 1,
      why: "30,000 × 100 B × 86,400 s ≈ 259 GB a day of raw usage events.",
      tag: "estimation"
    },
    {
      q: "How to change APIs without breaking developers?",
      choices: [
        "Version the API (v1, v2) and deprecate slowly",
        "Change fields freely",
        "Rename endpoints monthly",
        "Only add breaking changes on Fridays"
      ],
      answer: 0,
      why: "Versioning lets old integrations keep working while new ones adopt the new shape.",
      tag: "api"
    }
  ],
  diagram: {
    nodes: [
      { id: "dev", label: "Developer App", kind: "client", x: 180, y: 50 },
      { id: "gw", label: "API Gateway", kind: "gateway", x: 180, y: 126 },
      { id: "keys", label: "Key Cache", kind: "cache", x: 100, y: 202 },
      { id: "rl", label: "Limiter KV", kind: "cache", x: 260, y: 202 },
      { id: "api", label: "Weather API", kind: "service", x: 100, y: 278 },
      { id: "q", label: "Usage Stream", kind: "queue", x: 260, y: 278 },
      { id: "agg", label: "Usage Agg", kind: "worker", x: 180, y: 354 },
      { id: "bill", label: "Billing DB", kind: "db", x: 180, y: 430 }
    ],
    edges: [
      { from: "dev", to: "gw", label: "API key" },
      { from: "gw", to: "keys" },
      { from: "gw", to: "rl" },
      { from: "gw", to: "api" },
      { from: "gw", to: "q", label: "usage" },
      { from: "q", to: "agg" },
      { from: "agg", to: "bill" }
    ],
    steps: [
      { add: ["dev", "gw", "api"], caption: "All calls pass through a gateway in front of the weather API." },
      {
        add: ["keys"],
        caption: "The gateway hashes the API key and finds its plan in a cache, invalidated instantly on revocation."
      },
      {
        add: ["rl"],
        caption: "Token buckets per key enforce per-second limits; a monthly counter enforces the quota."
      },
      {
        add: ["q", "agg", "bill"],
        caption: "Every request emits a usage event; aggregators produce exact monthly totals for billing and dashboards."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Key management, rate limits and quotas by plan, accurate billing, instant revocation, at 30k req/s."
    },
    {
      heading: "Keys",
      body: "Generate long random keys with a visible prefix, store only a hash, allow multiple active keys for rotation, and scope keys to products."
    },
    {
      heading: "Enforcement",
      body: "Gateway looks up the key hash in a cache, applies a token bucket in Redis for per-second limits and checks a monthly counter. Over-limit returns 429 with headers."
    },
    {
      heading: "Metering",
      body: "Each request produces a usage event to a stream. Aggregators roll up per key per hour into a billing DB; invoices come from these rollups, not the live counters."
    },
    {
      heading: "Developer experience",
      body: "Versioned APIs, clear error codes, usage dashboards and alerts at 80% of quota."
    }
  ],
  keyPoints: [
    "Stores only hashed API keys",
    "Uses token bucket for per-second limits",
    "Separates live enforcement counters from billing records",
    "Returns 429 with retry headers",
    "Caches key lookups with instant revocation",
    "Meters usage through a stream into rollups",
    "Versions the API"
  ],
  cardIds: ["api-keys-scopes", "token-bucket", "api-gateway-pattern"]
};
