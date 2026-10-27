export default {
  id: "maps-routing",
  title: "Design Maps Navigation",
  difficulty: "hard",
  minutes: 15,
  tags: ["search", "caching", "realtime"],
  prompt: "Build turn-by-turn navigation for a maps app: 100 million daily users ask for driving routes across a road network with 500 million road segments. Routes must account for live traffic and return in under a second. Map tiles must load fast on phones.",
  requirements: {
    functional: [
      "Render map tiles at many zoom levels",
      "Compute fastest route between two points",
      "Update ETAs with live traffic",
      "Reroute when the driver leaves the route"
    ],
    nonFunctional: ["Route answer under 1 second", "Traffic reflected within minutes", "Tiles load instantly while panning"]
  },
  quiz: [
    {
      q: "Plain Dijkstra on 500M segments per request?",
      choices: ["Fast enough", "Too slow at continent scale", "Gives wrong answers", "Uses no memory"],
      answer: 1,
      why: "It explores huge areas; preprocessing like contraction hierarchies speeds it up enormously.",
      tag: "search"
    },
    {
      q: "Contraction hierarchies speed routing by?",
      choices: [
        "Removing roads",
        "Caching every route",
        "Random sampling",
        "Precomputing shortcut edges between important nodes"
      ],
      answer: 3,
      why: "Queries mostly travel along shortcuts, touching only a few thousand nodes.",
      tag: "search"
    },
    {
      q: "Live traffic changes edge weights. Approach?",
      choices: [
        "Rebuild everything per request",
        "Ignore traffic",
        "Customizable weights over a fixed hierarchy, updated every few minutes",
        "Ask drivers"
      ],
      answer: 2,
      why: "Separating structure from weights lets traffic update quickly.",
      tag: "realtime"
    },
    {
      q: "Where does live traffic data come from?",
      choices: ["Aggregated, anonymized GPS speeds from phones", "Weather reports", "Map tiles", "Billboards"],
      answer: 0,
      why: "Probe data from many devices estimates speed per road segment.",
      tag: "data-model"
    },
    {
      q: "Map tiles are best served as?",
      choices: [
        "Generated per request on origin",
        "One giant image",
        "Base64 in JSON",
        "Pre-rendered or vector tiles by z/x/y via CDN"
      ],
      answer: 3,
      why: "Tiles are static per version and cache perfectly at the edge.",
      tag: "caching"
    },
    {
      q: "Partition the routing graph by?",
      choices: ["Road name alphabetically", "Geographic regions with boundary nodes", "Random", "User id"],
      answer: 1,
      why: "Regional partitions fit in memory; cross-region routes stitch at borders.",
      tag: "sharding"
    },
    {
      q: "Driver misses a turn. Reroute where?",
      choices: [
        "Server recomputes from current position, client can do a quick local fix",
        "Restart the app",
        "Ignore",
        "Call support"
      ],
      answer: 0,
      why: "Fast server reroute plus on-device fallback keeps guidance smooth.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "phone", label: "Phone App", kind: "client", x: 180, y: 50 },
      { id: "cdn", label: "Tile CDN", kind: "cdn", x: 100, y: 126 },
      { id: "gw", label: "API Gateway", kind: "gateway", x: 260, y: 126 },
      { id: "tiles", label: "Tile Store", kind: "storage", x: 60, y: 202 },
      { id: "route", label: "Routing Svc", kind: "service", x: 180, y: 202 },
      { id: "eta", label: "ETA Svc", kind: "service", x: 300, y: 202 },
      { id: "graph", label: "Road Graph", kind: "cache", x: 100, y: 278 },
      { id: "traffic", label: "Traffic Speeds", kind: "cache", x: 260, y: 278 },
      { id: "probes", label: "GPS Probes", kind: "queue", x: 180, y: 354 },
      { id: "agg", label: "Traffic Agg", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "phone", to: "cdn", label: "tiles" },
      { from: "cdn", to: "tiles" },
      { from: "phone", to: "gw" },
      { from: "gw", to: "route" },
      { from: "gw", to: "eta" },
      { from: "route", to: "graph" },
      { from: "route", to: "traffic" },
      { from: "eta", to: "traffic" },
      { from: "phone", to: "probes", label: "GPS" },
      { from: "probes", to: "agg" },
      { from: "agg", to: "traffic" }
    ],
    steps: [
      {
        add: ["phone", "cdn", "tiles"],
        caption: "Map tiles are pre-built per zoom level and served from a CDN, cached on the phone."
      },
      {
        add: ["gw", "route", "graph"],
        caption: "Routing servers hold a preprocessed road graph in memory, partitioned by region."
      },
      {
        add: ["probes", "agg"],
        caption: "Phones send anonymized GPS samples; an aggregator turns them into speeds per road segment."
      },
      { add: ["traffic"], caption: "Fresh speeds update edge weights every few minutes." },
      {
        add: ["eta"],
        caption: "An ETA service combines the route with live and historical speeds and refreshes during the trip."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Fast tiles, sub-second traffic-aware routing over 500M segments, live ETAs and rerouting for 100M daily users."
    },
    {
      heading: "Tiles",
      body: "Vector tiles by zoom/x/y generated offline per map version, stored in object storage, served by CDN, cached on device."
    },
    {
      heading: "Routing",
      body: "Road graph partitioned by region and held in memory. Preprocess with contraction hierarchies (or a multi-level partition) so queries take milliseconds; A* style search for local legs."
    },
    {
      heading: "Traffic",
      body: "Aggregate probe GPS into speeds per segment with stream windows, blend with historical patterns for the time of day, and update weights every few minutes using a customizable routing scheme."
    },
    {
      heading: "During the trip",
      body: "Phone reports position; the server refreshes ETA and suggests faster routes. Off-route detection triggers a reroute, with a simple on-device fallback offline."
    }
  ],
  keyPoints: [
    "Notes plain Dijkstra is too slow at scale",
    "Uses preprocessing like contraction hierarchies",
    "Separates graph structure from live weights",
    "Builds traffic from aggregated GPS probes",
    "Serves tiles via CDN",
    "Partitions the graph by region",
    "Handles rerouting"
  ],
  cardIds: ["graph-shortest-path", "cdn", "stream-windows", "quadtree"]
};
