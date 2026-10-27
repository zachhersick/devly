export default {
  id: "video-streaming",
  title: "Design Video Streaming",
  difficulty: "hard",
  minutes: 15,
  tags: ["storage", "caching", "scaling"],
  prompt: "Design a YouTube-style platform: 500 hours of video uploaded every minute and 1 billion hours watched per day. Viewers on phones, TVs and laptops with varying bandwidth should get smooth playback with little buffering anywhere in the world.",
  requirements: {
    functional: [
      "Upload videos",
      "Watch videos with adaptive quality",
      "Search and browse videos",
      "View counts and recommendations"
    ],
    nonFunctional: [
      "Playback starts within ~2 seconds",
      "Minimal rebuffering",
      "Durable storage of originals",
      "Cost-efficient egress"
    ]
  },
  quiz: [
    {
      q: "500 hours/minute uploaded at ~1 GB/hour original. Per day?",
      choices: ["About 72 TB", "About 720 TB", "About 7 PB", "About 7 TB"],
      answer: 1,
      why: "500 × 60 × 24 = 720,000 hours/day × 1 GB ≈ 720 TB of originals daily.",
      tag: "estimation"
    },
    {
      q: "Why split video into 2–6 second segments?",
      choices: [
        "To save upload time",
        "For copyright",
        "To make files bigger",
        "So players can switch quality between segments and cache them"
      ],
      answer: 3,
      why: "Segmenting enables adaptive bitrate and efficient CDN caching.",
      tag: "storage"
    },
    {
      q: "Player switches 1080p → 480p when bandwidth drops. This is?",
      choices: ["Transcoding", "Sharding", "Adaptive bitrate streaming", "Long polling"],
      answer: 2,
      why: "The player picks each next segment's quality from a manifest based on throughput.",
      tag: "realtime"
    },
    {
      q: "Transcoding a 2-hour upload quickly?",
      choices: [
        "Split into chunks and transcode in parallel as a job DAG",
        "One machine sequentially",
        "On the viewer's device",
        "Skip transcoding"
      ],
      answer: 0,
      why: "Parallel chunk encoding turns hours of work into minutes.",
      tag: "queues"
    },
    {
      q: "Most egress should come from?",
      choices: ["Origin datacenter", "Uploader's device", "The database", "CDN edges and caches inside ISPs"],
      answer: 3,
      why: "Edge caches near viewers cut latency and backbone cost.",
      tag: "caching"
    },
    {
      q: "Long-tail videos rarely watched. Store how?",
      choices: [
        "Every rendition on every edge",
        "Fewer renditions and cheaper storage tier, fetch from origin on demand",
        "Delete them",
        "Keep in RAM"
      ],
      answer: 1,
      why: "Popularity-aware storage saves money; hot content gets pushed to edges.",
      tag: "storage"
    },
    {
      q: "View counts: billions of events/day. Approach?",
      choices: [
        "Stream events, aggregate in batches, update counters",
        "SQL increment per view",
        "Count in the CDN logs only once a year",
        "Client stores count"
      ],
      answer: 0,
      why: "Batching avoids hot-row contention and lets you filter fraud.",
      tag: "scaling"
    }
  ],
  diagram: {
    nodes: [
      { id: "up", label: "Uploader", kind: "client", x: 100, y: 50 },
      { id: "view", label: "Viewer", kind: "client", x: 260, y: 50 },
      { id: "upapi", label: "Upload API", kind: "service", x: 100, y: 145 },
      { id: "cdn", label: "CDN Edges", kind: "cdn", x: 260, y: 145 },
      { id: "raw", label: "Originals", kind: "storage", x: 100, y: 240 },
      { id: "seg", label: "Segments", kind: "storage", x: 260, y: 240 },
      { id: "q", label: "Transcode Jobs", kind: "queue", x: 100, y: 335 },
      { id: "meta", label: "Video Meta DB", kind: "db", x: 260, y: 335 },
      { id: "xc", label: "Transcoders", kind: "worker", x: 100, y: 430 },
      { id: "play", label: "Playback API", kind: "service", x: 260, y: 430 }
    ],
    edges: [
      { from: "up", to: "upapi" },
      { from: "upapi", to: "raw", label: "chunks" },
      { from: "upapi", to: "q" },
      { from: "q", to: "xc" },
      { from: "xc", to: "raw" },
      { from: "xc", to: "seg" },
      { from: "xc", to: "meta" },
      { from: "view", to: "play", label: "manifest" },
      { from: "play", to: "meta" },
      { from: "view", to: "cdn", label: "segments" },
      { from: "cdn", to: "seg" }
    ],
    steps: [
      { add: ["up", "upapi", "raw"], caption: "Uploads go in resumable chunks to durable object storage." },
      {
        add: ["q", "xc"],
        caption: "A job pipeline splits the video and transcodes chunks in parallel into many resolutions and codecs."
      },
      {
        add: ["seg", "meta"],
        caption: "Output segments and manifests are stored, and metadata marks the video ready."
      },
      { add: ["view", "play"], caption: "The player fetches a manifest listing available qualities." },
      {
        add: ["cdn"],
        caption: "Segments stream from CDN edges near the viewer, with the player adapting quality as bandwidth changes."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Upload, transcode, store and stream video worldwide with fast start and little buffering; ~720 TB of originals a day and enormous egress."
    },
    {
      heading: "Upload",
      body: "Resumable chunked uploads to object storage via presigned URLs. Metadata (title, owner, status) in a sharded DB."
    },
    {
      heading: "Processing",
      body: "A DAG of jobs: validate, split, transcode chunks in parallel to H.264/VP9/AV1 at several resolutions, package as HLS/DASH segments, thumbnails, content checks."
    },
    {
      heading: "Delivery",
      body: "Manifests and segments served via a multi-tier CDN; popular videos are pre-pushed to edges and ISP caches. The player uses ABR to choose quality per segment."
    },
    {
      heading: "Cost and analytics",
      body: "Tier storage by popularity, generate costly codecs only for popular videos, and count views via streamed events aggregated in batches."
    }
  ],
  keyPoints: [
    "Estimates storage and egress",
    "Uses resumable chunked uploads",
    "Transcodes in parallel into multiple renditions",
    "Segments video and uses adaptive bitrate",
    "Serves through CDN and ISP caches",
    "Tiers storage by popularity",
    "Aggregates view counts via streams"
  ],
  cardIds: ["adaptive-bitrate", "cdn", "object-metadata-split", "bandwidth-math"]
};
