export default {
  id: "recommendation-feed",
  title: "Design a Recommendation Feed",
  difficulty: "hard",
  minutes: 15,
  tags: ["search", "caching", "scaling"],
  prompt: "A shopping app shows each of its 80 million daily users a 'Recommended for you' feed of products from a catalog of 20 million items. The feed should reflect what the user browsed minutes ago and load in under 200 ms. 30,000 feed requests arrive per second at peak.",
  requirements: {
    functional: [
      "Personalized ranked list of products per user",
      "React to recent views, carts and purchases",
      "Exclude out-of-stock and already-bought items",
      "Fallback for brand-new users"
    ],
    nonFunctional: ["Under 200 ms per request", "Fresh signals within minutes", "Fail soft if the model service is slow"]
  },
  quiz: [
    {
      q: "Scoring all 20M items per request is impossible. Instead?",
      choices: [
        "Score all items with a smaller CPU",
        "Random sample of 10",
        "Retrieve ~1,000 candidates, then rank them",
        "Show bestsellers only"
      ],
      answer: 2,
      why: "Two stages, cheap retrieval then precise ranking, fit the latency budget.",
      tag: "search"
    },
    {
      q: "Candidate retrieval commonly uses?",
      choices: ["Nearest neighbors over user and item embeddings", "Full table scan", "SQL LIKE", "Alphabetical slices"],
      answer: 0,
      why: "Approximate nearest-neighbor indexes find similar items in milliseconds.",
      tag: "search"
    },
    {
      q: "Brand-new user with no history (cold start)?",
      choices: [
        "Empty feed",
        "Random catalog dump",
        "Ask for a survey first only",
        "Popular and trending items, then adapt quickly"
      ],
      answer: 3,
      why: "Popularity by region or category is a sensible start until signals arrive.",
      tag: "requirements"
    },
    {
      q: "User viewed hiking boots 2 minutes ago. How is that used?",
      choices: [
        "Retrain the model monthly",
        "Stream events into a real-time feature store read at ranking time",
        "Ignore recent events",
        "Email the user"
      ],
      answer: 1,
      why: "Fresh features let the next request reflect recent intent.",
      tag: "realtime"
    },
    {
      q: "Ranking model times out. Do what?",
      choices: ["Serve a cached or precomputed feed for that user", "Return an error page", "Show nothing", "Retry forever"],
      answer: 0,
      why: "Graceful degradation keeps the page useful even without fresh ranking.",
      tag: "reliability"
    },
    {
      q: "Filtering bought or out-of-stock items happens?",
      choices: ["Never", "In the browser only", "After ranking, using fast lookups", "During monthly training"],
      answer: 2,
      why: "Business filters at the end keep the list valid without retraining.",
      tag: "data-model"
    },
    {
      q: "Reduce per-request cost for inactive users?",
      choices: ["Rank live for everyone always", "Precompute their feeds offline and cache", "Skip them", "Use bigger servers"],
      answer: 1,
      why: "Batch precomputation is cheaper where freshness matters less.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "Shopper App", kind: "client", x: 180, y: 50 },
      { id: "feed", label: "Feed Service", kind: "service", x: 180, y: 145 },
      { id: "ann", label: "Candidate ANN", kind: "search", x: 60, y: 240 },
      { id: "rank", label: "Ranking Model", kind: "service", x: 180, y: 240 },
      { id: "pre", label: "Precomputed", kind: "cache", x: 300, y: 240 },
      { id: "fs", label: "Feature Store", kind: "cache", x: 100, y: 335 },
      { id: "events", label: "Event Stream", kind: "queue", x: 260, y: 335 },
      { id: "train", label: "Training Jobs", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "user", to: "feed" },
      { from: "feed", to: "ann" },
      { from: "feed", to: "rank" },
      { from: "feed", to: "pre", label: "fallback" },
      { from: "rank", to: "fs" },
      { from: "user", to: "events", label: "views" },
      { from: "events", to: "fs" },
      { from: "train", to: "ann", label: "embeddings" },
      { from: "train", to: "rank", label: "model" }
    ],
    steps: [
      { add: ["user", "feed"], caption: "The app asks the feed service for the next page of recommendations." },
      {
        add: ["ann"],
        caption: "Candidate generators pull ~1,000 items via embedding similarity, co-purchases and trending lists."
      },
      { add: ["rank", "fs"], caption: "A ranking model scores candidates using user, item and real-time features." },
      { add: ["events"], caption: "Views, carts and purchases stream into the feature store within seconds." },
      {
        add: ["train", "pre"],
        caption: "Offline jobs retrain models, refresh embeddings and precompute fallback feeds."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Personalized, fresh, valid product lists in under 200 ms at 30k QPS, with sensible cold-start and fallback behavior."
    },
    {
      heading: "Retrieval",
      body: "Several candidate sources: ANN over learned embeddings, 'bought together' graphs, recent-category items, trending. Merge and dedupe to ~1,000."
    },
    {
      heading: "Ranking",
      body: "A model predicts click or purchase probability using user features, item features and recent session features from a real-time store. Then apply diversity rules and filters (stock, already bought)."
    },
    {
      heading: "Freshness",
      body: "Clickstream events update session features in seconds. Models and embeddings retrain daily from logged impressions and outcomes."
    },
    {
      heading: "Resilience and cost",
      body: "Strict timeouts per stage; fall back to precomputed feeds or popular items. Precompute feeds for less active users."
    }
  ],
  keyPoints: [
    "Uses retrieve-then-rank",
    "Uses embeddings and nearest-neighbor search",
    "Handles cold start",
    "Feeds recent events into real-time features",
    "Filters invalid items after ranking",
    "Falls back gracefully on timeouts",
    "Retrains offline from logged outcomes"
  ],
  cardIds: ["graceful-degradation", "stream-windows", "materialized-view"]
};
