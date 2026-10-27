export default {
  id: "unique-id-generator",
  title: "Design a Unique ID Generator",
  difficulty: "easy",
  minutes: 8,
  tags: ["data-model", "scaling", "reliability"],
  prompt: "Many services across several datacenters need unique 64-bit IDs for new records. Peak demand is 100,000 IDs per second. IDs should sort roughly by creation time and must never repeat, even if a server restarts.",
  requirements: {
    functional: [
      "Return a unique 64-bit numeric ID on request",
      "IDs roughly increase over time",
      "Works across multiple datacenters"
    ],
    nonFunctional: ["100k IDs per second at peak", "Sub-millisecond generation", "No single point of failure"]
  },
  quiz: [
    {
      q: "Why not just use a UUIDv4?",
      choices: [
        "They can repeat often",
        "They need a central server",
        "They are too slow to generate",
        "128 bits and random, so not time-sortable"
      ],
      answer: 3,
      why: "UUIDv4 is unique enough, but it's 128 bits and random, so it breaks the 64-bit and time-ordering requirements.",
      tag: "requirements"
    },
    {
      q: "One DB auto-increment for everyone. Main issue?",
      choices: ["IDs aren't numeric", "Single bottleneck and failure point", "IDs repeat", "It sorts too well"],
      answer: 1,
      why: "Every ID request hits one database, which caps throughput and takes everything down when it fails.",
      tag: "scaling"
    },
    {
      q: "Snowflake layout: what's in the 64 bits?",
      choices: ["Timestamp, machine id, sequence", "User id, random bits", "Hash of the record", "Datacenter name and date"],
      answer: 0,
      why: "Milliseconds since an epoch, a machine number and a per-millisecond counter give uniqueness without coordination.",
      tag: "data-model"
    },
    {
      q: "12-bit sequence per ms per machine. Max IDs/s per machine?",
      choices: ["4,096", "About 40,000", "About 4 million", "1,000"],
      answer: 2,
      why: "4,096 per millisecond × 1,000 ms ≈ 4.1 million IDs per second per machine.",
      tag: "estimation"
    },
    {
      q: "The server clock jumps backwards. Safest move?",
      choices: [
        "Ignore it",
        "Refuse or wait until the clock passes the last timestamp",
        "Reset the sequence to 0",
        "Use a random timestamp"
      ],
      answer: 1,
      why: "Generating with an older timestamp could repeat IDs already issued, so wait or error until time catches up.",
      tag: "reliability"
    },
    {
      q: "How do machines get unique machine ids?",
      choices: [
        "Pick a random number at boot",
        "Use the CPU count",
        "Hash the request",
        "Lease one from a coordination service like ZooKeeper"
      ],
      answer: 3,
      why: "A coordinator hands out and tracks machine numbers so two live nodes never share one.",
      tag: "consistency"
    },
    {
      q: "Alternative: each server reserves blocks of 1,000 ids from a DB. Downside?",
      choices: ["IDs can repeat", "Needs a GPU", "Gaps when a server dies, and only loose time order", "Every ID is a DB call"],
      answer: 2,
      why: "Unused ids in a crashed server's block are skipped, and servers hand out their blocks at different paces.",
      tag: "data-model"
    }
  ],
  diagram: {
    nodes: [
      { id: "svc", label: "App Service", kind: "service", x: 180, y: 50 },
      { id: "lb", label: "Load Balancer", kind: "lb", x: 180, y: 145 },
      { id: "gen1", label: "ID Gen 1", kind: "service", x: 60, y: 240 },
      { id: "gen2", label: "ID Gen 2", kind: "service", x: 180, y: 240 },
      { id: "gen3", label: "ID Gen 3", kind: "service", x: 300, y: 240 },
      { id: "coord", label: "Coordinator", kind: "db", x: 180, y: 335 },
      { id: "ntp", label: "NTP Clock", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "svc", to: "lb" },
      { from: "lb", to: "gen1" },
      { from: "lb", to: "gen2" },
      { from: "lb", to: "gen3" },
      { from: "gen1", to: "coord", label: "lease id" },
      { from: "gen2", to: "coord" },
      { from: "gen3", to: "coord" },
      { from: "gen1", to: "ntp" },
      { from: "gen3", to: "ntp" }
    ],
    steps: [
      {
        add: ["svc", "lb"],
        caption: "Services ask for IDs; often the generator is a library inside the service, but here it's a small shared tier."
      },
      {
        add: ["gen1", "gen2", "gen3"],
        caption: "Each generator builds IDs from time, its machine id and a counter, with no talk between them."
      },
      { add: ["coord"], caption: "A coordination service leases each generator a unique machine id at startup." },
      { add: ["ntp"], caption: "Clocks are synced with NTP, and generators refuse to go backwards in time." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Unique, 64-bit, roughly time-ordered IDs at 100k/s across datacenters, with no central bottleneck."
    },
    {
      heading: "Bit layout",
      body: "1 sign bit, 41 bits of milliseconds since a custom epoch (about 69 years), 10 bits of machine id (1,024 generators) and 12 bits of sequence (4,096 per ms)."
    },
    {
      heading: "Generation",
      body: "Within the same millisecond, increment the sequence; when it overflows, wait for the next millisecond. A new millisecond resets the sequence."
    },
    {
      heading: "Machine ids",
      body: "Lease machine ids from ZooKeeper or etcd so two live generators never share one. Optionally split the 10 bits into datacenter and worker."
    },
    {
      heading: "Clock safety",
      body: "Keep the last timestamp used. If the clock moves backwards, wait or return an error rather than risk duplicates."
    }
  ],
  keyPoints: [
    "Explains why UUIDv4 or one auto-increment DB fall short",
    "Describes the timestamp + machine id + sequence layout",
    "Does the per-machine throughput math",
    "Handles sequence overflow within a millisecond",
    "Handles clock moving backwards",
    "Assigns machine ids through a coordinator",
    "Notes IDs are roughly, not strictly, ordered across machines"
  ],
  cardIds: ["snowflake-id", "lease", "qps-math"]
};
