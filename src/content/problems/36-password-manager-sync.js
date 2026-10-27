export default {
  id: "password-manager-sync",
  title: "Design Password Manager Sync",
  difficulty: "medium",
  minutes: 13,
  tags: ["security", "consistency", "api"],
  prompt: "A password manager syncs encrypted vaults across a user's phone, laptop and browser extension. 15 million users have about 200 entries each. The company must never be able to read users' passwords, even if its servers are breached.",
  requirements: {
    functional: [
      "Store and sync vault items across devices",
      "Work offline and merge changes later",
      "Share selected items with family members",
      "Recover access with a recovery key"
    ],
    nonFunctional: ["Server never sees plaintext", "Sync in a few seconds", "No silent data loss on conflicts"]
  },
  quiz: [
    {
      q: "Where does encryption happen?",
      choices: ["On the server after upload", "In the CDN", "On the device, before upload", "In the database engine"],
      answer: 2,
      why: "Client-side encryption means the server only ever stores ciphertext.",
      tag: "security"
    },
    {
      q: "The vault key comes from?",
      choices: [
        "The master password via a slow key-derivation function",
        "The server",
        "The device serial number",
        "A random value stored next to the data"
      ],
      answer: 0,
      why: "A KDF like Argon2 turns the master password into a key, slowing brute-force attempts.",
      tag: "security"
    },
    {
      q: "How does login work if the server can't know the password?",
      choices: [
        "Send the master password",
        "Email a code only",
        "No login",
        "Derive a separate auth hash from the master password"
      ],
      answer: 3,
      why: "The client derives one secret for auth and a different one for encryption.",
      tag: "security"
    },
    {
      q: "Sync granularity?",
      choices: ["Whole vault blob every time", "Per item, each with a version", "Per character", "Daily full backups"],
      answer: 1,
      why: "Per-item sync sends less data and makes conflicts rare and local.",
      tag: "data-model"
    },
    {
      q: "Same item edited on two devices offline. Safest handling?",
      choices: ["Keep both versions and ask, or keep history", "Last write wins silently", "Delete both", "Keep the oldest"],
      answer: 0,
      why: "Silently losing a password change is unacceptable, so keep the conflict visible.",
      tag: "consistency"
    },
    {
      q: "Sharing an item with a family member?",
      choices: [
        "Send the master password",
        "Store plaintext for them",
        "Encrypt the item key with the recipient's public key",
        "Share the account"
      ],
      answer: 2,
      why: "Public-key wrapping shares one item without revealing anything else.",
      tag: "security"
    },
    {
      q: "15M users × 200 items × 1 KB. Storage?",
      choices: ["About 30 GB", "About 3 TB", "About 300 TB", "About 300 GB"],
      answer: 1,
      why: "15M × 200 × 1 KB = 3 TB of ciphertext, modest for a sharded DB.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "phone", label: "Phone", kind: "client", x: 100, y: 50 },
      { id: "laptop", label: "Laptop", kind: "client", x: 260, y: 50 },
      { id: "crypto", label: "Client Crypto", kind: "service", x: 180, y: 145 },
      { id: "api", label: "Sync API", kind: "service", x: 180, y: 240 },
      { id: "db", label: "Vault DB", kind: "db", x: 100, y: 335 },
      { id: "keys", label: "Public Keys", kind: "db", x: 260, y: 335 },
      { id: "push", label: "Push Notify", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "phone", to: "crypto" },
      { from: "laptop", to: "crypto" },
      { from: "crypto", to: "api", label: "ciphertext" },
      { from: "api", to: "db" },
      { from: "api", to: "keys" },
      { from: "api", to: "push" },
      { from: "push", to: "laptop" }
    ],
    steps: [
      {
        add: ["phone", "laptop", "crypto"],
        caption: "Each device derives keys from the master password and encrypts every item locally."
      },
      { add: ["api", "db"], caption: "The sync API stores encrypted items with version numbers, per user." },
      {
        add: ["keys"],
        caption: "Users' public keys are stored so items can be shared by wrapping keys for a recipient."
      },
      { add: ["push"], caption: "A push wakes other devices to pull changes after the latest version they've seen." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "End-to-end encrypted vault sync across devices, offline edits, sharing, and recovery, without the server ever seeing plaintext."
    },
    {
      heading: "Keys",
      body: "Master password → Argon2 → master key. A random vault key encrypts items and is itself encrypted by the master key. A separate derived hash authenticates to the server."
    },
    {
      heading: "Sync",
      body: "Items are encrypted individually with ids and versions. Devices push changed items and pull changes after a cursor; pushes include the base version for conflict detection."
    },
    {
      heading: "Conflicts",
      body: "If the base version is stale, keep both copies (or item history) and surface the conflict instead of overwriting silently."
    },
    {
      heading: "Sharing and recovery",
      body: "Items shared by encrypting their key with the recipient's public key. Recovery uses a recovery key generated at signup that also wraps the vault key."
    }
  ],
  keyPoints: [
    "Encrypts on the client only",
    "Derives keys from the master password with a slow KDF",
    "Separates the auth secret from the encryption key",
    "Syncs per item with versions",
    "Avoids silent overwrites on conflict",
    "Shares via public-key wrapping",
    "Plans for recovery without server access"
  ],
  cardIds: ["zero-knowledge-sync", "envelope-encryption", "delta-sync", "optimistic-locking"]
};
