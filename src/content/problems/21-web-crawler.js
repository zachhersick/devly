export default {
  id: "web-crawler",
  title: "Design a Web Crawler",
  difficulty: "medium",
  minutes: 13,
  tags: ["queues", "storage", "scaling"],
  prompt: "Crawl about 1 billion web pages a month to feed a search index. Pages average 100 KB. The crawler must be polite to websites, avoid crawling the same page twice, and recrawl pages that change often.",
  requirements: {
    functional: [
      "Fetch pages starting from seed URLs and follow links",
      "Store page content for indexing",
      "Respect robots.txt and per-site rate limits",
      "Recrawl pages based on how often they change"
    ],
    nonFunctional: [
      "About 400 pages per second sustained",
      "Never hammer a single site",
      "Survive worker crashes without losing progress"
    ]
  },
  quiz: [
    {
      q: "1B pages/month. Pages per second?",
      choices: ["About 40", "About 4,000", "About 40,000", "About 400"],
      answer: 3,
      why: "1 billion ÷ ~2.6M seconds in a month ≈ 385 pages per second.",
      tag: "estimation"
    },
    {
      q: "Raw storage for 1B pages × 100 KB?",
      choices: ["About 100 GB", "About 100 TB", "About 10 PB", "About 1 TB"],
      answer: 1,
      why: "10^9 × 10^5 bytes = 10^14 bytes = 100 TB a month, before compression.",
      tag: "estimation"
    },
    {
      q: "What holds the URLs waiting to be crawled?",
      choices: ["The URL frontier: prioritized queues", "A CDN", "The browser history", "A single SQL row"],
      answer: 0,
      why: "The frontier ranks URLs by priority and groups them so politeness can be enforced.",
      tag: "queues"
    },
    {
      q: "How to be polite to each website?",
      choices: [
        "Crawl as fast as possible",
        "Use many IPs to hide",
        "One queue per host, one worker at a time with delays",
        "Ignore robots.txt"
      ],
      answer: 2,
      why: "Per-host queues let you control the rate for each site and obey robots.txt crawl delays.",
      tag: "reliability"
    },
    {
      q: "Quick check: have we seen this URL before?",
      choices: ["Scan the whole DB", "A bloom filter or a hashed-URL set", "Ask the website", "Regex"],
      answer: 1,
      why: "A bloom filter answers 'definitely new' cheaply; a maybe can be confirmed in a store.",
      tag: "storage"
    },
    {
      q: "Different URLs, same content (mirrors). Detect with?",
      choices: ["URL length", "Response time", "Server IP", "Content fingerprint like a checksum or SimHash"],
      answer: 3,
      why: "Hashing the page body spots exact duplicates; SimHash catches near-duplicates.",
      tag: "storage"
    },
    {
      q: "Avoid crawler traps like infinite calendars?",
      choices: ["Crawl forever", "Block all calendars", "Limit URL depth and pages per host", "Sort URLs"],
      answer: 2,
      why: "Depth and per-host caps stop the crawler from following endless generated links.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "seed", label: "Seed URLs", kind: "client", x: 180, y: 50 },
      { id: "front", label: "URL Frontier", kind: "queue", x: 180, y: 145 },
      { id: "fetch", label: "Fetchers", kind: "worker", x: 100, y: 240 },
      { id: "dns", label: "DNS Cache", kind: "cache", x: 260, y: 240 },
      { id: "parse", label: "Parser", kind: "worker", x: 100, y: 335 },
      { id: "store", label: "Page Store", kind: "storage", x: 260, y: 335 },
      { id: "seen", label: "Seen Filter", kind: "cache", x: 180, y: 430 }
    ],
    edges: [
      { from: "seed", to: "front" },
      { from: "front", to: "fetch" },
      { from: "fetch", to: "dns" },
      { from: "fetch", to: "store", label: "HTML" },
      { from: "fetch", to: "parse" },
      { from: "parse", to: "seen", label: "links" },
      { from: "seen", to: "front", label: "new" }
    ],
    steps: [
      { add: ["seed", "front"], caption: "Seed URLs enter a frontier of prioritized, per-host queues." },
      {
        add: ["fetch", "dns"],
        caption: "Fetcher workers take URLs host by host, honoring robots.txt and delays; DNS lookups are cached."
      },
      { add: ["store"], caption: "Fetched pages go to object storage, compressed, along with a content hash." },
      { add: ["parse"], caption: "Parsers extract links and normalize them." },
      { add: ["seen"], caption: "A seen-URL filter drops duplicates; new URLs flow back into the frontier." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Crawl ~400 pages/s politely, dedupe URLs and content, store pages, recrawl by change rate, survive crashes."
    },
    {
      heading: "Frontier",
      body: "Front queues by priority (page importance, change rate) feed back queues, one per host. A scheduler only releases a host's next URL after its crawl delay."
    },
    {
      heading: "Fetch and parse",
      body: "Workers fetch with timeouts, cache DNS and robots.txt, store compressed HTML in object storage, extract and normalize links."
    },
    {
      heading: "Dedup",
      body: "Bloom filter of URL hashes for seen URLs; content fingerprints to skip duplicate pages. Depth and per-host limits stop traps."
    },
    {
      heading: "Recrawl and recovery",
      body: "Track last-changed time per URL to schedule revisits. Frontier state is persisted so a crash resumes where it left off."
    }
  ],
  keyPoints: [
    "Estimates pages/s and monthly storage",
    "Uses a prioritized URL frontier",
    "Enforces politeness with per-host queues and robots.txt",
    "Dedupes URLs with a bloom filter or hash set",
    "Detects duplicate content with fingerprints",
    "Avoids crawler traps",
    "Caches DNS",
    "Schedules recrawls by change frequency"
  ],
  cardIds: ["bloom-filter", "storage-math", "retry-backoff"]
};
