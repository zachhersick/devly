export default {
  id: "hotel-reservations",
  title: "Design Hotel Reservations",
  difficulty: "medium",
  minutes: 13,
  tags: ["consistency", "data-model", "caching"],
  prompt: "A booking site lists 100,000 hotels with 5 million rooms. Users search availability for date ranges and book a room type. About 1 million searches and 50,000 bookings happen per day. Hotels allow a small amount of overbooking.",
  requirements: {
    functional: [
      "Search hotels with available rooms for dates",
      "Book a room type for a date range",
      "Cancel and modify bookings"
    ],
    nonFunctional: ["Never sell more rooms than allowed", "Search under 500 ms", "Bookings survive failures"]
  },
  quiz: [
    {
      q: "Track availability per?",
      choices: ["Individual room only", "Hotel per year", "Customer", "Hotel, room type and night"],
      answer: 3,
      why: "Guests book a type, not a room number; per-night counts make range checks simple.",
      tag: "data-model"
    },
    {
      q: "Booking 3 nights. Must check?",
      choices: ["Only the first night", "Inventory for every one of the 3 nights", "Only the last", "None"],
      answer: 1,
      why: "A booking needs a room every night, so all nights must have availability.",
      tag: "consistency"
    },
    {
      q: "Two users grab the last room at once. Prevent oversell?",
      choices: [
        "Conditional update: reserved < total in a transaction",
        "Check in the UI",
        "Last write wins",
        "Cache the count"
      ],
      answer: 0,
      why: "Atomic conditional updates on all nights in one transaction prevent overselling.",
      tag: "consistency"
    },
    {
      q: "Allow 10% overbooking. Where?",
      choices: ["In the UI", "Ignore it", "In the conditional check: reserved < total × 1.1", "In the search index"],
      answer: 2,
      why: "The limit becomes part of the same atomic check.",
      tag: "requirements"
    },
    {
      q: "Bookings are rare vs searches (20:1). Speed up search with?",
      choices: ["Locks on every search", "Cached availability, confirmed at booking time", "No cache", "Searching by email"],
      answer: 1,
      why: "Search can be slightly stale; the booking transaction is the real check.",
      tag: "caching"
    },
    {
      q: "Double click on 'Book'. Prevent duplicate bookings with?",
      choices: ["Disabling JavaScript", "Two databases", "A captcha", "An idempotency key from the client"],
      answer: 3,
      why: "The server returns the same booking for a repeated key.",
      tag: "api"
    },
    {
      q: "50k bookings/day. Is a sharded NoSQL store needed?",
      choices: ["Yes, it's huge", "Only a graph DB works", "No, a relational DB handles this easily", "Use a CDN"],
      answer: 2,
      why: "Under one write per second on average; correctness matters more than scale here.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "Traveler", kind: "client", x: 180, y: 50 },
      { id: "gw", label: "API Gateway", kind: "gateway", x: 180, y: 145 },
      { id: "search", label: "Search Svc", kind: "service", x: 100, y: 240 },
      { id: "book", label: "Booking Svc", kind: "service", x: 260, y: 240 },
      { id: "cache", label: "Avail Cache", kind: "cache", x: 100, y: 335 },
      { id: "db", label: "Inventory DB", kind: "db", x: 260, y: 335 },
      { id: "pay", label: "Payments", kind: "external", x: 100, y: 430 },
      { id: "q", label: "Events", kind: "queue", x: 260, y: 430 }
    ],
    edges: [
      { from: "user", to: "gw" },
      { from: "gw", to: "search" },
      { from: "gw", to: "book" },
      { from: "search", to: "cache" },
      { from: "book", to: "db" },
      { from: "book", to: "pay" },
      { from: "db", to: "q", label: "changes" },
      { from: "q", to: "cache" }
    ],
    steps: [
      { add: ["user", "gw"], caption: "Travelers search and book through a single gateway." },
      {
        add: ["book", "db"],
        caption: "The booking service updates per-night inventory rows in one transaction with a conditional check."
      },
      { add: ["pay"], caption: "Payment is taken while the reservation is held; failure releases the hold." },
      { add: ["search", "cache"], caption: "Search reads cached availability that may be seconds stale." },
      { add: ["q"], caption: "Inventory changes flow through events to refresh the cache." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Search date-range availability, book, cancel; never exceed allowed inventory. Small write volume, much higher read volume."
    },
    {
      heading: "Data model",
      body: "room_type_inventory(hotel_id, room_type_id, date, total, reserved) and reservations(id, hotel, room_type, start, end, status, idempotency_key)."
    },
    {
      heading: "Booking",
      body: "In one transaction, update reserved = reserved + 1 for each night WHERE reserved < total × overbook_factor. If any night fails, roll back. Insert the reservation as PENDING, take payment, then CONFIRM."
    },
    {
      heading: "Search",
      body: "Serve from a cache or search index of availability by hotel and date, refreshed from inventory change events. Recheck at booking."
    },
    {
      heading: "Reliability",
      body: "Idempotency keys stop duplicates. Pending holds expire. A relational DB with replicas is plenty; shard by hotel id if it grows."
    }
  ],
  keyPoints: [
    "Models inventory per room type per night",
    "Checks every night of the stay",
    "Uses atomic conditional updates or locks",
    "Builds overbooking into the check",
    "Caches availability for search but rechecks at booking",
    "Uses idempotency keys",
    "Recognizes the low write volume suits a relational DB"
  ],
  cardIds: ["acid", "optimistic-locking", "idempotency-key"]
};
