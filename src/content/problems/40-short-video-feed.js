export default {
  id: "short-video-feed",
  title: "Design a Short-Video Feed",
  difficulty: "medium",
  minutes: 14,
  tags: ["storage", "caching", "scaling"],
  prompt: "A TikTok-style app shows an endless, personalized feed of 15–60 second videos. 100 million daily users watch about 100 videos each, and creators upload 5 million videos a day. The next video must start instantly when you swipe.",
  requirements: {
    functional: [
      "Upload and process short videos",
      "Personalized endless feed",
      "Instant playback on swipe",
      "Likes and view counts"
    ],
    nonFunctional: ["Video starts in under 200 ms", "Feed adapts to recent behavior within minutes", "Massive egress at low cost"]
  },
  quiz: [
    {
      q: "100M users × 100 videos × 5 MB. Daily egress?",
      choices: ["About 5 PB", "About 500 TB", "About 50 PB", "About 50 TB"],
      answer: 2,
      why: "10 billion views × 5 MB = 50 PB a day, so CDNs and efficient encoding are essential.",
      tag: "estimation"
    },
    {
      q: "How to make swipes feel instant?",
      choices: ["Prefetch the next few videos' first segments", "Bigger video files", "Load on tap only", "Stream from origin"],
      answer: 0,
      why: "The client downloads the start of upcoming videos while you watch the current one.",
      tag: "caching"
    },
    {
      q: "Uploaded videos are processed how?",
      choices: [
        "Served as uploaded",
        "On the phone of each viewer",
        "Only on first view",
        "Async pipeline: transcode to several bitrates, thumbnails, moderation"
      ],
      answer: 3,
      why: "Transcoding is heavy, so it runs as queued jobs after upload.",
      tag: "queues"
    },
    {
      q: "Feed generation flow?",
      choices: ["Newest videos only", "Candidate retrieval → ranking model → filtering", "Alphabetical", "Random"],
      answer: 1,
      why: "Retrieve a few thousand candidates cheaply, then rank them with a model.",
      tag: "search"
    },
    {
      q: "Feed should react to what you just skipped. How?",
      choices: [
        "Stream engagement events to update features in near real time",
        "Retrain weekly only",
        "Ask a survey",
        "Ignore skips"
      ],
      answer: 0,
      why: "Recent watch time and skips feed real-time features for the next ranking request.",
      tag: "realtime"
    },
    {
      q: "Hot new viral video. Serve from?",
      choices: ["Origin storage", "One server", "CDN edges, pre-warmed when trending", "Peer phones only"],
      answer: 2,
      why: "Pushing hot content to edges keeps origin load low and playback fast.",
      tag: "caching"
    },
    {
      q: "View counts at huge scale?",
      choices: [
        "SQL UPDATE per view",
        "Aggregate events in a stream, update counters periodically",
        "Count on the phone",
        "Skip counts"
      ],
      answer: 1,
      why: "Batching millions of view events avoids hot-row contention.",
      tag: "scaling"
    }
  ],
  diagram: {
    nodes: [
      { id: "creator", label: "Creator", kind: "client", x: 100, y: 50 },
      { id: "viewer", label: "Viewer", kind: "client", x: 260, y: 50 },
      { id: "cdn", label: "CDN", kind: "cdn", x: 100, y: 145 },
      { id: "api", label: "Feed API", kind: "service", x: 260, y: 145 },
      { id: "blob", label: "Video Store", kind: "storage", x: 100, y: 240 },
      { id: "rank", label: "Ranker", kind: "service", x: 260, y: 240 },
      { id: "tq", label: "Transcode Q", kind: "queue", x: 60, y: 335 },
      { id: "feat", label: "Feature Store", kind: "cache", x: 180, y: 335 },
      { id: "events", label: "Engagement", kind: "queue", x: 300, y: 335 },
      { id: "xcode", label: "Transcoders", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "creator", to: "blob", label: "upload" },
      { from: "blob", to: "tq" },
      { from: "tq", to: "xcode" },
      { from: "xcode", to: "blob" },
      { from: "viewer", to: "api" },
      { from: "viewer", to: "cdn", label: "video" },
      { from: "cdn", to: "blob" },
      { from: "api", to: "rank" },
      { from: "rank", to: "feat" },
      { from: "viewer", to: "events" },
      { from: "events", to: "feat" }
    ],
    steps: [
      { add: ["creator", "blob"], caption: "Creators upload originals to object storage." },
      {
        add: ["tq", "xcode"],
        caption: "A queue feeds transcoders that create several bitrates, thumbnails and moderation checks."
      },
      {
        add: ["viewer", "cdn"],
        caption: "Viewers stream video segments from the CDN, prefetching the next few videos."
      },
      {
        add: ["api", "rank", "feat"],
        caption: "The feed API asks a ranker for the next batch, using user and video features."
      },
      { add: ["events"], caption: "Watch time, likes and skips stream back to update features within minutes." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Upload, process, personalize and play short videos instantly for 100M daily users; ~50 PB/day egress."
    },
    {
      heading: "Upload and processing",
      body: "Direct upload to object storage; a queue drives transcoding into HLS/DASH renditions, thumbnails and safety checks before the video becomes eligible."
    },
    {
      heading: "Playback",
      body: "Segments served by CDN. The app keeps a buffer of the next 3–5 videos and prefetches their first seconds."
    },
    {
      heading: "Feed",
      body: "Candidate generators (followed creators, similar videos, trending, embedding neighbors) feed a ranking model scoring predicted watch time; filters remove seen and unsafe content. Return batches of ~10."
    },
    {
      heading: "Feedback",
      body: "Engagement events stream into a feature store and counters, so ranking adapts within minutes; models retrain daily."
    }
  ],
  keyPoints: [
    "Estimates egress and the need for a CDN",
    "Prefetches upcoming videos",
    "Transcodes asynchronously into multiple bitrates",
    "Describes candidate retrieval then ranking",
    "Feeds engagement back in near real time",
    "Pre-warms CDN for viral content",
    "Aggregates counts in batches"
  ],
  cardIds: ["adaptive-bitrate", "cdn", "bandwidth-math", "stream-windows"]
};
