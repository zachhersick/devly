export default [
  {
    id: "consistent-hashing",
    front: "Consistent hashing",
    back: "Keys and servers are both placed on a hash ring; each key belongs to the next server clockwise. Adding or removing a server only moves the keys in its slice (about 1/N of them), and virtual nodes spread the load evenly.",
    tags: ["sharding", "scaling"]
  },
  {
    id: "base62",
    front: "Why encode IDs in base62?",
    back: "Base62 uses 0-9, a-z and A-Z, so it's URL-safe with no escaping. Seven characters give 62^7 ≈ 3.5 trillion values, plenty for short links.",
    tags: ["data-model"]
  },
  {
    id: "token-bucket",
    front: "Token bucket rate limiting",
    back: "A bucket holds up to B tokens and refills at R per second; each request spends one, and an empty bucket means reject. It allows short bursts up to B while capping the long-run rate at R.",
    tags: ["security", "reliability"]
  },
  {
    id: "sliding-window",
    front: "Sliding window counter",
    back: "Estimate the requests in the last window as current-window count + previous-window count × the fraction of the previous window still in range. Nearly as accurate as a full log, with only two counters per key.",
    tags: ["security"]
  },
  {
    id: "cache-aside",
    front: "Cache-aside (lazy loading)",
    back: "The app reads the cache first; on a miss it reads the database and writes the result into the cache with a TTL. On writes it updates the database and deletes the cache entry, so the next read refills it.",
    tags: ["caching"]
  },
  {
    id: "fan-out-on-write",
    front: "Fan-out on write (push)",
    back: "When someone posts, copy the post ID into every follower's precomputed feed. Reads are a single fast lookup, but a celebrity with millions of followers makes each post very expensive.",
    tags: ["scaling", "queues"]
  },
  {
    id: "fan-out-on-read",
    front: "Fan-out on read (pull)",
    back: "Build the feed at read time by merging recent posts from everyone you follow. Writes are cheap but reads are slow; most systems pull only for celebrity accounts and push for everyone else.",
    tags: ["scaling"]
  },
  {
    id: "read-replicas",
    front: "Read replicas",
    back: "Copies of the primary database that serve reads. They scale read-heavy workloads, but replication lag means a replica can return slightly stale data, so read-your-own-writes may need the primary.",
    tags: ["replication", "scaling"]
  },
  {
    id: "cdn",
    front: "What does a CDN do?",
    back: "It caches content on edge servers close to users, cutting latency and taking load off the origin. Best for static or cacheable responses; cache keys and TTLs or purges control freshness.",
    tags: ["caching", "scaling"]
  },
  {
    id: "idempotency-key",
    front: "Idempotency key",
    back: "A unique ID the client sends with a request so retries don't repeat its effect. The server stores the key with the result and returns the saved result if the same key arrives again.",
    tags: ["reliability", "api"]
  }
];
