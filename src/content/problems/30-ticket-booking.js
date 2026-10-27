export default {
  id: "ticket-booking",
  title: "Design Concert Ticket Booking",
  difficulty: "medium",
  minutes: 14,
  tags: ["consistency", "queues", "scaling"],
  prompt: "When tickets for a superstar's tour go on sale, 5 million fans show up for 50,000 seats in the first minute. Fans pick specific seats on a map, hold them for 10 minutes, and pay. No seat can ever be sold twice.",
  requirements: {
    functional: [
      "Show a seat map with live availability",
      "Hold chosen seats for 10 minutes",
      "Pay to confirm, or release on timeout"
    ],
    nonFunctional: ["Never double-sell a seat", "Stay up under a 100× traffic spike", "Fair to fans, hostile to bots"]
  },
  quiz: [
    {
      q: "5M fans, 50k seats. Biggest risk?",
      choices: ["The surge overwhelms booking services", "Not enough seats in the DB", "Slow seat images", "Time zones"],
      answer: 0,
      why: "The spike is the problem; most users will never get a seat but still hit the system.",
      tag: "requirements"
    },
    {
      q: "How to protect the booking system from the surge?",
      choices: ["Let everyone in", "Bigger DB", "A virtual waiting room that admits users at a controlled rate", "Close sales"],
      answer: 2,
      why: "A queue in front lets a manageable number of users shop at once.",
      tag: "queues"
    },
    {
      q: "Hold a seat for 10 minutes. Implement with?",
      choices: [
        "A sticky note",
        "Seat status HELD with expires_at, set atomically",
        "Browser localStorage",
        "Cron that runs weekly"
      ],
      answer: 1,
      why: "A conditional update from AVAILABLE to HELD with an expiry is atomic and self-releasing.",
      tag: "consistency"
    },
    {
      q: "Two fans click the same seat. Who wins?",
      choices: [
        "Both get it",
        "The richer one",
        "Random later",
        "UPDATE ... WHERE status = 'AVAILABLE'; only one row update succeeds"
      ],
      answer: 3,
      why: "The database condition guarantees one winner; the other gets 'seat taken'.",
      tag: "consistency"
    },
    {
      q: "Live seat map for thousands of shoppers?",
      choices: [
        "Each polls the DB every 100 ms",
        "No map",
        "Cached map pushed or polled every few seconds, confirmed at hold",
        "Email it"
      ],
      answer: 2,
      why: "The map can be slightly stale; the hold step is the true check.",
      tag: "caching"
    },
    {
      q: "Bots grab seats. Mitigate with?",
      choices: [
        "Verified accounts, per-user limits and bot detection in the queue",
        "Nothing",
        "Faster servers",
        "Shorter holds only"
      ],
      answer: 0,
      why: "Admission control is a good choke point for checks and purchase limits.",
      tag: "security"
    },
    {
      q: "Payment succeeded but confirm call timed out. Then?",
      choices: ["Charge again", "Release the seat", "Ignore", "Confirm idempotently with the payment id; reconcile if needed"],
      answer: 3,
      why: "Retrying the confirm with the same key is safe; reconciliation catches stragglers.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "fan", label: "Fan Browser", kind: "client", x: 180, y: 50 },
      { id: "cdn", label: "CDN", kind: "cdn", x: 100, y: 145 },
      { id: "wait", label: "Waiting Room", kind: "gateway", x: 260, y: 145 },
      { id: "map", label: "Seat Map Svc", kind: "service", x: 100, y: 240 },
      { id: "book", label: "Booking Svc", kind: "service", x: 260, y: 240 },
      { id: "cache", label: "Seat Cache", kind: "cache", x: 100, y: 335 },
      { id: "db", label: "Seats DB", kind: "db", x: 260, y: 335 },
      { id: "pay", label: "Payments", kind: "external", x: 100, y: 430 },
      { id: "exp", label: "Hold Expirer", kind: "worker", x: 260, y: 430 }
    ],
    edges: [
      { from: "fan", to: "cdn", label: "static" },
      { from: "fan", to: "wait" },
      { from: "wait", to: "map" },
      { from: "wait", to: "book" },
      { from: "map", to: "cache" },
      { from: "book", to: "db" },
      { from: "book", to: "pay" },
      { from: "exp", to: "db" },
      { from: "db", to: "cache", label: "changes" }
    ],
    steps: [
      { add: ["fan", "cdn"], caption: "Static pages and assets come from a CDN so the surge doesn't hit origin." },
      {
        add: ["wait"],
        caption: "A waiting room issues signed tokens that admit fans at a rate the system can handle."
      },
      { add: ["map", "cache"], caption: "Admitted fans see a cached seat map, refreshed every couple of seconds." },
      {
        add: ["book", "db"],
        caption: "Holding a seat is an atomic conditional update in the seats DB; only one fan can win."
      },
      { add: ["pay", "exp"], caption: "Payment confirms the hold; an expirer frees unpaid holds after 10 minutes." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Seat-level selection, 10-minute holds, payment, zero double sales, and survival under a massive spike."
    },
    {
      heading: "Admission",
      body: "A virtual waiting room (served from the edge) places fans in a queue and admits them with signed tokens at a controlled rate; bot checks and per-account limits happen here."
    },
    {
      heading: "Holds",
      body: "seats(event_id, seat_id, status, holder, expires_at, version). Hold = UPDATE SET status=HELD WHERE status=AVAILABLE OR expires_at < now(). The row count says if you won."
    },
    {
      heading: "Payment",
      body: "Pay with an idempotency key; on success set SOLD where holder matches. An expirer job (or lazy check) releases expired holds."
    },
    {
      heading: "Reads",
      body: "Seat maps are served from a cache updated by change events, so thousands of viewers don't hit the DB."
    }
  ],
  keyPoints: [
    "Identifies the surge as the core challenge",
    "Uses a virtual waiting room or admission queue",
    "Holds seats with an expiry",
    "Uses atomic conditional updates to prevent double sale",
    "Serves seat maps from a cache",
    "Makes payment confirmation idempotent",
    "Addresses bots and purchase limits"
  ],
  cardIds: ["optimistic-locking", "lease", "backpressure", "idempotency-key"]
};
