export default {
  id: "parking-reservations",
  title: "Design Parking Reservations",
  difficulty: "easy",
  minutes: 8,
  tags: ["consistency", "data-model", "api"],
  prompt: "A city app lets drivers reserve a parking spot in one of 2,000 garages for a time slot and pay up front. There are 300,000 spots in total and about 500,000 bookings a day. Two drivers must never get the same spot for overlapping times.",
  requirements: {
    functional: [
      "Search garages near a location with free spots for a time range",
      "Reserve and pay for a spot",
      "Cancel a reservation",
      "Gate checks the reservation on arrival"
    ],
    nonFunctional: ["No double booking", "Search under 300 ms", "Gates work even with flaky network"]
  },
  quiz: [
    {
      q: "Which data store fits reservations best?",
      choices: ["A relational DB with transactions", "A CDN", "A log file", "An in-memory cache only"],
      answer: 0,
      why: "Bookings need constraints and transactions to prevent overlaps; the data is modest in size.",
      tag: "data-model"
    },
    {
      q: "How to prevent two overlapping bookings for one spot?",
      choices: [
        "Check in app code, then insert",
        "Hope it's rare",
        "Transaction with a lock or an exclusion constraint on spot + time range",
        "Booking ids with timestamps"
      ],
      answer: 2,
      why: "Check-then-insert races. The database must enforce it atomically, e.g. a lock on the spot or an overlap constraint.",
      tag: "consistency"
    },
    {
      q: "Does the driver need a specific spot or any spot?",
      choices: ["Always a specific one", "Any spot of the type, assigned at booking", "None", "Only the cheapest"],
      answer: 1,
      why: "Booking 'a spot in garage X' and assigning a free one keeps searches simple and fills gaps well.",
      tag: "requirements"
    },
    {
      q: "500k bookings/day. Peak writes/s if peak is 5× average?",
      choices: ["About 3,000", "About 300", "About 30,000", "About 30"],
      answer: 3,
      why: "500k ÷ 86,400 ≈ 6 per second average; × 5 ≈ 30 per second, easy for one database.",
      tag: "estimation"
    },
    {
      q: "Payment fails after the spot is held. Then?",
      choices: ["Keep the hold forever", "Charge twice", "Release the hold after a short timeout", "Assign another spot"],
      answer: 2,
      why: "Hold the spot with an expiry (say 10 minutes). If payment doesn't complete, the hold lapses.",
      tag: "reliability"
    },
    {
      q: "Gate loses network. How does it verify cars?",
      choices: [
        "Uses a synced local list or verifies a signed QR code offline",
        "Opens for everyone",
        "Stays closed",
        "Calls the driver"
      ],
      answer: 0,
      why: "A signed token can be checked without the server, and a cached list of today's bookings is a backup.",
      tag: "security"
    },
    {
      q: "Retrying the reserve call shouldn't book twice. Use?",
      choices: ["A bigger timeout", "A second server", "GET instead of POST", "An idempotency key per booking attempt"],
      answer: 3,
      why: "The server stores the key with the result, so a retry returns the original booking.",
      tag: "api"
    }
  ],
  diagram: {
    nodes: [
      { id: "driver", label: "Driver App", kind: "client", x: 100, y: 50 },
      { id: "gate", label: "Garage Gate", kind: "client", x: 260, y: 50 },
      { id: "gw", label: "API Gateway", kind: "gateway", x: 180, y: 145 },
      { id: "search", label: "Search Svc", kind: "service", x: 100, y: 240 },
      { id: "book", label: "Booking Svc", kind: "service", x: 260, y: 240 },
      { id: "cache", label: "Avail Cache", kind: "cache", x: 100, y: 335 },
      { id: "db", label: "Bookings DB", kind: "db", x: 260, y: 335 },
      { id: "pay", label: "Payments", kind: "external", x: 180, y: 430 }
    ],
    edges: [
      { from: "driver", to: "gw" },
      { from: "gate", to: "gw", label: "verify" },
      { from: "gw", to: "search" },
      { from: "gw", to: "book" },
      { from: "search", to: "cache" },
      { from: "book", to: "db" },
      { from: "book", to: "pay" },
      { from: "book", to: "cache", label: "update" }
    ],
    steps: [
      { add: ["driver", "gw"], caption: "Drivers and garage gates call one API gateway that handles auth." },
      {
        add: ["book", "db"],
        caption: "The booking service reserves a spot inside a transaction so overlapping times are impossible."
      },
      { add: ["pay"], caption: "It holds the spot with an expiry while the payment provider charges the driver." },
      {
        add: ["search", "cache"],
        caption: "Search reads cached free-spot counts per garage and time slot, refreshed on each booking."
      },
      { add: ["gate"], caption: "Gates verify a signed QR code, working offline if the network drops." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Search, reserve, pay, cancel and verify at the gate. The must-have is no double booking; traffic is small."
    },
    {
      heading: "Data model",
      body: "garages, spots(garage_id, type), reservations(spot_id, start, end, status, expires_at). An exclusion constraint (or lock on the spot row) blocks overlapping active reservations."
    },
    {
      heading: "Booking flow",
      body: "Pick a free spot in the garage, insert a HELD reservation in a transaction, charge the card, then mark it CONFIRMED. Unpaid holds expire."
    },
    {
      heading: "Search",
      body: "Keep per-garage, per-hour free counts in a cache updated on each booking; confirm the real spot inside the transaction."
    },
    {
      heading: "Gate",
      body: "The confirmation includes a signed QR code with spot and time. Gates verify the signature offline and sync used codes later."
    }
  ],
  keyPoints: [
    "Uses a transactional DB to enforce no overlaps",
    "Avoids check-then-insert races",
    "Holds a spot with a timeout during payment",
    "Estimates low write volume and keeps it simple",
    "Caches availability for fast search",
    "Uses idempotency keys on booking",
    "Lets gates work offline with signed codes"
  ],
  cardIds: ["acid", "pessimistic-locking", "idempotency-key", "hmac-signing"]
};
