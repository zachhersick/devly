export default {
  id: "news-feed",
  title: "Design a News Feed",
  difficulty: "medium",
  minutes: 14,
  tags: ["scaling", "caching", "queues"],
  prompt: "Design the home feed for a social app with 300 million daily users. Users follow others and see recent posts from them, newest first. A few accounts have tens of millions of followers.",
  requirements: {
    functional: ["Publish a post", "View a home feed of followed accounts' posts, newest first", "Paginate with infinite scroll"],
    nonFunctional: ["Feed loads in under 200 ms", "A new post shows up in followers' feeds within a few seconds", "Available even if freshness slips slightly"]
  },
  quiz: [
    {
      q: "Which matters more for the feed: perfect freshness or fast, available reads?",
      choices: ["Perfect freshness: every post visible instantly everywhere", "Fast, available reads, with posts appearing within seconds", "Strict global ordering of all posts", "Exactly-once delivery of every post"],
      answer: 1,
      why: "Feeds are read far more than written, and a post showing up a few seconds late is fine. Eventual consistency buys speed and availability.",
      tag: "requirements"
    },
    {
      q: "300M daily users each open the feed ~10 times a day. Roughly what read QPS is that?",
      choices: ["~3,500", "~35,000", "~350,000", "~3.5 million"],
      answer: 1,
      why: "3B feed loads a day ÷ 86,400 seconds ≈ 35,000 per second on average, with peaks at 2–3× that.",
      tag: "estimation"
    },
    {
      q: "With fan-out on write, what happens when a user posts?",
      choices: ["Nothing until a follower opens the app", "The post ID is pushed into each follower's precomputed feed", "The post is emailed to followers", "The database is re-indexed"],
      answer: 1,
      why: "Push fan-out does the work at write time so reading a feed is a single lookup of a precomputed list.",
      tag: "queues"
    },
    {
      q: "A celebrity with 50M followers posts. Why is pure fan-out on write a problem?",
      choices: ["The post is too large to store", "It means 50M feed writes for one post, delaying everyone", "Followers can't see celebrity posts", "It breaks pagination"],
      answer: 1,
      why: "That write storm is slow and costly. The usual fix is a hybrid: push for normal users and pull celebrity posts at read time.",
      tag: "scaling"
    },
    {
      q: "What should each precomputed feed entry store?",
      choices: ["The full post with images", "Just post ID (and author ID/timestamp), hydrated at read time", "A rendered HTML page", "The follower list"],
      answer: 1,
      why: "Small entries keep feed caches compact, and edits or deletes to a post show up everywhere because content is fetched separately.",
      tag: "data-model"
    },
    {
      q: "Which pagination works best for an infinite feed that changes constantly?",
      choices: ["Offset/limit (page=3)", "Cursor based on the last seen post's timestamp or ID", "Load the entire feed at once", "Random sampling"],
      answer: 1,
      why: "With offsets, new posts shift everything and cause duplicates or skips. A cursor says 'posts older than this one', which stays stable.",
      tag: "api"
    },
    {
      q: "Where should precomputed feeds live for fast reads?",
      choices: ["A cold object store", "An in-memory store like Redis, capped at a few hundred entries per user", "A data warehouse", "Each client's local storage only"],
      answer: 1,
      why: "Recent feed entries are read constantly, so keep them in memory. Older pages can be rebuilt from the database on demand.",
      tag: "caching"
    },
    {
      q: "Fan-out workers fall behind during a traffic spike. What keeps the system healthy?",
      choices: ["Make posting block until fan-out finishes", "A queue between posting and fan-out, with workers that scale on queue depth", "Drop all posts during spikes", "Fan out only to the first 100 followers"],
      answer: 1,
      why: "The queue absorbs bursts so posting stays fast; feeds catch up a bit later, which the requirements allow.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "App", kind: "client", x: 180, y: 45 },
      { id: "gw", label: "API gateway", kind: "gateway", x: 180, y: 120 },
      { id: "post", label: "Post service", kind: "service", x: 75, y: 205 },
      { id: "feed", label: "Feed service", kind: "service", x: 285, y: 205 },
      { id: "posts", label: "Posts DB", kind: "db", x: 75, y: 300 },
      { id: "queue", label: "Fan-out queue", kind: "queue", x: 180, y: 300 },
      { id: "cache", label: "Feed cache", kind: "cache", x: 285, y: 300 },
      { id: "workers", label: "Fan-out", kind: "worker", x: 180, y: 400 },
      { id: "graph", label: "Follow graph", kind: "db", x: 300, y: 410 }
    ],
    edges: [
      { from: "client", to: "gw" },
      { from: "gw", to: "post", label: "publish" },
      { from: "gw", to: "feed", label: "read" },
      { from: "post", to: "posts" },
      { from: "post", to: "queue" },
      { from: "queue", to: "workers" },
      { from: "workers", to: "graph", label: "followers" },
      { from: "workers", to: "cache", label: "push" },
      { from: "feed", to: "cache" },
      { from: "feed", to: "posts", label: "hydrate" }
    ],
    steps: [
      { add: ["client", "gw"], caption: "Clients talk to an API gateway that routes posting and feed reads to separate services." },
      { add: ["post", "posts"], caption: "The post service writes the post to a sharded posts database." },
      { add: ["queue", "workers"], caption: "Publishing enqueues a fan-out job, so posting returns immediately." },
      { add: ["graph"], caption: "Workers look up the author's followers in the follow graph." },
      { add: ["cache"], caption: "They push the post ID into each follower's feed list in Redis. Celebrity posts are skipped here and merged in at read time." },
      { add: ["feed"], caption: "The feed service reads the cached IDs, merges celebrity posts, hydrates content from the posts DB and returns a cursor page." }
    ]
  },
  modelAnswer: [
    { heading: "API", body: "POST /posts. GET /feed?cursor=<lastPostId>&limit=20 returns posts plus nextCursor." },
    { heading: "Data", body: "Posts table sharded by post ID (Snowflake-style IDs sort by time). A follow graph stored as follower → followees and followee → followers. Per-user feed lists in Redis holding the latest ~500 post IDs." },
    { heading: "Hybrid fan-out", body: "On publish, enqueue a job; workers push the post ID into every follower's feed list. Accounts above a follower threshold aren't fanned out; their recent posts are pulled and merged when a follower reads." },
    { heading: "Read path", body: "Fetch IDs from the feed cache, merge in celebrity posts, hydrate post bodies from a post cache backed by the DB, filter deleted or blocked content and return a cursor page." },
    { heading: "Scale and freshness", body: "Workers scale on queue depth. Inactive users' feeds aren't kept warm and are rebuilt on their next visit. Freshness is eventual, within seconds." }
  ],
  keyPoints: [
    "Read QPS estimate and read-heavy workload",
    "Fan-out on write explained",
    "Celebrity problem handled with a hybrid push/pull",
    "Feed entries store IDs and are hydrated on read",
    "Feed lists cached in memory with a size cap",
    "Cursor-based pagination",
    "Queue between posting and fan-out",
    "Eventual consistency accepted for freshness",
    "Inactive users' feeds not precomputed"
  ],
  cardIds: ["fan-out-on-write", "fan-out-on-read", "cache-aside", "read-replicas"]
};
