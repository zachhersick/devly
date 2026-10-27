export default {
  id: "product-search",
  title: "Design E-commerce Product Search",
  difficulty: "medium",
  minutes: 13,
  tags: ["search", "caching", "scaling"],
  prompt: "An online store with 50 million products needs a search box with autocomplete, typo tolerance, filters like brand and price, and sorting. It serves 20,000 searches per second at peak. Prices and stock change constantly and should show within a minute.",
  requirements: {
    functional: [
      "Keyword search with relevance ranking",
      "Autocomplete as you type",
      "Filters (facets) and sorting",
      "Results reflect price and stock changes"
    ],
    nonFunctional: ["Search under 200 ms", "Index updates within a minute", "Scale with catalog growth"]
  },
  quiz: [
    {
      q: "Core structure for keyword search?",
      choices: ["B-tree on product id", "Hash map of titles", "Graph", "Inverted index"],
      answer: 3,
      why: "Map each term to the products containing it, then intersect lists.",
      tag: "search"
    },
    {
      q: "User types 'iphnoe'. Handle with?",
      choices: ["Return nothing", "Fuzzy matching by edit distance", "Exact match only", "Ask to retype"],
      answer: 1,
      why: "Edit-distance matching finds terms one or two typos away.",
      tag: "search"
    },
    {
      q: "Facet counts (brand: Apple 120) come from?",
      choices: [
        "Aggregations over the matching document set",
        "A separate SQL count per facet",
        "Hardcoded numbers",
        "The CDN"
      ],
      answer: 0,
      why: "Search engines compute facet counts over hits efficiently.",
      tag: "search"
    },
    {
      q: "How do price changes reach the index?",
      choices: [
        "Rebuild the whole index monthly",
        "Manual edits",
        "CDC events trigger partial document updates",
        "Never update"
      ],
      answer: 2,
      why: "Change events update just the price field within seconds.",
      tag: "consistency"
    },
    {
      q: "50M products too big for one node. Split by?",
      choices: ["Split by user", "Shard documents across nodes; query all shards and merge", "One node only", "Split by query"],
      answer: 1,
      why: "Document sharding spreads the index; a coordinator merges top results.",
      tag: "sharding"
    },
    {
      q: "Ranking beyond text match should include?",
      choices: ["Product id order", "Title length", "Random", "Sales, ratings, stock and personalization signals"],
      answer: 3,
      why: "Business signals push popular, in-stock items above weak text matches.",
      tag: "search"
    },
    {
      q: "Popular queries like 'airpods'?",
      choices: ["Recompute always", "Block them", "Cache result pages briefly", "Store in cookies"],
      answer: 2,
      why: "A short-TTL cache absorbs repeated head queries.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "Shopper", kind: "client", x: 180, y: 50 },
      { id: "api", label: "Search API", kind: "service", x: 180, y: 126 },
      { id: "cache", label: "Query Cache", kind: "cache", x: 100, y: 202 },
      { id: "ac", label: "Autocomplete", kind: "service", x: 260, y: 202 },
      { id: "es", label: "Search Cluster", kind: "search", x: 180, y: 278 },
      { id: "catalog", label: "Catalog DB", kind: "db", x: 100, y: 354 },
      { id: "cdc", label: "Change Stream", kind: "queue", x: 260, y: 354 },
      { id: "indexer", label: "Indexer", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "user", to: "api" },
      { from: "user", to: "ac", label: "prefix" },
      { from: "api", to: "cache" },
      { from: "api", to: "es" },
      { from: "catalog", to: "cdc" },
      { from: "cdc", to: "indexer" },
      { from: "indexer", to: "es" }
    ],
    steps: [
      {
        add: ["user", "api", "es"],
        caption: "The search API sends queries to a sharded search cluster built on inverted indexes."
      },
      { add: ["ac"], caption: "A separate autocomplete service suggests popular queries and products by prefix." },
      {
        add: ["catalog", "cdc", "indexer"],
        caption: "Catalog changes stream into an indexer that updates documents within seconds."
      },
      { add: ["cache"], caption: "Results for popular queries are cached for a short time." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Relevant, typo-tolerant search with facets and autocomplete over 50M products at 20k QPS, fresh within a minute."
    },
    {
      heading: "Index",
      body: "Documents with title, description, brand, category, price, stock, rating. Text fields analyzed (lowercase, stemming, synonyms); filters stored as keyword and numeric fields."
    },
    {
      heading: "Query",
      body: "Parse the query, run fuzzy text match plus filters, compute facets, then rerank top hits using sales, rating, stock and personalization."
    },
    {
      heading: "Freshness",
      body: "The catalog DB emits change events; indexers apply partial updates. Stock is checked again on the product page."
    },
    {
      heading: "Scale",
      body: "Shard by product id, replicate each shard for read load, cache head queries, and serve autocomplete from a prefix structure built from query logs."
    }
  ],
  keyPoints: [
    "Uses an inverted index",
    "Supports fuzzy matching for typos",
    "Computes facets with aggregations",
    "Updates the index from change events",
    "Shards and replicates the index",
    "Ranks with business signals, not just text",
    "Caches popular queries",
    "Handles autocomplete separately"
  ],
  cardIds: ["inverted-index", "trie", "change-data-capture"]
};
