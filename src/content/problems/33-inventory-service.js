export default {
  id: "inventory-service",
  title: "Design an Inventory Service",
  difficulty: "medium",
  minutes: 12,
  tags: ["consistency", "data-model", "caching"],
  prompt: "A retailer sells 5 million products from 200 warehouses, online and in stores. Stock levels change about 3,000 times a second from sales, returns and deliveries. The website shows 'in stock' and must not sell items that aren't there.",
  requirements: {
    functional: [
      "Track quantity per product per warehouse",
      "Reserve and release stock for orders",
      "Show availability on product pages",
      "Receive restocks and returns"
    ],
    nonFunctional: ["No overselling", "Product pages read availability in under 50 ms", "Audit every stock change"]
  },
  quiz: [
    {
      q: "Key for the stock table?",
      choices: ["product name", "order id", "timestamp", "(product_id, warehouse_id)"],
      answer: 3,
      why: "Stock is held per product in each location.",
      tag: "data-model"
    },
    {
      q: "Decrement stock safely?",
      choices: [
        "Read qty, subtract in code, write back",
        "UPDATE ... SET qty = qty - n WHERE qty >= n",
        "Delete the row",
        "Cache only"
      ],
      answer: 1,
      why: "The conditional update is atomic; read-modify-write races and oversells.",
      tag: "consistency"
    },
    {
      q: "Product pages show availability for millions of views. Read from?",
      choices: ["A cache of available counts, slightly stale", "Lock the stock row", "The audit log", "Ask the warehouse"],
      answer: 0,
      why: "Pages can be a bit stale; the reservation step enforces truth.",
      tag: "caching"
    },
    {
      q: "How to keep an audit of every change?",
      choices: ["Overwrite quantity only", "Weekly snapshot", "Append a movement record per change", "Logs at debug level"],
      answer: 2,
      why: "An append-only ledger of movements explains how every quantity was reached.",
      tag: "data-model"
    },
    {
      q: "A best seller gets 500 decrements/s on one row. Help?",
      choices: [
        "Bigger timeout",
        "Split stock into several sub-buckets and decrement any",
        "Remove the WHERE check",
        "Use a CDN"
      ],
      answer: 1,
      why: "Spreading one hot counter over buckets cuts lock contention.",
      tag: "scaling"
    },
    {
      q: "Checkout abandoned after reserving. Then?",
      choices: ["Stock is lost", "Charge the customer", "Close the warehouse", "Reservation expires and returns stock"],
      answer: 3,
      why: "Time-limited reservations prevent stock from getting stuck.",
      tag: "reliability"
    },
    {
      q: "Cache must reflect changes fast. Update it how?",
      choices: [
        "TTL of a week",
        "Never update",
        "Publish stock change events (CDC) that update the cache",
        "Restart the cache hourly"
      ],
      answer: 2,
      why: "Change events push fresh counts into the cache within seconds.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "web", label: "Product Page", kind: "client", x: 100, y: 50 },
      { id: "co", label: "Checkout", kind: "service", x: 260, y: 50 },
      { id: "inv", label: "Inventory API", kind: "service", x: 180, y: 145 },
      { id: "cache", label: "Avail Cache", kind: "cache", x: 100, y: 240 },
      { id: "db", label: "Stock DB", kind: "db", x: 260, y: 240 },
      { id: "ledger", label: "Movements Log", kind: "db", x: 100, y: 335 },
      { id: "cdc", label: "CDC Stream", kind: "queue", x: 260, y: 335 },
      { id: "wh", label: "Warehouse Sys", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "web", to: "cache" },
      { from: "co", to: "inv", label: "reserve" },
      { from: "inv", to: "db" },
      { from: "inv", to: "ledger" },
      { from: "db", to: "cdc" },
      { from: "cdc", to: "cache" },
      { from: "wh", to: "inv", label: "restock" }
    ],
    steps: [
      {
        add: ["co", "inv", "db"],
        caption: "Checkout reserves stock through the inventory API, which uses conditional updates."
      },
      { add: ["ledger"], caption: "Each change also writes a movement record for audit and reconciliation." },
      { add: ["wh"], caption: "Warehouse systems post deliveries, returns and corrections through the same API." },
      { add: ["cdc", "cache"], caption: "Stock changes stream into a cache of availability per product." },
      { add: ["web"], caption: "Product pages read availability only from the cache." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Per-warehouse stock with reservations, fast availability reads, no overselling, full audit. About 3k writes/s."
    },
    {
      heading: "Data model",
      body: "stock(product_id, warehouse_id, on_hand, reserved), reservations(id, order_id, items, expires_at), movements(id, product, warehouse, delta, reason, ref, time)."
    },
    {
      heading: "Writes",
      body: "Reserve with a conditional update (on_hand - reserved >= n) in a transaction that also inserts a movement. Release on cancel or expiry; commit to on_hand on shipment."
    },
    { heading: "Hot items", body: "Split popular items into a few sub-rows and pick one at random; sum for totals." },
    {
      heading: "Reads",
      body: "CDC publishes changes to a cache that product pages read. Shard the stock DB by product id as it grows."
    }
  ],
  keyPoints: [
    "Keys stock by product and warehouse",
    "Uses atomic conditional updates",
    "Keeps an append-only movement ledger",
    "Serves page reads from a cache fed by change events",
    "Expires abandoned reservations",
    "Handles hot items by splitting counters",
    "Considers sharding by product"
  ],
  cardIds: ["optimistic-locking", "change-data-capture", "hot-key", "event-sourcing"]
};
