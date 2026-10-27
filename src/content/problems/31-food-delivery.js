export default {
  id: "food-delivery",
  title: "Design Food Delivery",
  difficulty: "medium",
  minutes: 14,
  tags: ["realtime", "consistency", "queues"],
  prompt: "A food delivery app connects customers, restaurants and couriers in 500 cities. At dinner peak there are 20,000 orders per minute and 300,000 active couriers sending GPS updates every 5 seconds. Customers track their courier live on a map.",
  requirements: {
    functional: [
      "Browse restaurants and place an order",
      "Restaurant accepts and prepares the order",
      "Assign a nearby courier",
      "Live tracking of the courier"
    ],
    nonFunctional: ["Orders and payments never lost", "Courier assignment within 30 s", "Tracking updates every few seconds"]
  },
  quiz: [
    {
      q: "300k couriers × GPS every 5 s. Updates/s?",
      choices: ["6,000", "60,000", "600,000", "600"],
      answer: 1,
      why: "300,000 ÷ 5 = 60,000 location updates per second.",
      tag: "estimation"
    },
    {
      q: "Where to keep courier locations?",
      choices: [
        "SQL row update per ping with history",
        "A CDN",
        "Courier's phone only",
        "In-memory geo index (e.g. Redis GEO), only latest position"
      ],
      answer: 3,
      why: "Matching needs the latest position fast; history can go to cheap storage asynchronously.",
      tag: "storage"
    },
    {
      q: "Order status flow (placed → accepted → picked up → delivered) is best modeled as?",
      choices: ["Free text", "Random flags", "A state machine with allowed transitions", "A counter"],
      answer: 2,
      why: "Explicit states prevent impossible jumps like delivered before picked up.",
      tag: "data-model"
    },
    {
      q: "How to choose a courier?",
      choices: [
        "Nearest available courier scored by ETA to restaurant and food ready time",
        "Random courier anywhere",
        "First courier who signed up",
        "Customer picks"
      ],
      answer: 0,
      why: "Match on ETA and readiness so food doesn't wait or go cold.",
      tag: "search"
    },
    {
      q: "Order service and courier service must coordinate. Avoid lost events with?",
      choices: [
        "Shared global lock",
        "Email",
        "Two separate DB writes hoping both succeed",
        "Transactional outbox and a queue"
      ],
      answer: 3,
      why: "Writing the event with the state change guarantees it gets published.",
      tag: "queues"
    },
    {
      q: "Customer's tracking map updates via?",
      choices: [
        "Refresh button",
        "Push over WebSocket from a location channel per order",
        "SMS every minute",
        "Polling the SQL DB per second"
      ],
      answer: 1,
      why: "Subscribe to the order's courier location and push updates.",
      tag: "realtime"
    },
    {
      q: "Partition data by?",
      choices: ["City or region", "Restaurant name", "Order amount", "Random"],
      answer: 0,
      why: "Almost all activity is local, so cities make natural shards.",
      tag: "sharding"
    }
  ],
  diagram: {
    nodes: [
      { id: "cust", label: "Customer App", kind: "client", x: 60, y: 50 },
      { id: "rest", label: "Restaurant App", kind: "client", x: 180, y: 50 },
      { id: "cour", label: "Courier App", kind: "client", x: 300, y: 50 },
      { id: "gw", label: "API Gateway", kind: "gateway", x: 180, y: 145 },
      { id: "order", label: "Order Svc", kind: "service", x: 100, y: 240 },
      { id: "loc", label: "Location Svc", kind: "service", x: 260, y: 240 },
      { id: "db", label: "Orders DB", kind: "db", x: 60, y: 335 },
      { id: "q", label: "Order Events", kind: "queue", x: 180, y: 335 },
      { id: "geo", label: "Courier Geo", kind: "cache", x: 300, y: 335 },
      { id: "match", label: "Dispatcher", kind: "worker", x: 100, y: 430 },
      { id: "track", label: "Tracking Push", kind: "service", x: 260, y: 430 }
    ],
    edges: [
      { from: "cust", to: "gw" },
      { from: "rest", to: "gw" },
      { from: "cour", to: "gw", label: "GPS" },
      { from: "gw", to: "order" },
      { from: "gw", to: "loc" },
      { from: "order", to: "db" },
      { from: "order", to: "q" },
      { from: "loc", to: "geo" },
      { from: "q", to: "match" },
      { from: "match", to: "geo" },
      { from: "loc", to: "track" },
      { from: "track", to: "cust" }
    ],
    steps: [
      {
        add: ["cust", "rest", "cour", "gw"],
        caption: "Customers, restaurants and couriers each have an app talking to one gateway."
      },
      {
        add: ["order", "db", "q"],
        caption: "The order service runs the order state machine and emits an event for each change."
      },
      {
        add: ["loc", "geo"],
        caption: "Couriers stream GPS to a location service that keeps the latest position in a geo index."
      },
      { add: ["match"], caption: "A dispatcher picks the best courier by ETA when the order is accepted." },
      { add: ["track"], caption: "A tracking service pushes the courier's position to the customer's open app." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Ordering, restaurant handling, courier matching and live tracking, with durable orders and fast assignment. 60k GPS updates/s."
    },
    {
      heading: "Orders",
      body: "Order service stores orders and enforces a state machine. Payments are authorized at placement and captured at delivery. Each transition writes an outbox event."
    },
    {
      heading: "Locations",
      body: "Couriers send GPS every 5 s. The latest position goes into an in-memory geo index sharded by city; a sample is archived for analytics."
    },
    {
      heading: "Dispatch",
      body: "On restaurant acceptance, the dispatcher searches nearby available couriers, scores by ETA versus prep time, and offers the job; if declined or timed out, it tries the next."
    },
    {
      heading: "Tracking",
      body: "The customer app subscribes to its order; courier positions are pushed over a WebSocket every few seconds."
    }
  ],
  keyPoints: [
    "Estimates location update rate",
    "Stores live locations in an in-memory geo index",
    "Models orders as a state machine",
    "Matches couriers by ETA and readiness",
    "Uses events or outbox between services",
    "Pushes live tracking over WebSockets",
    "Partitions by city"
  ],
  cardIds: ["geohash", "transactional-outbox", "websockets", "shard-key"]
};
