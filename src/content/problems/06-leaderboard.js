export default {
  id: "leaderboard",
  title: "Design a Game Leaderboard",
  difficulty: "easy",
  minutes: 8,
  tags: ["caching", "data-model", "scaling"],
  prompt: "A mobile game with 20 million daily players needs a global leaderboard. Players see the top 100 and their own rank after each match. About 5,000 score updates arrive per second at peak, and seasons reset monthly.",
  requirements: {
    functional: [
      "Submit a score after each match",
      "Show the global top 100",
      "Show a player's own rank and nearby players",
      "Reset at the start of each season"
    ],
    nonFunctional: ["Rank lookup under 50 ms", "Scores must not be lost", "Handle 5k updates per second"]
  },
  quiz: [
    {
      q: "Why is SQL ORDER BY a poor fit for 'my rank'?",
      choices: [
        "Counting everyone above you scans millions of rows",
        "SQL can't sort numbers",
        "SQL loses data",
        "It returns wrong scores"
      ],
      answer: 0,
      why: "Finding a rank means counting rows with a higher score, which is a big scan at 20M players on every request.",
      tag: "data-model"
    },
    {
      q: "Which structure gives rank in O(log n)?",
      choices: ["Hash map", "Plain list", "Sorted set (skip list)", "Bloom filter"],
      answer: 2,
      why: "A sorted set keeps members ordered by score and can report a member's rank in logarithmic time.",
      tag: "data-model"
    },
    {
      q: "20M players × ~50 bytes in a sorted set. Memory?",
      choices: ["About 100 GB", "About 1 GB", "About 10 MB", "About 1 TB"],
      answer: 1,
      why: "20M × 50 B = 1 GB, which fits easily in one Redis instance, with replicas for safety.",
      tag: "estimation"
    },
    {
      q: "Redis is in memory. How do we avoid losing scores?",
      choices: [
        "We can't",
        "Take a screenshot nightly",
        "Only keep the top 100",
        "Also write each score to a durable DB and rebuild from it"
      ],
      answer: 3,
      why: "The database is the source of truth; the sorted set is a fast view that can be rebuilt if Redis dies.",
      tag: "reliability"
    },
    {
      q: "Season reset at midnight. Cleanest approach?",
      choices: [
        "Delete every member one by one",
        "Set every score to zero",
        "Start a new key per season, e.g. lb:2026-11",
        "Restart Redis"
      ],
      answer: 2,
      why: "A new key per season makes reset instant and keeps the old season readable for history.",
      tag: "data-model"
    },
    {
      q: "Players cheat by posting huge scores. Best defense?",
      choices: [
        "Server validates scores from match results",
        "Trust the client",
        "Hide the leaderboard",
        "Limit names to 10 chars"
      ],
      answer: 0,
      why: "The game server, not the phone, should compute or verify the score before it's accepted.",
      tag: "security"
    },
    {
      q: "Friends leaderboard for one player?",
      choices: [
        "Scan the global set",
        "One sorted set per pair of friends",
        "Ask each friend's phone",
        "Fetch friends' scores and sort the small list"
      ],
      answer: 3,
      why: "Most players have under a few hundred friends, so looking up their scores and sorting is cheap.",
      tag: "scaling"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Game Client", kind: "client", x: 180, y: 50 },
      { id: "gs", label: "Game Server", kind: "service", x: 180, y: 145 },
      { id: "api", label: "Score API", kind: "service", x: 180, y: 240 },
      { id: "redis", label: "Sorted Set", kind: "cache", x: 100, y: 335 },
      { id: "db", label: "Scores DB", kind: "db", x: 260, y: 335 },
      { id: "job", label: "Season Job", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "gs", label: "match" },
      { from: "gs", to: "api", label: "score" },
      { from: "client", to: "api", label: "rank" },
      { from: "api", to: "redis" },
      { from: "api", to: "db" },
      { from: "job", to: "redis" },
      { from: "job", to: "db" }
    ],
    steps: [
      {
        add: ["client", "gs"],
        caption: "The game server referees matches, so scores come from a trusted source, not the phone."
      },
      { add: ["api", "db"], caption: "The score API records every result in a durable database first." },
      {
        add: ["redis"],
        caption: "It then updates a Redis sorted set, which answers top-100 and rank queries in milliseconds."
      },
      { add: ["job"], caption: "A season job starts a fresh sorted-set key each month and archives the old one." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Submit scores, read top 100, read your rank and neighbors, monthly reset. Fast reads, durable scores, 5k writes/s."
    },
    {
      heading: "Core structure",
      body: "A Redis sorted set keyed by season: ZADD to update, ZREVRANGE 0 99 for the top, ZREVRANK for a player's rank, and a range around that rank for neighbors."
    },
    {
      heading: "Durability",
      body: "Write each match result to a database first, then update Redis. If Redis is lost, rebuild the set from the database."
    },
    {
      heading: "Scale",
      body: "20M members fits in one node (about 1 GB). If it didn't, shard by score range or keep exact ranks only for the top and estimate the rest with buckets."
    },
    {
      heading: "Trust",
      body: "Scores come from the game server, which validates match results and rejects impossible values."
    }
  ],
  keyPoints: [
    "Uses a sorted set for O(log n) rank lookups",
    "Estimates memory and shows it fits in one node",
    "Keeps a durable DB as source of truth",
    "Uses a per-season key for instant resets",
    "Validates scores server-side to stop cheating",
    "Explains how to get neighbors around a rank",
    "Mentions a fallback for much larger player counts"
  ],
  cardIds: ["sorted-set", "storage-math", "hot-key"]
};
