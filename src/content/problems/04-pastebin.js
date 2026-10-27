export default {
  id: "pastebin",
  title: "Design Pastebin",
  difficulty: "easy",
  minutes: 8,
  tags: ["storage", "caching", "api"],
  prompt: "Users paste a block of text and get a short link they can share. Expect 1 million new pastes a day, each up to 1 MB, and about 10 reads for every write. Pastes can expire after a chosen time or live forever.",
  requirements: {
    functional: [
      "Create a paste and get back a short URL",
      "View a paste by its URL",
      "Optional expiry time and optional custom alias"
    ],
    nonFunctional: ["Reads under 200 ms at p99", "Pastes are never lost once created", "Links should be hard to guess"]
  },
  quiz: [
    {
      q: "Which is NOT a core requirement here?",
      choices: ["Create a paste", "Read a paste by link", "Real-time co-editing of a paste", "Expire old pastes"],
      answer: 2,
      why: "Pastebin is write-once, read-many. Live co-editing is a different product with much harder consistency needs.",
      tag: "requirements"
    },
    {
      q: "1M pastes/day at ~10 KB average. Storage per year?",
      choices: ["About 3.6 TB", "About 3.6 GB", "About 36 TB", "About 360 GB"],
      answer: 0,
      why: "1M × 10 KB = 10 GB a day; × 365 ≈ 3.6 TB a year before replication.",
      tag: "estimation"
    },
    {
      q: "Where should paste bodies live?",
      choices: ["A single SQL TEXT column", "Redis only", "The CDN only", "Object storage, with metadata in a DB"],
      answer: 3,
      why: "Bodies can be 1 MB and are immutable, a perfect fit for cheap object storage. Small metadata stays queryable in a database.",
      tag: "storage"
    },
    {
      q: "Good way to make the short key?",
      choices: [
        "Auto-increment id shown as-is",
        "Random 8-char base62 string",
        "Hash of the paste text",
        "User's email plus timestamp"
      ],
      answer: 1,
      why: "A random base62 key is short and unguessable. Sequential ids let anyone enumerate every paste.",
      tag: "data-model"
    },
    {
      q: "Reads are 10× writes. Cheapest speedup?",
      choices: ["Cache hot pastes and serve via CDN", "Shard the metadata DB", "Add a write queue", "Move to a graph DB"],
      answer: 0,
      why: "Pastes never change after creation, so caching them is trivial and safe.",
      tag: "caching"
    },
    {
      q: "Best way to delete expired pastes?",
      choices: [
        "Scan every row on each read",
        "Never delete them",
        "Lazy check on read plus a periodic cleanup job",
        "Delete the whole table nightly"
      ],
      answer: 2,
      why: "Checking expiry on read hides expired pastes immediately; a background sweep reclaims storage later.",
      tag: "storage"
    },
    {
      q: "What API returns a created paste?",
      choices: ["GET /paste?text=...", "POST /pastes → 201 with key and URL", "PUT /pastes/all", "DELETE /pastes then POST"],
      answer: 1,
      why: "Creating a resource is a POST with the body in the request, returning 201 and the new link.",
      tag: "api"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Client", kind: "client", x: 180, y: 50 },
      { id: "cdn", label: "CDN", kind: "cdn", x: 100, y: 145 },
      { id: "lb", label: "Load Balancer", kind: "lb", x: 260, y: 145 },
      { id: "api", label: "Paste API", kind: "service", x: 180, y: 240 },
      { id: "cache", label: "Cache", kind: "cache", x: 60, y: 335 },
      { id: "db", label: "Metadata DB", kind: "db", x: 180, y: 335 },
      { id: "blob", label: "Paste Store", kind: "storage", x: 300, y: 335 },
      { id: "cleanup", label: "Expiry Job", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "cdn", label: "GET" },
      { from: "client", to: "lb", label: "POST" },
      { from: "cdn", to: "lb" },
      { from: "lb", to: "api" },
      { from: "api", to: "cache" },
      { from: "api", to: "db" },
      { from: "api", to: "blob" },
      { from: "cleanup", to: "db" },
      { from: "cleanup", to: "blob" }
    ],
    steps: [
      {
        add: ["client", "lb", "api"],
        caption: "Clients talk to a stateless paste API behind a load balancer, so we can add servers freely."
      },
      {
        add: ["db", "blob"],
        caption: "Metadata (key, expiry, size) goes in a database; the text itself goes in object storage."
      },
      {
        add: ["cache", "cdn"],
        caption: "Pastes are immutable, so a cache and CDN can serve most reads without touching storage."
      },
      {
        add: ["cleanup"],
        caption: "A periodic job removes expired pastes; reads also check expiry so nothing stale is shown."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Create, read and expire text pastes. Read-heavy (about 10:1), durable, and links must not be guessable."
    },
    {
      heading: "Estimates",
      body: "1M writes a day is about 12 per second; reads about 120 per second, peaking maybe 5×. Around 10 GB of new text a day, a few TB a year."
    },
    {
      heading: "Data model",
      body: "Metadata row: key, created_at, expires_at, size, storage path, optional owner. The paste body is stored as an object under the key."
    },
    {
      heading: "Keys",
      body: "Generate a random 8-character base62 key (about 218 trillion options). Insert with a unique constraint and retry on the rare collision. Custom aliases go through the same uniqueness check."
    },
    {
      heading: "Reads and expiry",
      body: "Serve reads from CDN, then cache, then storage. Check expires_at on every read; a nightly job deletes expired objects and rows."
    }
  ],
  keyPoints: [
    "Splits metadata (DB) from paste bodies (object storage)",
    "Random, non-sequential keys so pastes can't be enumerated",
    "Estimates write QPS around 12/s and TB-scale yearly storage",
    "Caches or CDNs immutable pastes",
    "Handles expiry lazily on read plus a cleanup job",
    "Enforces a size limit on paste bodies",
    "Handles key collisions with a unique constraint and retry"
  ],
  cardIds: ["base62", "object-metadata-split", "storage-math", "cdn"]
};
