export default {
  id: "flash-sale",
  title: "Design a Flash Sale with Coupons",
  difficulty: "medium",
  minutes: 13,
  tags: ["consistency", "caching", "scaling"],
  prompt: "A shop runs a flash sale: 10,000 discounted phones and 100,000 single-use coupons go live at noon. About 2 million users hit 'Buy' within the first 10 seconds. Each user may buy one phone and redeem each coupon only once.",
  requirements: {
    functional: [
      "Sell limited stock at a sale price starting at a set time",
      "Redeem single-use coupon codes",
      "One purchase per user"
    ],
    nonFunctional: ["Never sell more than 10,000 units", "Never redeem a coupon twice", "Stay up under a 200k requests/s spike"]
  },
  quiz: [
    {
      q: "2M requests in 10 s. Peak rate?",
      choices: ["About 200k/s", "About 20k/s", "About 2k/s", "About 2M/s"],
      answer: 0,
      why: "2,000,000 ÷ 10 = 200,000 requests a second, mostly from people who won't get a phone.",
      tag: "estimation"
    },
    {
      q: "Fastest safe stock counter?",
      choices: [
        "SQL row with SELECT then UPDATE in code",
        "Count rows in the orders table per request",
        "Atomic decrement in Redis, rejecting when it hits zero",
        "Client-side counter"
      ],
      answer: 2,
      why: "An atomic DECR (or Lua script) in memory handles huge rates and never goes below zero.",
      tag: "consistency"
    },
    {
      q: "After Redis says 'you got one', what next?",
      choices: [
        "Nothing, Redis is the record",
        "Write the order asynchronously via a queue to the DB",
        "Restart the counter",
        "Ask the user to wait an hour"
      ],
      answer: 1,
      why: "Redis gates the rush; a queue lets the order DB persist winners at a steady pace.",
      tag: "queues"
    },
    {
      q: "Enforce one phone per user?",
      choices: [
        "Check the order table after payment",
        "Trust the client",
        "Limit by IP address only",
        "Atomic set-if-absent on user id in the same script"
      ],
      answer: 3,
      why: "Doing the user check and the decrement together in one atomic script prevents races.",
      tag: "consistency"
    },
    {
      q: "Coupon used once only. Best guard?",
      choices: [
        "Check, then update in two calls",
        "Cache the coupon for an hour",
        "Conditional update: status UNUSED → USED for that code",
        "Mark used at shipping"
      ],
      answer: 2,
      why: "A single conditional write means only one redemption can succeed.",
      tag: "consistency"
    },
    {
      q: "Most of the 2M requests will fail. Cheap rejection by?",
      choices: [
        "Reject at the edge once a 'sold out' flag is set",
        "Let each hit the DB",
        "Queue them all for an hour",
        "Return 500"
      ],
      answer: 0,
      why: "Once stock is gone, a cached sold-out flag at the gateway or CDN turns away the rest instantly.",
      tag: "caching"
    },
    {
      q: "Winners don't pay in 15 min. Then?",
      choices: [
        "Keep the units locked forever",
        "Charge them a fee",
        "Cancel the whole sale",
        "Return units to stock by incrementing the counter"
      ],
      answer: 3,
      why: "Release unpaid units so others can buy them.",
      tag: "reliability"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "Shopper", kind: "client", x: 180, y: 50 },
      { id: "edge", label: "Edge / Gateway", kind: "gateway", x: 180, y: 126 },
      { id: "sale", label: "Sale Service", kind: "service", x: 180, y: 202 },
      { id: "redis", label: "Stock Counter", kind: "cache", x: 100, y: 278 },
      { id: "coupons", label: "Coupons DB", kind: "db", x: 260, y: 278 },
      { id: "q", label: "Order Queue", kind: "queue", x: 180, y: 354 },
      { id: "writer", label: "Order Writer", kind: "worker", x: 100, y: 430 },
      { id: "db", label: "Orders DB", kind: "db", x: 260, y: 430 }
    ],
    edges: [
      { from: "user", to: "edge" },
      { from: "edge", to: "sale" },
      { from: "sale", to: "redis", label: "DECR" },
      { from: "sale", to: "coupons" },
      { from: "sale", to: "q", label: "winner" },
      { from: "q", to: "writer" },
      { from: "writer", to: "db" }
    ],
    steps: [
      {
        add: ["user", "edge"],
        caption: "The edge serves the sale page and turns users away instantly once a sold-out flag is set."
      },
      {
        add: ["sale", "redis"],
        caption: "The sale service runs one atomic script: check user hasn't bought, decrement stock if above zero."
      },
      { add: ["coupons"], caption: "Coupon codes are redeemed with a conditional update so each works once." },
      {
        add: ["q", "writer", "db"],
        caption: "Winners are queued and written to the order DB at a steady rate, then sent to payment."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Sell exactly 10,000 units and honor single-use coupons under a 200k/s burst, one per user."
    },
    {
      heading: "Gatekeeping",
      body: "Pre-load stock into Redis. A Lua script checks a per-user bought set, decrements stock if positive and records the user, all atomically. Zero sets a sold-out flag pushed to the edge."
    },
    {
      heading: "Persisting",
      body: "Winners are put on a queue; workers create orders in the DB with an idempotency key and start a 15-minute payment window."
    },
    {
      heading: "Coupons",
      body: "coupons(code, status, user, order). Redemption is UPDATE ... SET status=USED WHERE code=? AND status=UNUSED, checked inside the order transaction."
    },
    {
      heading: "Cleanup",
      body: "Unpaid orders expire, increment the counter back and clear the user's mark. A reconciliation job compares Redis with the DB after the sale."
    }
  ],
  keyPoints: [
    "Computes the ~200k/s spike",
    "Uses an atomic in-memory counter for stock",
    "Combines per-user limit and decrement atomically",
    "Queues winners to protect the DB",
    "Uses conditional updates for coupons",
    "Rejects early at the edge once sold out",
    "Returns unpaid stock",
    "Reconciles cache and DB afterwards"
  ],
  cardIds: ["hot-key", "backpressure", "optimistic-locking", "idempotency-key"]
};
