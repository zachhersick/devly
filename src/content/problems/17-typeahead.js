export default {
  id: "typeahead",
  title: "Design Search Typeahead",
  difficulty: "medium",
  minutes: 12,
  tags: ["search", "caching", "scaling"],
  prompt: "As users type in a search box, show the 10 most popular queries starting with what they've typed. There are 500 million searches a day, and each keystroke can trigger a suggestion request. Popularity should reflect the last week of searches.",
  requirements: {
    functional: ["Return top 10 completions for a prefix", "Rank by recent popularity", "Filter out offensive suggestions"],
    nonFunctional: ["Under 100 ms end to end", "Very high read QPS", "Suggestions can be a few hours stale"]
  },
  quiz: [
    {
      q: "500M searches × ~6 keystrokes. Suggestion requests/s?",
      choices: ["About 3,500", "About 350,000", "About 3.5 million", "About 35,000"],
      answer: 3,
      why: "3 billion requests ÷ 86,400 s ≈ 35k/s average, with peaks a few times higher.",
      tag: "estimation"
    },
    {
      q: "Which structure fits prefix lookups?",
      choices: ["Hash map of full queries", "Trie with top-K stored at each node", "B-tree on query length", "Graph"],
      answer: 1,
      why: "Walk the prefix in the trie and read the precomputed top 10 at that node.",
      tag: "search"
    },
    {
      q: "Why store top-K at every trie node?",
      choices: [
        "So a lookup doesn't need to search the whole subtree",
        "To save memory",
        "For security",
        "To keep it sorted alphabetically"
      ],
      answer: 0,
      why: "Precomputing answers trades memory for constant-time reads at request time.",
      tag: "search"
    },
    {
      q: "How is the trie kept up to date?",
      choices: [
        "Update it on every search live",
        "Never",
        "Rebuild from aggregated logs periodically and swap in",
        "Users edit it"
      ],
      answer: 2,
      why: "Aggregate query counts offline (e.g. hourly) and build a fresh trie, then switch atomically.",
      tag: "data-model"
    },
    {
      q: "Cut requests from fast typists?",
      choices: ["Bigger servers only", "Debounce in the client and cache recent prefixes", "Disable typeahead", "Use UDP"],
      answer: 1,
      why: "Waiting ~100 ms between keystrokes and caching results in the browser removes many calls.",
      tag: "caching"
    },
    {
      q: "Trie too big for one server. Split by?",
      choices: ["Random", "User id", "Time of day", "Prefix ranges (a–f, g–m, ...) balanced by traffic"],
      answer: 3,
      why: "Partition by prefix so each request goes to one shard; split hot ranges further.",
      tag: "sharding"
    },
    {
      q: "Short prefixes like 'a' are hammered. Help with?",
      choices: ["Blocking them", "Rebuilding the trie", "Caching their results at the edge", "Rate limiting users"],
      answer: 2,
      why: "One- and two-letter prefixes have few distinct results and cache extremely well.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Search Box", kind: "client", x: 180, y: 50 },
      { id: "cdn", label: "Edge Cache", kind: "cdn", x: 180, y: 145 },
      { id: "sugg", label: "Suggest Svc", kind: "service", x: 180, y: 240 },
      { id: "trie", label: "Trie Shards", kind: "cache", x: 100, y: 335 },
      { id: "logs", label: "Query Logs", kind: "storage", x: 260, y: 335 },
      { id: "build", label: "Trie Builder", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "cdn", label: "prefix" },
      { from: "cdn", to: "sugg" },
      { from: "sugg", to: "trie" },
      { from: "sugg", to: "logs", label: "searches" },
      { from: "logs", to: "build" },
      { from: "build", to: "trie", label: "swap" }
    ],
    steps: [
      {
        add: ["client", "sugg"],
        caption: "The search box debounces keystrokes and asks a suggestion service for each prefix."
      },
      {
        add: ["trie"],
        caption: "Suggestion servers hold an in-memory trie, partitioned by prefix, with top 10 cached at each node."
      },
      {
        add: ["logs", "build"],
        caption: "Completed searches are logged; a batch job counts the past week and builds a new trie."
      },
      { add: ["cdn"], caption: "Popular short prefixes are cached at the edge, absorbing most of the traffic." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Top 10 completions per prefix in under 100 ms, ranked by last week's popularity, at tens of thousands of requests per second."
    },
    {
      heading: "Data structure",
      body: "A trie of queries where each node stores its top 10 completions with scores. Lookup walks the prefix and returns the list."
    },
    {
      heading: "Building",
      body: "Searches are logged; a job aggregates weekly counts (with decay for recency), filters blocked terms, builds tries per shard, and servers swap to the new version."
    },
    {
      heading: "Serving",
      body: "Trie shards split by prefix range and replicated for load. A cache layer and CDN serve hot prefixes."
    },
    {
      heading: "Client",
      body: "Debounce input, cancel stale requests, and cache prefixes in the browser so backspacing is free."
    }
  ],
  keyPoints: [
    "Estimates request rate from keystrokes",
    "Uses a trie with precomputed top-K per node",
    "Builds the trie offline from aggregated logs",
    "Swaps in new versions atomically",
    "Shards by prefix range",
    "Caches hot prefixes at edge and client",
    "Debounces in the client",
    "Filters offensive suggestions"
  ],
  cardIds: ["trie", "qps-math", "min-heap-top-k"]
};
