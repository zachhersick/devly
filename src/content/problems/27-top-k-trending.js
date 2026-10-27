export default {
  id: "top-k-trending",
  title: "Design Trending Topics",
  difficulty: "medium",
  minutes: 13,
  tags: ["realtime", "estimation", "queues"],
  prompt: "A social network wants to show the top 10 trending hashtags globally and per country, updated every minute. Posts arrive at 300,000 per second, each with a few hashtags. 'Trending' means most used in the last hour.",
  requirements: {
    functional: [
      "Count hashtag usage over a rolling hour",
      "Return top 10 overall and per country",
      "Update roughly every minute"
    ],
    nonFunctional: ["Handle 1M hashtag events per second", "Results can be slightly approximate", "Read requests under 50 ms"]
  },
  quiz: [
    {
      q: "Exact count of every hashtag in memory. Concern?",
      choices: [
        "Too slow to hash",
        "Millions of distinct tags blow up memory per window",
        "Hashtags are encrypted",
        "No concern"
      ],
      answer: 1,
      why: "The long tail of rare tags is huge; approximate structures keep memory fixed.",
      tag: "estimation"
    },
    {
      q: "Which structure estimates frequencies in fixed memory?",
      choices: ["Bloom filter", "B-tree", "Trie", "Count-min sketch"],
      answer: 3,
      why: "Count-min sketch gives approximate counts that never undercount, in a few MB.",
      tag: "estimation"
    },
    {
      q: "How to keep the top 10 while counting?",
      choices: [
        "Sort all tags each minute",
        "Ask users",
        "A min-heap of size K updated as counts grow",
        "Random sampling of 10"
      ],
      answer: 2,
      why: "A small heap tracks the current leaders in O(log K) per update.",
      tag: "search"
    },
    {
      q: "'Last hour' rolling window. Practical approach?",
      choices: [
        "Keep 60 one-minute buckets and sum them",
        "Recount from scratch every second",
        "Only count today",
        "Use a single counter forever"
      ],
      answer: 0,
      why: "Minute buckets let you add the new minute and drop the oldest.",
      tag: "realtime"
    },
    {
      q: "1M events/s is too much for one counter node. Then?",
      choices: [
        "Drop most events",
        "One giant server",
        "Write each event to SQL",
        "Partition by hashtag across workers, then merge each worker's top-K"
      ],
      answer: 3,
      why: "Each worker counts its share of tags; a final step merges partial top lists.",
      tag: "sharding"
    },
    {
      q: "Why might 'most used' not be the best trend signal?",
      choices: ["It's too accurate", "Always-popular tags like #love would always win", "It's too slow", "It ignores spelling"],
      answer: 1,
      why: "Trending means unusual growth, so compare to a baseline rather than raw counts.",
      tag: "requirements"
    },
    {
      q: "Serving reads of the top 10?",
      choices: [
        "Write each minute's result to a cache keyed by region",
        "Recompute per request",
        "Query the stream",
        "Scan raw posts"
      ],
      answer: 0,
      why: "Results change once a minute, so serve them from a small cache.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "posts", label: "Post Service", kind: "service", x: 180, y: 50 },
      { id: "q", label: "Hashtag Stream", kind: "queue", x: 180, y: 126 },
      { id: "c1", label: "Counter 1", kind: "worker", x: 60, y: 202 },
      { id: "c2", label: "Counter 2", kind: "worker", x: 180, y: 202 },
      { id: "c3", label: "Counter 3", kind: "worker", x: 300, y: 202 },
      { id: "merge", label: "Top-K Merger", kind: "worker", x: 180, y: 278 },
      { id: "cache", label: "Trends Cache", kind: "cache", x: 180, y: 354 },
      { id: "api", label: "Trends API", kind: "service", x: 180, y: 430 }
    ],
    edges: [
      { from: "posts", to: "q", label: "tags" },
      { from: "q", to: "c1" },
      { from: "q", to: "c2" },
      { from: "q", to: "c3" },
      { from: "c1", to: "merge", label: "top-k" },
      { from: "c2", to: "merge" },
      { from: "c3", to: "merge" },
      { from: "merge", to: "cache" },
      { from: "api", to: "cache" }
    ],
    steps: [
      {
        add: ["posts", "q"],
        caption: "Each post emits hashtag events (tag, country, time) into a stream partitioned by tag."
      },
      {
        add: ["c1", "c2", "c3"],
        caption: "Counter workers keep per-minute sketches and a local top-K for their share of tags."
      },
      {
        add: ["merge"],
        caption: "Every minute a merger combines partial top lists and scores growth over a baseline."
      },
      { add: ["cache", "api"], caption: "Final trends per country go to a cache that the trends API reads." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Top 10 hashtags per region over a rolling hour, refreshed every minute, at ~1M events/s, approximate is fine."
    },
    {
      heading: "Ingestion",
      body: "Posts emit hashtag events into a stream partitioned by hashtag, so each tag is counted by one worker."
    },
    {
      heading: "Counting",
      body: "Workers keep one-minute buckets with exact counts for heavy hitters and a count-min sketch for the long tail. A size-K heap per region tracks leaders."
    },
    {
      heading: "Merging",
      body: "Every minute, workers send their partial top 100s per region to a merger, which sums 60 buckets and ranks by growth versus the same tag's usual rate."
    },
    {
      heading: "Serving",
      body: "Results are written to a cache and served directly. Spam and banned tags are filtered before publishing."
    }
  ],
  keyPoints: [
    "Notes exact counting of the long tail is too costly",
    "Uses count-min sketch or similar",
    "Tracks top-K with a heap",
    "Uses time buckets for the rolling window",
    "Partitions counting and merges partial results",
    "Defines trending as growth over baseline",
    "Caches results per region"
  ],
  cardIds: ["count-min-sketch", "min-heap-top-k", "stream-windows"]
};
