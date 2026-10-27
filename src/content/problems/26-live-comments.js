export default {
  id: "live-comments",
  title: "Design Live Comments",
  difficulty: "medium",
  minutes: 12,
  tags: ["realtime", "scaling", "queues"],
  prompt: "During live video streams, viewers post comments that everyone watching sees within a couple of seconds. A big stream can have 2 million concurrent viewers and 5,000 comments per second. There are thousands of smaller streams at the same time.",
  requirements: {
    functional: ["Post a comment on a live stream", "See new comments in near real time", "Load recent comments when joining"],
    nonFunctional: [
      "Comments appear within ~2 seconds",
      "Handle millions of viewers on one stream",
      "Moderation can remove comments fast"
    ]
  },
  quiz: [
    {
      q: "5k comments/s to 2M viewers. Deliveries per second if sent to all?",
      choices: ["10 billion", "10 million", "100,000", "1 billion"],
      answer: 0,
      why: "5,000 × 2,000,000 = 10 billion messages a second, far too many to send individually.",
      tag: "estimation"
    },
    {
      q: "So how do we cope on huge streams?",
      choices: [
        "Send everything anyway",
        "Disable comments",
        "Sample or batch: send a capped, merged batch per second",
        "Email digests"
      ],
      answer: 2,
      why: "No viewer can read 5k/s. Send each viewer a sampled batch of, say, 20 comments a second.",
      tag: "scaling"
    },
    {
      q: "Transport from server to viewers?",
      choices: ["Polling every 30 s", "SSE or WebSockets", "SMTP", "FTP"],
      answer: 1,
      why: "Server push over SSE or WebSockets gets comments to viewers within a second or two.",
      tag: "realtime"
    },
    {
      q: "How do edge servers get comments for a stream?",
      choices: [
        "Receive every comment for every stream",
        "Query the DB per viewer",
        "Ask other viewers",
        "Subscribe to that stream's channel only if they have viewers of it"
      ],
      answer: 3,
      why: "Each gateway subscribes only to streams its connected viewers are watching.",
      tag: "queues"
    },
    {
      q: "Where do comments get stored for replay?",
      choices: [
        "In each viewer's memory only",
        "A CDN",
        "Append to a store partitioned by stream id, ordered by time",
        "Nowhere"
      ],
      answer: 2,
      why: "Partitioning by stream keeps reads like 'last 50 comments for stream X' cheap.",
      tag: "data-model"
    },
    {
      q: "Toxic comments must be removed fast. How?",
      choices: [
        "Moderation step before fan-out plus delete events pushed after",
        "Wait for the stream to end",
        "Rely on viewers",
        "Re-encode the video"
      ],
      answer: 0,
      why: "Filter before broadcasting, and push delete events so clients hide anything missed.",
      tag: "security"
    },
    {
      q: "A joining viewer sees history from?",
      choices: [
        "Replaying the whole stream",
        "Nothing",
        "Other viewers' phones",
        "A cached list of the latest comments per stream"
      ],
      answer: 3,
      why: "Keep the last N comments per stream in a cache for instant join.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "poster", label: "Commenter", kind: "client", x: 180, y: 50 },
      { id: "api", label: "Comment API", kind: "service", x: 180, y: 126 },
      { id: "mod", label: "Moderation", kind: "worker", x: 100, y: 202 },
      { id: "db", label: "Comments DB", kind: "db", x: 260, y: 202 },
      { id: "bus", label: "Pub/Sub", kind: "queue", x: 100, y: 278 },
      { id: "recent", label: "Recent Cache", kind: "cache", x: 260, y: 278 },
      { id: "edge", label: "Edge Gateways", kind: "service", x: 180, y: 354 },
      { id: "viewers", label: "Viewers", kind: "client", x: 180, y: 430 }
    ],
    edges: [
      { from: "poster", to: "api" },
      { from: "api", to: "mod" },
      { from: "mod", to: "db" },
      { from: "mod", to: "bus" },
      { from: "mod", to: "recent" },
      { from: "bus", to: "edge", label: "by stream" },
      { from: "edge", to: "viewers", label: "SSE" },
      { from: "viewers", to: "recent", label: "join" }
    ],
    steps: [
      { add: ["poster", "api"], caption: "Comments are posted to a stateless API with rate limits per user." },
      { add: ["mod", "db"], caption: "A quick moderation pass runs before a comment is stored." },
      {
        add: ["bus", "recent"],
        caption: "Approved comments are published on the stream's channel and added to a recent-comments cache."
      },
      {
        add: ["edge", "viewers"],
        caption: "Edge gateways subscribe to channels for streams their viewers watch, then batch and push comments over SSE."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Post and receive comments in about 2 seconds, scale to millions of viewers per stream, remove bad comments fast."
    },
    {
      heading: "Write path",
      body: "API authenticates and rate limits, runs moderation, stores the comment (stream id, time, user, text) and publishes it to a pub/sub channel per stream."
    },
    {
      heading: "Fan-out",
      body: "Viewers hold SSE or WebSocket connections to edge gateways. Each gateway subscribes once per stream it serves and fans out locally, so the bus only delivers to gateways, not viewers."
    },
    {
      heading: "Huge streams",
      body: "Gateways batch comments every 500 ms and cap how many each viewer gets, sampling (with a boost for friends or creator replies) when volume is high."
    },
    {
      heading: "History and moderation",
      body: "A cache keeps the last 100 comments per stream for joiners. Deletions publish a removal event so clients hide the comment."
    }
  ],
  keyPoints: [
    "Does the fan-out math and sees it's impossible to send everything",
    "Samples or batches comments on huge streams",
    "Uses SSE or WebSockets for push",
    "Has gateways subscribe per stream, not per viewer",
    "Partitions comment storage by stream",
    "Moderates before fan-out and pushes deletes",
    "Caches recent comments for joiners"
  ],
  cardIds: ["server-sent-events", "pub-sub", "fan-out-on-write"]
};
