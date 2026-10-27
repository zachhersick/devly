export default {
  id: "rate-limiter",
  title: "Design a Rate Limiter",
  difficulty: "easy",
  minutes: 10,
  tags: ["security", "reliability", "caching"],
  prompt: "Protect a public API used by 10 million clients from abuse. Each API key gets a limit such as 100 requests per minute, enforced across 50 gateway servers, and the limiter must add almost no latency.",
  requirements: {
    functional: ["Limit requests per API key (and per IP for anonymous calls)", "Return 429 with a Retry-After header when over the limit", "Configurable limits per plan"],
    nonFunctional: ["Adds under 2 ms per request", "Accurate across many servers", "If the limiter fails, the API keeps working"]
  },
  quiz: [
    {
      q: "Where should the limiter run for a public API?",
      choices: ["In each client SDK", "In the API gateway, before requests reach services", "Inside the database", "In a nightly batch job"],
      answer: 1,
      why: "Clients can't be trusted, and the gateway sees every request before it costs anything downstream.",
      tag: "requirements"
    },
    {
      q: "You want to allow short bursts but cap the average rate. Which algorithm fits best?",
      choices: ["Fixed window counter", "Token bucket", "Sliding window log", "First-come queue"],
      answer: 1,
      why: "A token bucket lets a client spend saved-up tokens in a burst while the refill rate caps the long-run average.",
      tag: "api"
    },
    {
      q: "What's the main flaw of a fixed one-minute window?",
      choices: ["It needs too much memory", "A client can send 2× the limit across a window boundary", "It can't be stored in Redis", "It blocks all clients at once"],
      answer: 1,
      why: "100 requests at 0:59 plus 100 at 1:00 all pass, so 200 requests land within about a second.",
      tag: "api"
    },
    {
      q: "Counters must be shared across 50 gateways. Where should they live?",
      choices: ["Each gateway's local memory only", "A relational DB with a row lock per request", "A fast in-memory store like Redis, updated atomically", "Sticky sessions so each key hits one gateway"],
      answer: 2,
      why: "Redis gives sub-millisecond atomic increments (or a Lua script for token buckets) that every gateway can share.",
      tag: "data-model"
    },
    {
      q: "Two gateways read a counter of 99 and both allow the request. How do you prevent this race?",
      choices: ["Read, then write with a sleep in between", "Make the check-and-increment one atomic operation (INCR or a Lua script)", "Retry on every request", "Use a longer window"],
      answer: 1,
      why: "Doing the check and the update in one atomic step means no other request can slip in between.",
      tag: "consistency"
    },
    {
      q: "Redis for the limiter goes down. What should gateways do?",
      choices: ["Reject all traffic", "Fail open: allow requests, possibly with a coarse local limit", "Crash and restart", "Queue every request until Redis is back"],
      answer: 1,
      why: "The limiter protects the API; it shouldn't take it down. Failing open with a local fallback limit keeps service up.",
      tag: "reliability"
    },
    {
      q: "Calling Redis on every request is adding latency at peak. What's a reasonable optimization?",
      choices: ["Drop the limiter at peak", "Keep small local token allowances and sync with Redis in batches", "Move counters to disk", "Rate limit only every tenth request"],
      answer: 1,
      why: "Gateways take a few tokens at a time from the shared bucket, trading a little accuracy for far fewer round trips.",
      tag: "scaling"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "API client", kind: "client", x: 180, y: 50 },
      { id: "lb", label: "Load balancer", kind: "lb", x: 180, y: 135 },
      { id: "gw", label: "Gateway", kind: "gateway", x: 180, y: 225 },
      { id: "redis", label: "Redis counters", kind: "cache", x: 75, y: 320 },
      { id: "rules", label: "Limit rules", kind: "db", x: 285, y: 320 },
      { id: "svc", label: "API services", kind: "service", x: 180, y: 420 }
    ],
    edges: [
      { from: "client", to: "lb" },
      { from: "lb", to: "gw" },
      { from: "gw", to: "redis", label: "INCR" },
      { from: "gw", to: "rules", label: "cached" },
      { from: "gw", to: "svc", label: "allowed" }
    ],
    steps: [
      { add: ["client", "lb"], caption: "Traffic from millions of clients is spread across a fleet of gateways." },
      { add: ["gw"], caption: "Every gateway runs the limiter before forwarding, and returns 429 with Retry-After when a key is over its limit." },
      { add: ["redis"], caption: "Shared counters or token buckets live in Redis, updated atomically with a Lua script." },
      { add: ["rules"], caption: "Per-plan limits are stored in a config DB and cached in each gateway's memory." },
      { add: ["svc"], caption: "Only allowed requests reach the services behind the gateway." }
    ]
  },
  modelAnswer: [
    { heading: "Placement", body: "Enforce limits in the API gateway, keyed by API key (or IP for anonymous traffic), so abusive requests are rejected before they cost anything." },
    { heading: "Algorithm", body: "Token bucket per key: capacity B, refill rate R. Store tokens and lastRefill in a Redis hash and update both in one Lua script that refills, checks and spends atomically." },
    { heading: "Responses", body: "Return 429 Too Many Requests with Retry-After, and X-RateLimit-Limit/Remaining headers on every response so clients can back off." },
    { heading: "Rules", body: "Limits per plan and endpoint live in a config store, cached in gateway memory and refreshed every few seconds." },
    { heading: "Scale and failure", body: "Redis Cluster sharded by key. If Redis is unreachable, fail open with a coarse local limit per gateway. Batching token grabs reduces round trips at peak." }
  ],
  keyPoints: [
    "Limiter placed at the gateway",
    "Algorithm chosen with trade-offs (token bucket, sliding window)",
    "Fixed-window boundary burst problem mentioned",
    "Shared counters in Redis or similar",
    "Atomic check-and-update to avoid races",
    "429 with Retry-After and rate-limit headers",
    "Fail-open behavior when the limiter is down",
    "Configurable limits per plan or endpoint"
  ],
  cardIds: ["token-bucket", "sliding-window", "consistent-hashing"]
};
