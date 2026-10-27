export default {
  id: "search-engine",
  title: "Design a Web Search Engine",
  difficulty: "hard",
  minutes: 15,
  tags: ["search", "sharding", "caching"],
  prompt: "Build the query side of a web search engine over 10 billion crawled pages. It serves 100,000 queries per second and must return the 10 best results in under 300 ms. The index is rebuilt and updated as the crawler finds new pages.",
  requirements: {
    functional: [
      "Accept a text query and return 10 ranked results with snippets",
      "Spelling correction",
      "Index new and changed pages"
    ],
    nonFunctional: ["Under 300 ms p99", "100k QPS", "Fresh results for news within minutes"]
  },
  quiz: [
    {
      q: "How is a huge inverted index usually split?",
      choices: ["By user", "By query time", "Not split", "By document: each shard indexes a slice of pages"],
      answer: 3,
      why: "Document partitioning keeps shards independent; each query fans out to all and results are merged.",
      tag: "sharding"
    },
    {
      q: "Fan-out to 1,000 shards. Latency risk?",
      choices: [
        "None",
        "The slowest shard sets the response time (tail latency)",
        "Faster with more shards always",
        "Only the first shard matters"
      ],
      answer: 1,
      why: "Hedged requests and replicas help avoid waiting on stragglers.",
      tag: "scaling"
    },
    {
      q: "Ranking is expensive. Typical approach?",
      choices: [
        "Cheap scoring to get top ~1,000, then a costly model on those",
        "Expensive model on all matches",
        "Random order",
        "Alphabetical"
      ],
      answer: 0,
      why: "Multi-stage ranking spends compute only on promising candidates.",
      tag: "search"
    },
    {
      q: "Signals beyond text relevance?",
      choices: ["Page file size only", "Domain length", "Link-based authority, freshness, click feedback", "Server OS"],
      answer: 2,
      why: "Authority and behavior signals separate good pages from keyword-stuffed ones.",
      tag: "search"
    },
    {
      q: "Many users search the same thing. Use?",
      choices: ["No cache", "Result cache keyed by normalized query", "Cache per user only", "CDN for HTML of all pages"],
      answer: 1,
      why: "Head queries repeat constantly, so caching cuts load a lot.",
      tag: "caching"
    },
    {
      q: "Fresh news within minutes but the main index rebuilds daily?",
      choices: [
        "Rebuild all every minute",
        "Ignore news",
        "Ask publishers",
        "A small real-time index merged with the main one at query time"
      ],
      answer: 3,
      why: "A tiered index keeps freshness without rebuilding everything.",
      tag: "storage"
    },
    {
      q: "Index size: 10B pages × ~2 KB of postings each?",
      choices: ["About 2 TB", "About 200 TB", "About 20 TB", "About 2 PB"],
      answer: 2,
      why: "10^10 × 2 KB = 20 TB, spread across many shards and replicas.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "User", kind: "client", x: 180, y: 50 },
      { id: "fe", label: "Query Front", kind: "service", x: 180, y: 126 },
      { id: "cache", label: "Result Cache", kind: "cache", x: 100, y: 202 },
      { id: "spell", label: "Spell / Parse", kind: "service", x: 260, y: 202 },
      { id: "agg", label: "Aggregator", kind: "service", x: 180, y: 278 },
      { id: "s1", label: "Index Shard", kind: "search", x: 60, y: 354 },
      { id: "s2", label: "Index Shard", kind: "search", x: 180, y: 354 },
      { id: "rt", label: "Fresh Index", kind: "search", x: 300, y: 354 },
      { id: "docs", label: "Doc Store", kind: "db", x: 180, y: 430 }
    ],
    edges: [
      { from: "user", to: "fe" },
      { from: "fe", to: "cache" },
      { from: "fe", to: "spell" },
      { from: "fe", to: "agg" },
      { from: "agg", to: "s1" },
      { from: "agg", to: "s2" },
      { from: "agg", to: "rt" },
      { from: "agg", to: "docs", label: "snippets" }
    ],
    steps: [
      { add: ["user", "fe", "cache"], caption: "The front end normalizes the query and checks a result cache." },
      { add: ["spell"], caption: "A query service fixes spelling and expands synonyms." },
      {
        add: ["agg", "s1", "s2"],
        caption: "An aggregator fans the query out to every index shard, each returning its best candidates."
      },
      { add: ["rt"], caption: "A small real-time index of recently crawled pages is queried alongside." },
      { add: ["docs"], caption: "The top results are re-ranked, and snippets are built from the document store." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Top-10 results with snippets over 10B pages, 100k QPS, under 300 ms, with fresh content."
    },
    {
      heading: "Index",
      body: "Inverted index partitioned by document into many shards, each replicated. Posting lists are compressed and sorted by doc id with precomputed static scores."
    },
    {
      heading: "Query flow",
      body: "Normalize and spell-correct, check cache, fan out to all shards, each scores locally (e.g. BM25 plus static rank) and returns top K. The aggregator merges, applies a learned ranking model to the top few hundred, and fetches snippets."
    },
    {
      heading: "Latency",
      body: "Replicas per shard with hedged requests, strict per-shard deadlines (drop stragglers), and result caching for head queries."
    },
    {
      heading: "Freshness",
      body: "A base index rebuilt periodically plus an incremental real-time index for new pages, merged at query time."
    }
  ],
  keyPoints: [
    "Uses a document-partitioned inverted index",
    "Fans out and merges results",
    "Addresses tail latency with replicas and deadlines",
    "Uses multi-stage ranking",
    "Uses link and behavior signals",
    "Caches popular queries",
    "Adds a real-time index for freshness"
  ],
  cardIds: ["inverted-index", "percentile-latency", "min-heap-top-k", "range-vs-hash-partitioning"]
};
