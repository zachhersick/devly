export default {
  id: "social-graph",
  title: "Design a Social Graph",
  difficulty: "medium",
  minutes: 13,
  tags: ["data-model", "sharding", "caching"],
  prompt: "A social network stores who follows whom for 1 billion users, with an average of 200 follows each and some celebrities with 100 million followers. The app needs fast 'who do I follow', 'who follows me', follower counts and 'friends of friends' suggestions.",
  requirements: {
    functional: [
      "Follow and unfollow",
      "List followers and followings with pagination",
      "Show follower counts",
      "Suggest people you may know"
    ],
    nonFunctional: ["List reads under 50 ms", "Counts can be slightly delayed", "Handle celebrity accounts"]
  },
  quiz: [
    {
      q: "1B users × 200 edges × 2 directions × 20 bytes?",
      choices: ["About 800 GB", "About 8 TB", "About 80 TB", "About 80 GB"],
      answer: 1,
      why: "1B × 200 = 200B edges; × 2 for both directions × 20 B ≈ 8 TB.",
      tag: "estimation"
    },
    {
      q: "Why store each follow in two tables?",
      choices: [
        "For backups",
        "To double the count",
        "It's a mistake",
        "So both 'following' and 'followers' are single-shard reads"
      ],
      answer: 3,
      why: "Storing forward and reverse edges, each sharded by its owner, makes both lists cheap.",
      tag: "data-model"
    },
    {
      q: "Shard the follow tables by?",
      choices: ["The follow timestamp", "Celebrity status", "The owning user id of each list", "Alphabet"],
      answer: 2,
      why: "Each user's list sits on one shard, so listing is a single range read.",
      tag: "sharding"
    },
    {
      q: "Counting 100M followers on each profile view?",
      choices: ["Keep a counter updated asynchronously", "COUNT(*) every time", "Estimate from likes", "Don't show counts"],
      answer: 0,
      why: "Precomputed counters avoid scanning huge lists.",
      tag: "caching"
    },
    {
      q: "Listing followers page by page should use?",
      choices: ["OFFSET 1,000,000", "Random sampling", "Fetch all then slice", "Cursor pagination on (created_at, user_id)"],
      answer: 3,
      why: "Cursors stay fast deep into a list and don't skip rows as it changes.",
      tag: "api"
    },
    {
      q: "Friends-of-friends suggestions computed?",
      choices: [
        "Live graph walk on every request",
        "Offline batch job, results cached per user",
        "Random users",
        "Ask the user"
      ],
      answer: 1,
      why: "Two-hop expansion is expensive; precompute and cache suggestions daily.",
      tag: "data-model"
    },
    {
      q: "Follow then unfollow quickly on two devices. Keep edges consistent?",
      choices: [
        "Write both directions in a transaction or via a reliable event with retries",
        "Write one and hope",
        "Delete user",
        "Cache only"
      ],
      answer: 0,
      why: "Either atomically or with an idempotent async repair so the reverse edge can't drift.",
      tag: "consistency"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "App", kind: "client", x: 180, y: 50 },
      { id: "api", label: "Graph API", kind: "service", x: 180, y: 126 },
      { id: "fwd", label: "Following DB", kind: "db", x: 100, y: 202 },
      { id: "rev", label: "Followers DB", kind: "db", x: 260, y: 202 },
      { id: "cache", label: "Lists Cache", kind: "cache", x: 100, y: 278 },
      { id: "cnt", label: "Counters", kind: "cache", x: 260, y: 278 },
      { id: "q", label: "Follow Events", kind: "queue", x: 180, y: 354 },
      { id: "batch", label: "Suggest Job", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "fwd" },
      { from: "api", to: "q" },
      { from: "q", to: "rev" },
      { from: "q", to: "cnt" },
      { from: "api", to: "cache" },
      { from: "api", to: "cnt" },
      { from: "batch", to: "fwd" },
      { from: "batch", to: "cache" }
    ],
    steps: [
      {
        add: ["client", "api", "fwd"],
        caption: "A follow writes the edge to the follower's 'following' list, sharded by follower id."
      },
      {
        add: ["q", "rev"],
        caption: "An event writes the reverse edge to the followee's 'followers' list, sharded by followee id."
      },
      { add: ["cnt"], caption: "The same events update follower and following counters." },
      { add: ["cache"], caption: "Hot lists, like the first page of a celebrity's followers, are cached." },
      { add: ["batch"], caption: "A nightly job walks two hops to build 'people you may know' per user." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Follow/unfollow, paginated lists in both directions, counts and suggestions for 1B users including celebrity accounts."
    },
    {
      heading: "Data model",
      body: "following(user_id, followee_id, created_at) and followers(user_id, follower_id, created_at), each with primary key on (user_id, created_at, other_id)."
    },
    {
      heading: "Sharding",
      body: "Each table sharded by user_id so a list is one shard. Celebrities' follower lists are large but sequentially readable with cursors."
    },
    {
      heading: "Writes",
      body: "Write the forward edge synchronously, then the reverse edge and counters via an idempotent event; a repair job reconciles drift."
    },
    {
      heading: "Suggestions",
      body: "Batch compute friends-of-friends with ranking by mutual count, store top 50 per user, refresh daily."
    }
  ],
  keyPoints: [
    "Estimates edge storage",
    "Stores forward and reverse edges separately",
    "Shards each list by its owner",
    "Keeps denormalized counters",
    "Uses cursor pagination",
    "Precomputes suggestions offline",
    "Keeps both directions consistent with events or transactions"
  ],
  cardIds: ["denormalization", "shard-key", "pagination-cursor", "secondary-index"]
};
