export default {
  id: "gym-tracker-sync",
  title: "Design a Gym Tracker Sync",
  difficulty: "easy",
  minutes: 8,
  tags: ["consistency", "api", "storage"],
  prompt: "A workout app logs sets on a phone in the gym basement, often with no signal. Users also log from a watch and a tablet. 2 million users log about 30 sets a day. Workouts must sync across devices without losing a single rep.",
  requirements: {
    functional: ["Log sets offline on any device", "Sync automatically when back online", "See the same history on every device"],
    nonFunctional: ["Never lose a logged set", "Sync in a few seconds once online", "Low battery and data use"]
  },
  quiz: [
    {
      q: "Where should a new set be saved first?",
      choices: ["The server only", "The clipboard", "A push notification", "A local database on the device"],
      answer: 3,
      why: "Offline-first: write locally so logging works with no signal, then sync later.",
      tag: "storage"
    },
    {
      q: "Phone and watch both log sets offline. Conflict?",
      choices: [
        "Always, one must win",
        "Rarely, since each set is a new record with its own id",
        "Only on Mondays",
        "The server must lock"
      ],
      answer: 1,
      why: "Adding sets is append-only. With client-generated unique ids, both devices' sets simply merge.",
      tag: "consistency"
    },
    {
      q: "Why generate set ids on the device?",
      choices: [
        "So retries and offline creates don't duplicate",
        "They're prettier",
        "The server can't make ids",
        "To save storage"
      ],
      answer: 0,
      why: "A UUID created on the device lets the server treat a re-sent set as the same record.",
      tag: "data-model"
    },
    {
      q: "User edits a set's weight on two devices. Simple rule?",
      choices: ["Keep both forever", "Delete the set", "Last write wins per field using timestamps", "Pick a random one"],
      answer: 2,
      why: "For a gym log, last-writer-wins per field is simple and acceptable; true merges are overkill.",
      tag: "consistency"
    },
    {
      q: "Efficient way to pull changes?",
      choices: ["Download full history every time", "GET /changes?since=cursor", "Email a CSV", "Poll each set by id"],
      answer: 1,
      why: "A change feed with a cursor sends only what's new since the device last synced.",
      tag: "api"
    },
    {
      q: "How is a deleted set handled in sync?",
      choices: [
        "Remove the row immediately",
        "Ignore deletes",
        "Reset the account",
        "Mark it deleted (tombstone) so other devices learn about it"
      ],
      answer: 3,
      why: "Without a tombstone, another device that still has the set would re-upload it.",
      tag: "data-model"
    },
    {
      q: "2M users × 30 sets/day. Writes per second avg?",
      choices: ["About 7", "About 70,000", "About 700", "About 7,000"],
      answer: 2,
      why: "60M sets a day ÷ ~86,400 s ≈ 700 per second on average.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "phone", label: "Phone", kind: "client", x: 100, y: 50 },
      { id: "watch", label: "Watch", kind: "client", x: 260, y: 50 },
      { id: "local", label: "Local DB", kind: "storage", x: 180, y: 145 },
      { id: "api", label: "Sync API", kind: "service", x: 180, y: 240 },
      { id: "db", label: "Workouts DB", kind: "db", x: 100, y: 335 },
      { id: "feed", label: "Change Log", kind: "db", x: 260, y: 335 },
      { id: "push", label: "Push Notify", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "phone", to: "local" },
      { from: "watch", to: "local" },
      { from: "local", to: "api", label: "push" },
      { from: "api", to: "local", label: "pull" },
      { from: "api", to: "db" },
      { from: "api", to: "feed" },
      { from: "api", to: "push" },
      { from: "push", to: "watch" }
    ],
    steps: [
      {
        add: ["phone", "watch", "local"],
        caption: "Every device writes sets to a local database first, so logging never waits on signal."
      },
      {
        add: ["api"],
        caption: "When online, a sync API accepts batches of local changes and returns changes from other devices."
      },
      {
        add: ["db", "feed"],
        caption: "Sets are stored by their client id, and every change is appended to a per-user change log with a cursor."
      },
      { add: ["push"], caption: "A silent push nudges the user's other devices to pull right away." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Offline logging on several devices, automatic sync, no lost sets. Average load is modest (about 700 writes/s)."
    },
    {
      heading: "Data model",
      body: "Set: id (UUID from the device), user_id, workout_id, exercise, reps, weight, updated_at, deleted flag. Each change gets a server sequence number per user."
    },
    {
      heading: "Sync protocol",
      body: "Device pushes its pending changes, then pulls everything after its last cursor. Pushes are idempotent because ids come from the device."
    },
    {
      heading: "Conflicts",
      body: "New sets never conflict. Edits use last-writer-wins per field; deletes are tombstones so they propagate."
    },
    {
      heading: "Efficiency",
      body: "Batch changes, sync on app open and after logging, and use silent pushes instead of constant polling to save battery."
    }
  ],
  keyPoints: [
    "Writes to a local DB first (offline-first)",
    "Uses client-generated ids so retries don't duplicate",
    "Pulls changes with a cursor (delta sync)",
    "Treats new sets as conflict-free appends",
    "Uses last-writer-wins or similar for edits",
    "Uses tombstones for deletes",
    "Considers battery and data use"
  ],
  cardIds: ["delta-sync", "idempotency-key", "crdt", "eventual-consistency"]
};
