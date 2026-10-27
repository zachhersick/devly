export default {
  id: "photo-sharing",
  title: "Design a Photo Sharing App",
  difficulty: "easy",
  minutes: 10,
  tags: ["storage", "caching", "scaling"],
  prompt: "Users upload photos and see a feed of photos from accounts they follow. There are 50 million daily users uploading 10 million photos a day, averaging 2 MB each. Viewing is about 50 times more common than uploading.",
  requirements: {
    functional: [
      "Upload a photo with a caption",
      "Follow other users",
      "View a feed of followed users' photos",
      "View a single photo in several sizes"
    ],
    nonFunctional: ["Photos are never lost", "Feed loads in under 500 ms", "Images load fast worldwide"]
  },
  quiz: [
    {
      q: "10M photos/day × 2 MB. New storage per day?",
      choices: ["About 20 TB", "About 20 GB", "About 2 PB", "About 200 TB"],
      answer: 0,
      why: "10M × 2 MB = 20 TB a day of originals, before thumbnails and replication.",
      tag: "estimation"
    },
    {
      q: "How should the phone upload a 2 MB image?",
      choices: [
        "Through the API server as one request",
        "Base64 in JSON",
        "Directly to object storage via a presigned URL",
        "Email it"
      ],
      answer: 2,
      why: "A presigned URL lets the phone upload straight to storage, keeping big bytes off the app servers.",
      tag: "api"
    },
    {
      q: "Who creates thumbnails and other sizes?",
      choices: ["The phone, always", "Async workers after upload", "The CDN on every view", "Nobody"],
      answer: 1,
      why: "An upload event triggers workers to resize, so the upload request finishes fast.",
      tag: "queues"
    },
    {
      q: "How do images load fast worldwide?",
      choices: ["Bigger app servers", "Store them in Redis", "Compress text", "Serve them through a CDN"],
      answer: 3,
      why: "A CDN caches images near users, cutting latency and origin load.",
      tag: "caching"
    },
    {
      q: "Feed for a user following 300 accounts?",
      choices: [
        "Scan all photos ever posted",
        "Ask each followee",
        "Precompute feeds on upload, merge celebrity posts at read time",
        "Random photos"
      ],
      answer: 2,
      why: "Fan-out on write for normal accounts plus read-time merging for huge accounts keeps feeds fast.",
      tag: "scaling"
    },
    {
      q: "What goes in the photo metadata table?",
      choices: [
        "Photo id, owner, caption, storage key, created_at",
        "The image bytes",
        "Every viewer's id",
        "The thumbnail pixels"
      ],
      answer: 0,
      why: "Metadata is small and queryable; bytes live in object storage.",
      tag: "data-model"
    },
    {
      q: "How to shard the photo metadata?",
      choices: ["By caption length", "By upload hour only", "Don't shard ever", "By photo id or owner id"],
      answer: 3,
      why: "Owner or photo id spreads load evenly; owner keeps a profile's photos together.",
      tag: "sharding"
    }
  ],
  diagram: {
    nodes: [
      { id: "app", label: "Mobile App", kind: "client", x: 180, y: 50 },
      { id: "cdn", label: "CDN", kind: "cdn", x: 100, y: 145 },
      { id: "api", label: "App API", kind: "service", x: 260, y: 145 },
      { id: "blob", label: "Photo Store", kind: "storage", x: 100, y: 240 },
      { id: "meta", label: "Photo Meta DB", kind: "db", x: 260, y: 240 },
      { id: "q", label: "Upload Events", kind: "queue", x: 180, y: 335 },
      { id: "resize", label: "Resizer", kind: "worker", x: 100, y: 430 },
      { id: "feed", label: "Feed Cache", kind: "cache", x: 260, y: 430 }
    ],
    edges: [
      { from: "app", to: "api" },
      { from: "app", to: "blob", label: "upload" },
      { from: "app", to: "cdn", label: "view" },
      { from: "cdn", to: "blob" },
      { from: "api", to: "meta" },
      { from: "blob", to: "q" },
      { from: "q", to: "resize" },
      { from: "resize", to: "blob" },
      { from: "api", to: "feed" }
    ],
    steps: [
      { add: ["app", "api"], caption: "The app talks to a stateless API for metadata, follows and feeds." },
      {
        add: ["blob", "meta"],
        caption: "Photos upload straight to object storage via presigned URLs; metadata goes in a sharded DB."
      },
      { add: ["q", "resize"], caption: "Upload events trigger workers that create thumbnails and medium sizes." },
      { add: ["cdn"], caption: "All image sizes are served through a CDN close to users." },
      { add: ["feed"], caption: "Feeds are precomputed per user in a cache as followed accounts post." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Upload, follow, feed and view in multiple sizes. Read-heavy (50:1) with about 20 TB of new originals a day."
    },
    {
      heading: "Upload path",
      body: "App asks the API for a presigned URL, uploads directly to object storage, then confirms. The API writes metadata (id, owner, caption, key)."
    },
    {
      heading: "Processing",
      body: "Storage emits an event; workers generate thumbnail, medium and large sizes and mark the photo ready."
    },
    {
      heading: "Serving",
      body: "Images are fetched through a CDN. Metadata and feeds come from the API, with feeds held as lists of photo ids in a cache."
    },
    {
      heading: "Feed",
      body: "Push new photo ids to followers' cached feeds on upload, but pull posts from very popular accounts at read time to avoid million-way fan-out."
    }
  ],
  keyPoints: [
    "Estimates daily storage around 20 TB",
    "Uploads directly to object storage with presigned URLs",
    "Resizes asynchronously",
    "Serves images through a CDN",
    "Separates metadata DB from blob storage",
    "Uses hybrid fan-out for feeds",
    "Shards metadata by owner or photo id"
  ],
  cardIds: ["object-metadata-split", "fan-out-on-write", "cdn", "bandwidth-math"]
};
