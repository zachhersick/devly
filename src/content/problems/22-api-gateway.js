export default {
  id: "api-gateway",
  title: "Design an API Gateway",
  difficulty: "medium",
  minutes: 12,
  tags: ["load-balancing", "security", "reliability"],
  prompt: "A company with 80 microservices wants one public entry point. The gateway must authenticate requests, enforce rate limits, route to the right service, and handle 200,000 requests per second without adding more than a few milliseconds.",
  requirements: {
    functional: [
      "Route requests to services by path and version",
      "Authenticate tokens and pass user identity downstream",
      "Apply rate limits per client",
      "Collect logs and metrics for every request"
    ],
    nonFunctional: ["Under 5 ms added latency at p99", "No single point of failure", "Config changes without restarts"]
  },
  quiz: [
    {
      q: "Verifying a JWT on every request. Avoid a DB call by?",
      choices: [
        "Checking the signature with the issuer's public key locally",
        "Calling the auth service each time",
        "Skipping auth",
        "Asking the client"
      ],
      answer: 0,
      why: "Signed tokens can be verified in memory; keys are fetched and cached periodically.",
      tag: "security"
    },
    {
      q: "How does the gateway find healthy service instances?",
      choices: [
        "Hardcoded IPs",
        "Random guesses",
        "Service discovery plus health checks",
        "DNS round robin only, never updated"
      ],
      answer: 2,
      why: "A registry tracks live instances and the gateway balances across healthy ones.",
      tag: "load-balancing"
    },
    {
      q: "Rate limit counters across 50 gateway nodes?",
      choices: [
        "Each node counts alone with no sharing",
        "Shared counters in Redis, or local limits sized per node",
        "No limits",
        "Count in the DB per request"
      ],
      answer: 1,
      why: "A shared store gives accurate global limits; local per-node limits are cheaper but approximate.",
      tag: "consistency"
    },
    {
      q: "One service gets slow and requests pile up. Protect the gateway?",
      choices: [
        "Unlimited retries",
        "Bigger thread pool forever",
        "Restart the gateway",
        "Timeouts and a circuit breaker per upstream"
      ],
      answer: 3,
      why: "Fail fast to a sick service so its slowness doesn't eat all gateway resources.",
      tag: "reliability"
    },
    {
      q: "Gateway nodes should be?",
      choices: [
        "One big server",
        "Stateful with sticky sessions",
        "Stateless, behind an L4 load balancer",
        "Inside each service"
      ],
      answer: 2,
      why: "Stateless nodes scale horizontally and any node can serve any request.",
      tag: "scaling"
    },
    {
      q: "How do services know which user is calling?",
      choices: [
        "Gateway passes verified identity in a trusted header",
        "Services re-parse passwords",
        "Ask the browser",
        "They don't need to"
      ],
      answer: 0,
      why: "After verifying the token, the gateway forwards user id and scopes on an internal header.",
      tag: "security"
    },
    {
      q: "Route changes should apply without restart via?",
      choices: ["Recompiling", "Editing on each box by hand", "Weekly deploys", "Hot-reloading config from a config store"],
      answer: 3,
      why: "Gateways watch a config store and swap routing tables in memory.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Clients", kind: "client", x: 180, y: 50 },
      { id: "l4", label: "L4 Balancer", kind: "lb", x: 180, y: 126 },
      { id: "gw", label: "Gateway Nodes", kind: "gateway", x: 180, y: 202 },
      { id: "rl", label: "Rate Limit KV", kind: "cache", x: 60, y: 278 },
      { id: "disc", label: "Discovery", kind: "db", x: 180, y: 278 },
      { id: "cfg", label: "Config Store", kind: "db", x: 300, y: 278 },
      { id: "s1", label: "Orders Svc", kind: "service", x: 100, y: 354 },
      { id: "s2", label: "Users Svc", kind: "service", x: 260, y: 354 },
      { id: "obs", label: "Logs/Metrics", kind: "storage", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "l4", label: "HTTPS" },
      { from: "l4", to: "gw" },
      { from: "gw", to: "rl" },
      { from: "gw", to: "disc" },
      { from: "gw", to: "cfg", label: "watch" },
      { from: "gw", to: "s1" },
      { from: "gw", to: "s2" },
      { from: "gw", to: "obs" }
    ],
    steps: [
      {
        add: ["client", "l4", "gw"],
        caption: "A layer-4 balancer spreads TLS connections across stateless gateway nodes."
      },
      {
        add: ["s1", "s2", "disc"],
        caption: "Gateways route by path to services, picking healthy instances from service discovery."
      },
      { add: ["rl"], caption: "Per-client rate limits use counters in a shared in-memory store." },
      { add: ["cfg"], caption: "Routes, limits and auth rules come from a config store and reload without restarts." },
      { add: ["obs"], caption: "Every request emits a log line, metrics and a trace id for observability." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Single entry point doing auth, rate limiting, routing and telemetry at 200k req/s, adding only a few milliseconds."
    },
    {
      heading: "Request pipeline",
      body: "Terminate TLS, match route, verify JWT locally with cached public keys, check rate limit, forward with identity headers and a trace id, then log and record metrics."
    },
    {
      heading: "Routing and health",
      body: "Service discovery provides instances; the gateway load-balances with health checks, timeouts, retries for safe methods and circuit breakers per upstream."
    },
    {
      heading: "Rate limiting",
      body: "Token bucket per API key in Redis with Lua scripts for atomicity; fall back to local limits if Redis is slow."
    },
    {
      heading: "Operations",
      body: "Stateless nodes autoscale behind an L4 balancer. Config is watched and hot-reloaded. Bulkheads keep one bad upstream from starving the rest."
    }
  ],
  keyPoints: [
    "Verifies tokens locally without a DB call",
    "Uses service discovery and health checks",
    "Implements distributed rate limiting",
    "Applies timeouts and circuit breakers per upstream",
    "Keeps gateway nodes stateless and horizontally scaled",
    "Passes identity and trace ids downstream",
    "Hot-reloads config"
  ],
  cardIds: ["api-gateway-pattern", "jwt", "circuit-breaker", "service-discovery", "l4-vs-l7"]
};
