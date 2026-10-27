export default {
  id: "file-sync",
  title: "Design File Sync",
  difficulty: "hard",
  minutes: 15,
  tags: ["storage", "consistency", "api"],
  prompt: "Design a Dropbox-style service: 50 million users keep folders in sync across laptops and phones. Files range from tiny notes to 10 GB videos. Edits should sync in seconds, uploads should resume after network drops, and identical data shouldn't be stored twice.",
  requirements: {
    functional: [
      "Upload, download and sync files across devices",
      "Resume interrupted transfers",
      "Version history and restore",
      "Share folders"
    ],
    nonFunctional: ["Never lose or corrupt a file", "Sync small changes quickly", "Minimize bandwidth and storage"]
  },
  quiz: [
    {
      q: "Why split files into ~4 MB blocks?",
      choices: [
        "To encrypt",
        "For compression only",
        "Required by HTTP",
        "Resume transfers, upload only changed blocks, dedupe"
      ],
      answer: 3,
      why: "Blocks make big files manageable and let you skip unchanged parts.",
      tag: "storage"
    },
    {
      q: "Block identity should be?",
      choices: ["Upload time", "A hash of the block content", "File name", "Random id"],
      answer: 1,
      why: "Content hashes enable deduplication and integrity checks.",
      tag: "data-model"
    },
    {
      q: "Metadata (file tree, versions, block lists) belongs in?",
      choices: ["A transactional DB sharded by user/namespace", "The blob store", "Client only", "DNS"],
      answer: 0,
      why: "Metadata needs consistent updates and queries; blobs are separate.",
      tag: "data-model"
    },
    {
      q: "Client learns of changes by?",
      choices: [
        "Downloading everything hourly",
        "Email",
        "Long poll / push notification then fetch changes since cursor",
        "Asking the user"
      ],
      answer: 2,
      why: "A notification says 'something changed'; the client pulls a delta via its cursor.",
      tag: "realtime"
    },
    {
      q: "Two devices edit the same file offline. Result?",
      choices: ["Silently overwrite", "Keep both: save a 'conflicted copy'", "Merge binary bytes", "Delete the file"],
      answer: 1,
      why: "For arbitrary files there's no safe merge, so keep both and let the user decide.",
      tag: "consistency"
    },
    {
      q: "Commit order for a new version?",
      choices: [
        "Metadata first, blocks later",
        "At the same time without checks",
        "Order doesn't matter",
        "Upload blocks first, then commit metadata pointing to them"
      ],
      answer: 3,
      why: "Metadata should only reference blocks that already exist, so readers never see missing data.",
      tag: "consistency"
    },
    {
      q: "50M users × 10 GB average quota usage. Raw storage?",
      choices: ["About 50 PB", "About 5 PB", "About 500 PB", "About 500 TB"],
      answer: 2,
      why: "50M × 10 GB = 500 PB before dedupe, which makes dedupe and tiering valuable.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "laptop", label: "Laptop Client", kind: "client", x: 100, y: 50 },
      { id: "phone", label: "Phone Client", kind: "client", x: 260, y: 50 },
      { id: "notify", label: "Notify Svc", kind: "service", x: 60, y: 177 },
      { id: "meta", label: "Metadata API", kind: "service", x: 180, y: 177 },
      { id: "block", label: "Block API", kind: "service", x: 300, y: 177 },
      { id: "mdb", label: "Metadata DB", kind: "db", x: 100, y: 303 },
      { id: "blobs", label: "Block Store", kind: "storage", x: 260, y: 303 },
      { id: "q", label: "Change Events", kind: "queue", x: 180, y: 430 }
    ],
    edges: [
      { from: "laptop", to: "block", label: "blocks" },
      { from: "laptop", to: "meta", label: "commit" },
      { from: "phone", to: "meta" },
      { from: "phone", to: "block" },
      { from: "meta", to: "mdb" },
      { from: "block", to: "blobs" },
      { from: "mdb", to: "q" },
      { from: "q", to: "notify" },
      { from: "notify", to: "phone", label: "push" }
    ],
    steps: [
      {
        add: ["laptop", "block", "blobs"],
        caption: "The client splits files into blocks, hashes them and uploads only blocks the server doesn't have."
      },
      {
        add: ["meta", "mdb"],
        caption: "It then commits a new file version: an ordered list of block hashes, checked against the parent version."
      },
      {
        add: ["q", "notify"],
        caption: "Each commit emits an event; a notification service tells the user's other devices."
      },
      { add: ["phone"], caption: "Other devices fetch changes since their cursor and download only missing blocks." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Sync files of any size across devices with resumable transfers, history, sharing, and efficient bandwidth and storage."
    },
    {
      heading: "Blocks",
      body: "Files are split into ~4 MB blocks identified by SHA-256. The client asks which hashes are missing and uploads only those, so resumes and small edits are cheap and identical blocks are stored once."
    },
    {
      heading: "Metadata",
      body: "namespaces, files(path, latest version), versions(file, version, block list, author, time). Commits are conditional on the parent version; a mismatch means a conflict."
    },
    {
      heading: "Sync",
      body: "Each namespace has an ordered change journal. Devices long-poll the notification service, then fetch journal entries after their cursor and download missing blocks."
    },
    {
      heading: "Conflicts and history",
      body: "Conflicts become a 'conflicted copy' file. Old versions keep their block lists for restore; blocks are garbage-collected when no version references them."
    }
  ],
  keyPoints: [
    "Splits files into content-hashed blocks",
    "Uploads only missing blocks and supports resume",
    "Deduplicates by hash",
    "Separates metadata DB from block storage",
    "Commits metadata after blocks exist",
    "Uses a change journal with cursors and notifications",
    "Handles conflicts with conflicted copies",
    "Keeps version history with block GC"
  ],
  cardIds: ["delta-sync", "object-metadata-split", "optimistic-locking", "long-polling"]
};
