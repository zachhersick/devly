export default {
  id: "ride-hailing",
  title: "Design Ride Hailing",
  difficulty: "hard",
  minutes: 15,
  tags: ["realtime", "search", "consistency"],
  prompt: "Design an Uber-style service with 5 million active drivers sending GPS every 4 seconds and 20 million rides a day. Riders request a ride, get matched to a nearby driver within seconds, see the car approach live, and pay at the end.",
  requirements: {
    functional: [
      "Drivers share live location and availability",
      "Riders request rides and get an ETA and price",
      "Match a rider to one nearby driver",
      "Live trip tracking and payment"
    ],
    nonFunctional: ["Matching in under 5 seconds", "A driver never gets two riders at once", "Location updates handled at ~1M/s"]
  },
  quiz: [
    {
      q: "5M drivers / 4 s. Location writes per second?",
      choices: ["About 125k", "About 12.5M", "About 1.25M", "About 12.5k"],
      answer: 2,
      why: "5,000,000 ÷ 4 = 1.25 million updates per second.",
      tag: "estimation"
    },
    {
      q: "Store live driver positions in?",
      choices: [
        "In-memory geo index sharded by region",
        "Relational table with an update per ping",
        "Object storage",
        "Blockchain"
      ],
      answer: 0,
      why: "Only the latest location matters for matching, and memory handles the write rate.",
      tag: "storage"
    },
    {
      q: "Find drivers within 2 km quickly?",
      choices: ["Scan all drivers", "Sort by driver id", "Ask riders", "Geohash or S2 cells: query nearby cells"],
      answer: 3,
      why: "Cell-based indexes narrow the search to a few hundred candidates.",
      tag: "search"
    },
    {
      q: "Two riders' requests pick the same driver. Prevent with?",
      choices: [
        "Let both ride",
        "Atomic driver state change AVAILABLE → OFFERED with a lease",
        "First to call wins by phone",
        "Random"
      ],
      answer: 1,
      why: "A conditional state transition guarantees one offer at a time; the lease expires if the driver ignores it.",
      tag: "consistency"
    },
    {
      q: "Nearest by distance isn't always best. Better?",
      choices: ["Rank by road-network ETA", "Rank by driver id", "Rank by car color", "Alphabetical"],
      answer: 0,
      why: "A driver 500 m away across a river can be 10 minutes out.",
      tag: "search"
    },
    {
      q: "Shard matching by?",
      choices: ["Rider name", "Payment method", "City / region", "Hour"],
      answer: 2,
      why: "Rides are local; regional shards keep data and work together.",
      tag: "sharding"
    },
    {
      q: "Trip state (requested, accepted, in progress, completed) stored in?",
      choices: ["Driver phone only", "Durable DB with state machine transitions", "Cache only", "Logs"],
      answer: 1,
      why: "Trips involve money and disputes, so they need durable, consistent records.",
      tag: "data-model"
    }
  ],
  diagram: {
    nodes: [
      { id: "rider", label: "Rider App", kind: "client", x: 100, y: 50 },
      { id: "driver", label: "Driver App", kind: "client", x: 260, y: 50 },
      { id: "gw", label: "WS Gateway", kind: "gateway", x: 180, y: 145 },
      { id: "match", label: "Matching Svc", kind: "service", x: 100, y: 240 },
      { id: "loc", label: "Location Svc", kind: "service", x: 260, y: 240 },
      { id: "geo", label: "Driver Geo Idx", kind: "cache", x: 60, y: 335 },
      { id: "eta", label: "ETA / Routing", kind: "service", x: 180, y: 335 },
      { id: "trips", label: "Trips DB", kind: "db", x: 300, y: 335 },
      { id: "pay", label: "Payments", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "rider", to: "gw" },
      { from: "driver", to: "gw", label: "GPS" },
      { from: "gw", to: "loc" },
      { from: "gw", to: "match" },
      { from: "loc", to: "geo" },
      { from: "match", to: "geo" },
      { from: "match", to: "eta" },
      { from: "match", to: "trips" },
      { from: "trips", to: "pay" }
    ],
    steps: [
      { add: ["rider", "driver", "gw"], caption: "Both apps keep a persistent connection to regional gateways." },
      { add: ["loc", "geo"], caption: "Driver GPS pings update an in-memory geo index sharded by city." },
      {
        add: ["match", "eta"],
        caption: "On a request, matching pulls nearby available drivers and ranks them by road ETA."
      },
      { add: ["trips"], caption: "It atomically offers the trip to one driver and records the trip state durably." },
      { add: ["pay"], caption: "When the trip completes, the fare is charged through the payment provider." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Live driver locations at ~1.25M/s, sub-5-second matching, no double assignment, live tracking, payment."
    },
    {
      heading: "Locations",
      body: "Drivers send GPS every 4 s over a persistent connection. Location service updates an in-memory index keyed by S2/geohash cell, sharded by city, and samples history to storage."
    },
    {
      heading: "Matching",
      body: "Fetch available drivers in nearby cells, compute ETAs with the routing service, pick the best, and set its state to OFFERED with a 10-second lease. If declined or expired, try the next."
    },
    {
      heading: "Trips",
      body: "A trip state machine in a durable DB sharded by city. Each transition is an event used for tracking, pricing and receipts."
    },
    {
      heading: "Tracking and payment",
      body: "Riders subscribe to the trip and receive driver locations via push. At completion, the fare is computed and charged with an idempotency key."
    }
  ],
  keyPoints: [
    "Estimates location write rate",
    "Keeps live locations in memory with a geo index",
    "Searches neighboring cells",
    "Ranks by ETA not straight-line distance",
    "Prevents double assignment with atomic state and leases",
    "Shards by city",
    "Stores trips durably as a state machine",
    "Pushes live tracking"
  ],
  cardIds: ["geohash", "lease", "websockets", "shard-key"]
};
