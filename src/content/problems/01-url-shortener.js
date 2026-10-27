export default {
  id: "url-shortener",
  title: "Design a URL Shortener",
  difficulty: "easy",
  minutes: 10,
  tags: ["data-model", "caching", "scaling"],
  prompt: "Build a service that turns long URLs into short links like dv.ly/aZ3kQ9 and redirects visitors. Expect 100 million new links a month and about 100 redirects for every link created.",
  requirements: {
    functional: ["Create a short link from a long URL", "Redirect a short link to its original URL", "Optional custom alias and expiry"],
    nonFunctional: ["Redirects in under 50 ms at p99", "Highly available: redirects matter more than creation", "Short codes are not guessable in sequence"]
  },
  quiz: [
    {
      q: "Which requirement matters most for the redirect path?",
      choices: ["Strong consistency across regions", "Low latency and high availability", "Exactly-once delivery", "Full-text search over URLs"],
      answer: 1,
      why: "Redirects are the hot, user-facing path. A link created a second ago being briefly unavailable is fine; slow or failing redirects are not.",
      tag: "requirements"
    },
    {
      q: "100M new links/month at a 100:1 read ratio is roughly how many redirects per second?",
      choices: ["~400", "~4,000", "~40,000", "~400,000"],
      answer: 1,
      why: "100M × 100 = 10B redirects a month. A month is about 2.6M seconds, so 10B / 2.6M ≈ 3,900 per second on average.",
      tag: "estimation"
    },
    {
      q: "How long must a base62 code be to cover 5 years of links (6 billion)?",
      choices: ["5 characters", "6 characters", "7 characters", "10 characters"],
      answer: 2,
      why: "62^6 ≈ 57 billion would technically fit, but 62^7 ≈ 3.5 trillion leaves room for growth and sparse, non-sequential codes.",
      tag: "estimation"
    },
    {
      q: "Which HTTP status should the redirect return if you want click analytics on every visit?",
      choices: ["301 Moved Permanently", "302 Found", "200 with a meta refresh", "404 then retry"],
      answer: 1,
      why: "Browsers cache a 301 and skip your server next time. A 302 brings every click back through you, at the cost of a little extra load.",
      tag: "api"
    },
    {
      q: "What's the simplest way to generate unique codes without collisions across many app servers?",
      choices: ["Hash the URL and take 7 characters", "Random code, check the DB, retry on collision", "Each server leases a block of IDs from a counter and base62-encodes them", "Use the database's auto-increment directly in every request"],
      answer: 2,
      why: "Leasing ID ranges (say 1,000 at a time) avoids a round trip per link and can't collide. Shuffling the bits before encoding stops codes from being sequential.",
      tag: "data-model"
    },
    {
      q: "Which store fits the code → URL mapping best?",
      choices: ["A relational DB with joins across tables", "A key-value store keyed by short code", "A graph database", "A message queue"],
      answer: 1,
      why: "Every lookup is a single key fetch with no relationships, which is exactly what a key-value store scales well.",
      tag: "data-model"
    },
    {
      q: "Redirect traffic is highly skewed toward a few viral links. What helps most?",
      choices: ["Adding more database indexes", "An in-memory cache in front of the DB, plus CDN caching for hot links", "Sharding by URL length", "Writing clicks synchronously before redirecting"],
      answer: 1,
      why: "A small cache absorbs most reads when traffic follows a power law. Clicks should go to a queue asynchronously so they never slow the redirect.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Browser", kind: "client", x: 180, y: 50 },
      { id: "lb", label: "Load balancer", kind: "lb", x: 180, y: 130 },
      { id: "api", label: "Link service", kind: "service", x: 180, y: 215 },
      { id: "ids", label: "ID ranges", kind: "service", x: 300, y: 215 },
      { id: "cache", label: "Redis", kind: "cache", x: 75, y: 305 },
      { id: "db", label: "Links KV", kind: "db", x: 285, y: 305 },
      { id: "queue", label: "Click queue", kind: "queue", x: 90, y: 410 },
      { id: "worker", label: "Analytics", kind: "worker", x: 270, y: 410 }
    ],
    edges: [
      { from: "client", to: "lb", label: "GET /code" },
      { from: "lb", to: "api" },
      { from: "api", to: "ids", label: "lease" },
      { from: "api", to: "db", label: "miss" },
      { from: "api", to: "cache", label: "read" },
      { from: "api", to: "queue", label: "click" },
      { from: "queue", to: "worker" }
    ],
    steps: [
      { add: ["client", "lb"], caption: "Requests arrive through a load balancer so link servers can scale horizontally." },
      { add: ["api"], caption: "A stateless link service handles both creating links and redirecting." },
      { add: ["db"], caption: "A key-value store maps short code → long URL, sharded by code." },
      { add: ["ids"], caption: "Servers lease blocks of IDs from a counter, so codes never collide and creation needs no extra round trip." },
      { add: ["cache"], caption: "A cache in front of the store serves hot links; most redirects never touch the database." },
      { add: ["queue", "worker"], caption: "Clicks go to a queue and are counted asynchronously, keeping the redirect fast." }
    ]
  },
  modelAnswer: [
    { heading: "API", body: "POST /links {url, alias?, expiresAt?} → {code}. GET /{code} → 302 to the long URL, or 404/410 if missing or expired." },
    { heading: "Code generation", body: "Each app server leases a range of 64-bit IDs from a counter service (or a DB sequence) and base62-encodes them into 7 characters, mixing the bits first so codes aren't sequential. Custom aliases are inserted with a uniqueness check." },
    { heading: "Storage", body: "A key-value store (DynamoDB, Cassandra) keyed by code with url, createdAt and expiresAt. About 500 bytes × 6B links ≈ 3 TB over five years, sharded by code." },
    { heading: "Read path", body: "Redirects check Redis first and fall back to the store, filling the cache on a miss. Hot links can also be cached at the CDN edge for a short TTL." },
    { heading: "Analytics", body: "The redirect publishes a click event to a queue and returns immediately; workers aggregate counts per link into a separate analytics store." },
    { heading: "Scaling and reliability", body: "Stateless services behind a load balancer, replicated storage across zones, and a lazy cleanup job for expired links." }
  ],
  keyPoints: [
    "Estimated read vs write QPS and storage",
    "Short code length justified (base62, ~7 characters)",
    "Collision-free ID generation (counter ranges or similar)",
    "Key-value store keyed by code",
    "Cache for hot links",
    "302 vs 301 trade-off for analytics",
    "Click analytics handled asynchronously",
    "Expiry and custom aliases handled"
  ],
  cardIds: ["base62", "cache-aside", "cdn", "consistent-hashing"]
};
