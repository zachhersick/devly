export default {
  id: "multiplayer-game",
  title: "Design a Multiplayer Game Backend",
  difficulty: "hard",
  minutes: 15,
  tags: ["realtime", "scaling", "reliability"],
  prompt: "A competitive online shooter has 3 million concurrent players in 100-player matches. The backend handles matchmaking, runs authoritative game servers at 30 ticks per second, and stores player progress. Lag and cheating ruin the game.",
  requirements: {
    functional: [
      "Matchmake players of similar skill and region",
      "Run real-time matches with authoritative state",
      "Persist results, ranks and inventory",
      "Reconnect after brief drops"
    ],
    nonFunctional: ["Under 50 ms round trip to game server", "Matchmaking within ~60 seconds", "Resistant to cheating"]
  },
  quiz: [
    {
      q: "Who decides if a shot hit?",
      choices: ["The shooter's client", "The victim's client", "A database", "The authoritative game server"],
      answer: 3,
      why: "Server authority prevents clients from faking hits and positions.",
      tag: "security"
    },
    {
      q: "Real-time game traffic usually uses?",
      choices: ["HTTP polling", "UDP with custom reliability for important messages", "Email", "TCP with Nagle on"],
      answer: 1,
      why: "UDP avoids head-of-line blocking; old position updates can simply be dropped.",
      tag: "realtime"
    },
    {
      q: "Hide latency for the player's own movement?",
      choices: [
        "Client-side prediction reconciled with server state",
        "Wait for server every frame",
        "Slow the game down",
        "Ignore input"
      ],
      answer: 0,
      why: "The client moves instantly, then corrects if the server disagrees.",
      tag: "realtime"
    },
    {
      q: "3M players / 100 per match. Concurrent matches?",
      choices: ["3,000", "300,000", "30,000", "300"],
      answer: 2,
      why: "3,000,000 ÷ 100 = 30,000 matches running at once.",
      tag: "estimation"
    },
    {
      q: "Where to run game servers?",
      choices: [
        "One central datacenter",
        "Regional fleets near players, allocated per match",
        "On a player's machine",
        "In the CDN"
      ],
      answer: 1,
      why: "Proximity keeps round trips low; an allocator assigns servers per match.",
      tag: "load-balancing"
    },
    {
      q: "Matchmaking approach?",
      choices: [
        "First 100 in any region",
        "Random global mix",
        "Alphabetical",
        "Queue per region and mode; group by skill, widening range over time"
      ],
      answer: 3,
      why: "Widening the skill window balances match quality with wait time.",
      tag: "queues"
    },
    {
      q: "Game server crashes mid-match. Player progress?",
      choices: [
        "All progress lost forever",
        "Players banned",
        "Results written at match end; crash voids match without penalties",
        "Ignore"
      ],
      answer: 2,
      why: "Only commit durable results at clear points and handle crashes fairly.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "player", label: "Game Client", kind: "client", x: 180, y: 50 },
      { id: "lobby", label: "Lobby API", kind: "gateway", x: 180, y: 126 },
      { id: "mm", label: "Matchmaker", kind: "service", x: 100, y: 202 },
      { id: "alloc", label: "Fleet Alloc", kind: "service", x: 260, y: 202 },
      { id: "gs", label: "Game Server", kind: "service", x: 100, y: 278 },
      { id: "prof", label: "Profiles DB", kind: "db", x: 260, y: 278 },
      { id: "results", label: "Match Results", kind: "queue", x: 180, y: 354 },
      { id: "stats", label: "Stats Worker", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "player", to: "lobby" },
      { from: "lobby", to: "mm", label: "queue" },
      { from: "mm", to: "alloc" },
      { from: "alloc", to: "gs" },
      { from: "player", to: "gs", label: "UDP" },
      { from: "lobby", to: "prof" },
      { from: "gs", to: "results" },
      { from: "results", to: "stats" },
      { from: "stats", to: "prof" }
    ],
    steps: [
      {
        add: ["player", "lobby", "prof"],
        caption: "Players log in to a lobby that loads their profile, rank and inventory."
      },
      {
        add: ["mm"],
        caption: "Matchmaking queues group players by region, mode and skill, widening the range as they wait."
      },
      {
        add: ["alloc", "gs"],
        caption: "A fleet allocator assigns a game server near the players; clients connect directly over UDP."
      },
      {
        add: ["results", "stats"],
        caption: "At match end the server emits results to a queue, and workers update ranks and stats."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Matchmaking, low-latency authoritative matches for 30,000 concurrent games, durable progress, anti-cheat."
    },
    {
      heading: "Matchmaking",
      body: "Tickets in per-region queues; a matcher forms balanced teams by skill rating, expanding tolerance over time, then requests a server."
    },
    {
      heading: "Game servers",
      body: "Dedicated servers in regional fleets, autoscaled ahead of demand. Each runs the simulation at 30 Hz, takes inputs, and sends state snapshots or deltas over UDP."
    },
    {
      heading: "Netcode",
      body: "Client prediction and server reconciliation for own movement, interpolation for others, and lag compensation for hit checks."
    },
    {
      heading: "Persistence and integrity",
      body: "Results go through a queue to update ratings and inventory idempotently by match id. Server authority, input validation and anomaly detection fight cheats; reconnect tokens let dropped players rejoin."
    }
  ],
  keyPoints: [
    "Uses authoritative servers",
    "Uses UDP for game state",
    "Uses client prediction and reconciliation",
    "Estimates concurrent matches",
    "Places servers regionally with an allocator",
    "Matchmakes by skill with widening windows",
    "Persists results idempotently at match end",
    "Supports reconnection"
  ],
  cardIds: ["latency-numbers", "heartbeat", "idempotency-key"]
};
