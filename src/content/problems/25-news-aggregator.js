export default {
  id: "news-aggregator",
  title: "Design a News Aggregator",
  difficulty: "medium",
  minutes: 12,
  tags: ["queues", "search", "caching"],
  prompt: "An app pulls articles from 50,000 news sites and blogs, groups stories about the same event, and shows each user a personalized front page. About 2 million new articles arrive a day and 20 million users open the app daily.",
  requirements: {
    functional: [
      "Ingest articles from RSS feeds and sites",
      "Group articles about the same story",
      "Personalized front page by topics followed",
      "Search articles"
    ],
    nonFunctional: ["Breaking news shows within minutes", "Front page loads in under 300 ms", "Handle sources that go offline"]
  },
  quiz: [
    {
      q: "How do we discover new articles from 50k sources?",
      choices: [
        "Users upload them",
        "Crawl the whole web hourly",
        "Wait for email",
        "Poll RSS feeds on a schedule, more often for busy sources"
      ],
      answer: 3,
      why: "Feeds are cheap to poll; adaptive intervals spend effort where new content appears.",
      tag: "queues"
    },
    {
      q: "Same story from 300 outlets. Group them by?",
      choices: [
        "Exact title match",
        "Text similarity clustering (e.g. shingles or embeddings)",
        "Publish time only",
        "Source country"
      ],
      answer: 1,
      why: "Similarity on article text or vectors groups different headlines about one event.",
      tag: "search"
    },
    {
      q: "Front page for 20M users. Compute when?",
      choices: [
        "Precompute top stories per topic; merge per user at read time",
        "Per request from scratch",
        "Once a week",
        "Randomly"
      ],
      answer: 0,
      why: "Ranking per topic is shared work; personalization becomes a cheap merge of followed topics.",
      tag: "caching"
    },
    {
      q: "2M articles/day. Ingest rate?",
      choices: ["About 2 per second", "About 230 per second", "About 23 per second", "About 2,300 per second"],
      answer: 2,
      why: "2M ÷ 86,400 ≈ 23 articles per second, comfortably handled by a small worker pool.",
      tag: "estimation"
    },
    {
      q: "Ranking within a cluster should favor?",
      choices: [
        "The longest article",
        "Original reporting and reputable, recent sources",
        "Alphabetical order",
        "The slowest site"
      ],
      answer: 1,
      why: "Quality and freshness signals pick which outlet represents the story.",
      tag: "search"
    },
    {
      q: "A source is down for a day. Effect on others?",
      choices: [
        "Everything stops",
        "All feeds reset",
        "We delete the source",
        "Its fetch jobs fail and back off; other sources unaffected"
      ],
      answer: 3,
      why: "Independent fetch jobs with backoff isolate failures per source.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "src", label: "News Sites", kind: "external", x: 180, y: 50 },
      { id: "fetch", label: "Feed Fetchers", kind: "worker", x: 180, y: 126 },
      { id: "q", label: "Article Queue", kind: "queue", x: 180, y: 202 },
      { id: "nlp", label: "Cluster/Tag", kind: "worker", x: 100, y: 278 },
      { id: "idx", label: "Search Index", kind: "search", x: 260, y: 278 },
      { id: "rank", label: "Topic Ranker", kind: "worker", x: 100, y: 354 },
      { id: "db", label: "Articles DB", kind: "db", x: 260, y: 354 },
      { id: "api", label: "Front Page API", kind: "service", x: 100, y: 430 },
      { id: "cache", label: "Topic Cache", kind: "cache", x: 260, y: 430 }
    ],
    edges: [
      { from: "fetch", to: "src", label: "RSS" },
      { from: "fetch", to: "q" },
      { from: "q", to: "nlp" },
      { from: "nlp", to: "idx" },
      { from: "nlp", to: "db" },
      { from: "rank", to: "db" },
      { from: "rank", to: "cache" },
      { from: "api", to: "cache" }
    ],
    steps: [
      {
        add: ["src", "fetch"],
        caption: "Fetchers poll each source's feed on an adaptive schedule and back off on failures."
      },
      {
        add: ["q", "nlp"],
        caption: "New articles go through a queue to workers that extract text, tag topics and assign them to story clusters."
      },
      { add: ["db", "idx"], caption: "Articles and clusters are stored and indexed for search." },
      { add: ["rank", "cache"], caption: "A ranker refreshes the top stories per topic every minute into a cache." },
      {
        add: ["api"],
        caption: "The front page merges a user's followed topics from the cache and removes stories they've read."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Ingest ~23 articles/s from 50k sources, cluster stories, personalize front pages for 20M daily users, and search."
    },
    {
      heading: "Ingestion",
      body: "A scheduler polls feeds at intervals based on each source's posting rate. Fetchers extract text, normalize, and dedupe by URL and content hash."
    },
    {
      heading: "Clustering",
      body: "Compute text fingerprints or embeddings and attach each article to the nearest recent cluster above a similarity threshold, or start a new one."
    },
    {
      heading: "Ranking and serving",
      body: "Score clusters by freshness, number of sources and source quality per topic. Cache top lists per topic; a user's page merges their topics and filters seen stories."
    },
    { heading: "Search", body: "Index articles in a search engine with recency boosting." }
  ],
  keyPoints: [
    "Polls feeds with adaptive intervals",
    "Deduplicates articles",
    "Clusters articles about the same story by similarity",
    "Precomputes rankings per topic",
    "Personalizes by merging topic lists at read time",
    "Isolates failing sources with backoff",
    "Indexes articles for search"
  ],
  cardIds: ["inverted-index", "materialized-view", "retry-backoff"]
};
