export default {
  id: "cdn",
  title: "Design a Content Delivery Network",
  difficulty: "hard",
  minutes: 15,
  tags: ["caching", "load-balancing", "scaling"],
  prompt: "Build a CDN serving websites, images and video for thousands of customers from 200 edge locations worldwide, peaking at 100 Tbps. Customers want faster pages, less load on their own servers, and the ability to purge content within seconds.",
  requirements: {
    functional: [
      "Route users to a nearby edge",
      "Serve cached content and fetch misses from the customer origin",
      "Purge content on demand",
      "Per-customer config (TTLs, TLS certificates)"
    ],
    nonFunctional: ["Low latency worldwide", "Very high cache hit ratio", "Survive edge or region failures"]
  },
  quiz: [
    {
      q: "How do users reach the nearest edge?",
      choices: ["Users choose from a list", "Always the US edge", "Anycast IPs or GeoDNS", "Random"],
      answer: 2,
      why: "Network routing or DNS answers steer users to a nearby healthy location.",
      tag: "load-balancing"
    },
    {
      q: "A miss at 200 edges means 200 origin fetches. Reduce with?",
      choices: ["A mid-tier (shield) cache between edges and origin", "No caching", "Bigger origin", "Shorter TTLs"],
      answer: 0,
      why: "Edges ask a regional shield first, so origin sees about one fetch per object.",
      tag: "caching"
    },
    {
      q: "1,000 users request the same uncached file at once?",
      choices: ["Send 1,000 origin requests", "Reject 999", "Serve stale nothing", "Collapse into a single origin request"],
      answer: 3,
      why: "Request coalescing stops a thundering herd on the origin.",
      tag: "caching"
    },
    {
      q: "Purge within seconds across 200 locations?",
      choices: ["Wait for TTLs", "Push purge messages via a fan-out channel to every edge", "Restart edges", "Email operators"],
      answer: 1,
      why: "A control plane broadcasts invalidations to all edges quickly.",
      tag: "consistency"
    },
    {
      q: "Inside an edge site, spread objects across servers by?",
      choices: ["Consistent hashing on the URL", "Round robin per request", "File size", "Customer name"],
      answer: 0,
      why: "Each object lives on one server per site, avoiding duplicate copies and boosting hit ratio.",
      tag: "sharding"
    },
    {
      q: "Origin is down. Edge should?",
      choices: ["Return errors for everything", "Delete cache", "Serve stale cached content if allowed", "Redirect to origin"],
      answer: 2,
      why: "'Stale-if-error' keeps sites up during origin outages.",
      tag: "reliability"
    },
    {
      q: "Cache key normally includes?",
      choices: ["Client IP", "Host, path and selected query params/headers", "Request time", "Random nonce"],
      answer: 1,
      why: "Including only what changes the response maximizes reuse.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "User", kind: "client", x: 180, y: 50 },
      { id: "dns", label: "Anycast/DNS", kind: "lb", x: 180, y: 145 },
      { id: "edge", label: "Edge PoP", kind: "cdn", x: 180, y: 240 },
      { id: "shield", label: "Shield Cache", kind: "cache", x: 100, y: 335 },
      { id: "ctrl", label: "Control Plane", kind: "service", x: 260, y: 335 },
      { id: "origin", label: "Origin Server", kind: "external", x: 100, y: 430 },
      { id: "q", label: "Purge Bus", kind: "queue", x: 260, y: 430 }
    ],
    edges: [
      { from: "user", to: "dns" },
      { from: "dns", to: "edge" },
      { from: "edge", to: "shield", label: "miss" },
      { from: "shield", to: "origin", label: "miss" },
      { from: "ctrl", to: "q" },
      { from: "q", to: "edge", label: "purge" },
      { from: "ctrl", to: "edge", label: "config" }
    ],
    steps: [
      {
        add: ["user", "dns", "edge"],
        caption: "Anycast or GeoDNS routes each user to a nearby healthy edge location."
      },
      {
        add: ["shield"],
        caption: "Edge misses go to a regional shield cache, coalesced so one request goes upstream."
      },
      { add: ["origin"], caption: "Only the shield fetches from the customer's origin, sharply cutting origin load." },
      {
        add: ["ctrl", "q"],
        caption: "A control plane distributes customer config and certificates, and broadcasts purges to all edges."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Route users to nearby edges, cache and serve content, fetch misses efficiently, purge fast, and handle per-customer config at 100 Tbps."
    },
    {
      heading: "Routing",
      body: "Anycast for fast failover and nearest PoP selection, or GeoDNS with health and load data. Inside a PoP, L4 balancers spread connections to servers."
    },
    {
      heading: "Caching",
      body: "Within a PoP, consistent hashing on the cache key picks one server. Tiered caching (edge → shield → origin) with request coalescing. Memory for hot objects, SSD for the rest, LRU-like eviction."
    },
    {
      heading: "Control plane",
      body: "Customer configs and TLS certificates replicate to all edges. Purges are published through a fan-out bus with acks; tag-based purges invalidate groups of objects."
    },
    {
      heading: "Resilience",
      body: "Serve stale on origin errors, drain failing PoPs from routing, and monitor hit ratio and latency per customer."
    }
  ],
  keyPoints: [
    "Routes with anycast or GeoDNS",
    "Uses tiered caching with a shield",
    "Coalesces concurrent misses",
    "Uses consistent hashing within a PoP",
    "Purges via a broadcast control plane",
    "Serves stale when origin fails",
    "Designs the cache key carefully"
  ],
  cardIds: ["cdn", "geo-dns", "cache-stampede", "consistent-hashing"]
};
