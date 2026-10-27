export default {
  id: "polling-voting",
  title: "Design a Live Poll",
  difficulty: "easy",
  minutes: 8,
  tags: ["realtime", "consistency", "scaling"],
  prompt: "A TV show runs a live poll during the broadcast: 10 million viewers can vote once each within a 2-minute window, and everyone sees results update live. Peak traffic is around 200,000 votes per second.",
  requirements: {
    functional: [
      "Each signed-in user votes once per poll",
      "Show live running totals",
      "Close the poll at a set time and publish final results"
    ],
    nonFunctional: ["Absorb 200k votes per second", "No double votes", "Final totals must be exact"]
  },
  quiz: [
    {
      q: "What's the hardest part of this system?",
      choices: ["Storing poll questions", "User profile pages", "A huge burst of writes in two minutes", "Choosing colors"],
      answer: 2,
      why: "Nearly all traffic arrives in a short window, so the write path must absorb a spike far above average.",
      tag: "requirements"
    },
    {
      q: "One counter row per option in SQL. Problem?",
      choices: ["Every vote fights for the same row lock", "Counts are wrong", "SQL can't add", "Rows are too big"],
      answer: 0,
      why: "A single hot row serializes all updates. Split counters or aggregate in batches instead.",
      tag: "scaling"
    },
    {
      q: "How to stop double votes?",
      choices: ["Trust a cookie", "Rate limit by IP", "Hide the button after voting", "Unique key on (poll_id, user_id)"],
      answer: 3,
      why: "A uniqueness constraint (or set-if-absent in Redis) on poll + user makes a second vote a no-op.",
      tag: "consistency"
    },
    {
      q: "Fast path for a vote?",
      choices: [
        "Wait for all replicas in 3 regions",
        "Write to a queue, ack, count asynchronously",
        "Email the vote",
        "Recalculate totals on each vote"
      ],
      answer: 1,
      why: "Accept the vote into a durable queue quickly; consumers dedupe and count in the background.",
      tag: "queues"
    },
    {
      q: "How do 10M viewers see live totals?",
      choices: [
        "Push aggregated totals once a second via a CDN or stream",
        "Each polls the DB every 100 ms",
        "Send every vote to every viewer",
        "Refresh the page"
      ],
      answer: 0,
      why: "Viewers only need a snapshot every second or so, computed once and fanned out cheaply.",
      tag: "realtime"
    },
    {
      q: "Live counts are approximate. Final result?",
      choices: [
        "Use the live number as-is",
        "Pick the leader at 1 minute",
        "Recount from the deduplicated vote log after close",
        "Average both"
      ],
      answer: 2,
      why: "Show fast approximate totals during the poll, then publish an exact count from the stored votes.",
      tag: "consistency"
    },
    {
      q: "200k/s for 120 s. Votes to store?",
      choices: ["About 2.4 million", "About 24 million", "About 240,000", "About 2.4 billion"],
      answer: 1,
      why: "200,000 × 120 = 24 million votes at most, small enough for a queue and one counting job.",
      tag: "estimation"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Viewer App", kind: "client", x: 180, y: 50 },
      { id: "lb", label: "Load Balancer", kind: "lb", x: 180, y: 126 },
      { id: "vote", label: "Vote API", kind: "service", x: 180, y: 202 },
      { id: "dedupe", label: "Voted Set", kind: "cache", x: 100, y: 278 },
      { id: "q", label: "Vote Queue", kind: "queue", x: 260, y: 278 },
      { id: "agg", label: "Counter", kind: "worker", x: 100, y: 354 },
      { id: "db", label: "Votes DB", kind: "db", x: 260, y: 354 },
      { id: "cdn", label: "Results CDN", kind: "cdn", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "lb", label: "vote" },
      { from: "lb", to: "vote" },
      { from: "vote", to: "dedupe", label: "SETNX" },
      { from: "vote", to: "q" },
      { from: "q", to: "agg" },
      { from: "agg", to: "db" },
      { from: "agg", to: "cdn", label: "totals" },
      { from: "cdn", to: "client" }
    ],
    steps: [
      { add: ["client", "lb", "vote"], caption: "A stateless vote API scales out to take the burst." },
      {
        add: ["dedupe"],
        caption: "Before accepting, it does an atomic set-if-absent on poll + user to reject repeat votes."
      },
      { add: ["q"], caption: "Accepted votes go into a durable queue so the API can reply instantly." },
      {
        add: ["agg", "db"],
        caption: "Counter workers batch votes into per-option totals and store each vote for the final recount."
      },
      {
        add: ["cdn"],
        caption: "Once a second the totals are published to a CDN that millions of viewers poll cheaply."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "One vote per user, live totals, exact final results, all under a 200k/s spike lasting two minutes."
    },
    {
      heading: "Write path",
      body: "API checks auth, does SETNX voted:{poll}:{user} in Redis, then enqueues the vote and returns 202. Duplicates get a friendly 'already voted'."
    },
    {
      heading: "Counting",
      body: "Workers consume in batches and increment sharded counters (option × shard), avoiding one hot row. They also persist each vote with a unique (poll, user) key."
    },
    {
      heading: "Reading",
      body: "A job sums counters every second and writes a small JSON file to a CDN. Clients poll it or receive it over a stream."
    },
    {
      heading: "Final result",
      body: "After the window closes and the queue drains, recount from the votes table and publish the official result."
    }
  ],
  keyPoints: [
    "Recognizes the short, extreme write spike",
    "Deduplicates by (poll, user) with an atomic check",
    "Uses a queue to absorb the burst",
    "Avoids a single hot counter row with sharded counters or batching",
    "Serves live totals as a cached snapshot, not per-vote pushes",
    "Separates approximate live counts from an exact final recount",
    "Estimates total votes stored"
  ],
  cardIds: ["hot-key", "delivery-semantics", "idempotency-key", "backpressure"]
};
