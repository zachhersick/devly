export default {
  id: "proximity-search",
  title: "Design Nearby Places Search",
  difficulty: "medium",
  minutes: 13,
  tags: ["search", "data-model", "caching"],
  prompt: "A Yelp-style app lets users find restaurants and shops near them, filtered by category and rating. There are 200 million places worldwide and 100,000 searches per second at peak. Places are added or edited a few thousand times a day.",
  requirements: {
    functional: [
      "Search places within a radius of a location",
      "Filter by category, rating, open now",
      "View place details and reviews"
    ],
    nonFunctional: ["Search under 200 ms", "Read-heavy, writes rare", "Works everywhere from dense cities to rural areas"]
  },
  quiz: [
    {
      q: "Why is WHERE lat BETWEEN ... AND lng BETWEEN ... slow?",
      choices: [
        "SQL can't do math",
        "Coordinates are strings",
        "Two separate ranges can't use one index well",
        "It's fast actually"
      ],
      answer: 2,
      why: "A normal index helps one range; the other still filters a huge strip of rows.",
      tag: "search"
    },
    {
      q: "Geohash helps because?",
      choices: [
        "Nearby points share a prefix, so a string index works",
        "It encrypts locations",
        "It's shorter than a name",
        "It stores reviews"
      ],
      answer: 0,
      why: "Converting lat/lng to a prefix-ordered string turns 2D proximity into 1D lookups.",
      tag: "search"
    },
    {
      q: "Searching a geohash cell alone can miss nearby places. Fix?",
      choices: ["Use a bigger font", "Search the whole planet", "Ignore it", "Also search the 8 neighboring cells"],
      answer: 3,
      why: "A place just across a cell border is close but in a different cell.",
      tag: "search"
    },
    {
      q: "Dense Manhattan vs empty desert. Which adapts cell size?",
      choices: ["Fixed grid", "Quadtree", "Hash map", "Linked list"],
      answer: 1,
      why: "A quadtree splits busy areas into smaller cells and leaves empty areas coarse.",
      tag: "data-model"
    },
    {
      q: "200M places × 1 KB. Index size?",
      choices: ["About 200 GB", "About 2 TB", "About 20 GB", "About 200 MB"],
      answer: 0,
      why: "200M × 1 KB = 200 GB of place data; the geo index alone is much smaller.",
      tag: "estimation"
    },
    {
      q: "Writes are rare and reads huge. Scale reads by?",
      choices: ["Sharding writes", "Write-back cache", "Read replicas of the geo index", "Single primary only"],
      answer: 2,
      why: "Many replicas of a slowly changing index can serve high read QPS.",
      tag: "replication"
    },
    {
      q: "Popular searches like 'coffee near Times Square'?",
      choices: [
        "No caching possible",
        "Cache results by geohash cell + filters",
        "Precompute every lat/lng",
        "Store in cookies"
      ],
      answer: 1,
      why: "Rounding to a cell makes many users share the same cached result.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Mobile App", kind: "client", x: 180, y: 50 },
      { id: "lb", label: "Load Balancer", kind: "lb", x: 180, y: 145 },
      { id: "search", label: "Search Svc", kind: "service", x: 100, y: 240 },
      { id: "place", label: "Place Svc", kind: "service", x: 260, y: 240 },
      { id: "cache", label: "Result Cache", kind: "cache", x: 60, y: 335 },
      { id: "geo", label: "Geo Index", kind: "search", x: 180, y: 335 },
      { id: "db", label: "Places DB", kind: "db", x: 300, y: 335 },
      { id: "sync", label: "Index Sync", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "lb" },
      { from: "lb", to: "search" },
      { from: "lb", to: "place" },
      { from: "search", to: "cache" },
      { from: "search", to: "geo" },
      { from: "place", to: "db" },
      { from: "db", to: "sync", label: "changes" },
      { from: "sync", to: "geo" }
    ],
    steps: [
      { add: ["client", "lb"], caption: "Clients send their location, radius and filters." },
      {
        add: ["search", "geo"],
        caption: "The search service turns the location into geohash cells and queries a replicated geo index."
      },
      { add: ["place", "db"], caption: "Full place details and reviews come from the places database." },
      { add: ["sync"], caption: "Edits to places flow from the database into the geo index within minutes." },
      { add: ["cache"], caption: "Results for popular cells and filters are cached." }
    ]
  },
  modelAnswer: [
    { heading: "Requirements", body: "Radius search with filters over 200M places at 100k QPS; writes are rare." },
    {
      heading: "Spatial index",
      body: "Store a geohash (precision ~6, about 1 km cells) per place. For a query, compute the cell for the radius, include 8 neighbors, fetch candidates, and filter by exact distance."
    },
    {
      heading: "Alternative",
      body: "A quadtree held in memory adapts cell size to density; many systems use geohash in a search engine or a geo extension like PostGIS."
    },
    {
      heading: "Scale",
      body: "The index is read-heavy, so replicate it widely and shard by region if needed. Cache popular cell + filter combos."
    },
    {
      heading: "Updates",
      body: "Places live in a primary DB; change data capture updates the geo index asynchronously."
    }
  ],
  keyPoints: [
    "Explains why two-column range queries are slow",
    "Uses geohash or quadtree",
    "Searches neighboring cells",
    "Filters candidates by exact distance",
    "Estimates data size",
    "Replicates the read-heavy index",
    "Caches by cell and filters",
    "Updates the index asynchronously"
  ],
  cardIds: ["geohash", "quadtree", "read-replicas", "change-data-capture"]
};
