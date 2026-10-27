export default {
  id: "online-judge",
  title: "Design an Online Code Judge",
  difficulty: "medium",
  minutes: 13,
  tags: ["queues", "security", "scaling"],
  prompt: "A coding practice site runs users' submitted code against hidden test cases and returns pass or fail. Normally 500 submissions arrive per minute, but during weekly contests 50,000 people submit in the last 10 minutes. Code comes from strangers and may be malicious.",
  requirements: {
    functional: [
      "Submit code in several languages",
      "Run it against test cases with time and memory limits",
      "Show verdict and contest leaderboard"
    ],
    nonFunctional: [
      "Untrusted code must not escape or affect others",
      "Verdict in seconds normally, fair queueing in contests",
      "Results are deterministic"
    ]
  },
  quiz: [
    {
      q: "Why not run submissions on the web servers?",
      choices: [
        "Untrusted code could attack the servers and starve real traffic",
        "Web servers lack compilers",
        "It's faster",
        "Licensing"
      ],
      answer: 0,
      why: "Execution needs strong isolation and its own capacity pool.",
      tag: "security"
    },
    {
      q: "How is user code isolated?",
      choices: [
        "Run as root",
        "A separate thread",
        "Sandboxed containers or microVMs with no network and resource limits",
        "Trust the user"
      ],
      answer: 2,
      why: "Namespaces, seccomp, cgroups or microVMs block escape and cap CPU and memory.",
      tag: "security"
    },
    {
      q: "Contest spike handling?",
      choices: [
        "Reject submissions",
        "Queue submissions and autoscale judge workers",
        "Run them on users' laptops",
        "Process them next day"
      ],
      answer: 1,
      why: "A queue absorbs bursts while workers scale out; users see 'pending'.",
      tag: "queues"
    },
    {
      q: "Same code gets different time results across machines. Fix?",
      choices: [
        "Ignore it",
        "Give random limits",
        "Use the fastest machine only",
        "Use identical worker types and measure CPU time, not wall time"
      ],
      answer: 3,
      why: "Consistent hardware and CPU-time limits keep verdicts fair.",
      tag: "reliability"
    },
    {
      q: "How does the user learn the verdict?",
      choices: ["Email after an hour", "Reload page randomly", "Poll a status endpoint or get a push when done", "SMS"],
      answer: 2,
      why: "Async jobs pair naturally with polling or a pushed result.",
      tag: "api"
    },
    {
      q: "A worker crashes mid-judging. Then?",
      choices: [
        "Message reappears after visibility timeout and another worker reruns it",
        "Submission lost",
        "Mark as failed",
        "Restart the site"
      ],
      answer: 0,
      why: "Unacked queue messages return, and judging is safe to repeat.",
      tag: "reliability"
    },
    {
      q: "Contest leaderboard updates?",
      choices: [
        "Recompute from all submissions per page view",
        "Manually",
        "Once after contest only",
        "Update a sorted set when verdicts arrive"
      ],
      answer: 3,
      why: "Score updates on accepted verdicts keep rank lookups instant.",
      tag: "caching"
    }
  ],
  diagram: {
    nodes: [
      { id: "user", label: "Coder", kind: "client", x: 180, y: 50 },
      { id: "api", label: "Submit API", kind: "service", x: 180, y: 145 },
      { id: "db", label: "Submissions DB", kind: "db", x: 100, y: 240 },
      { id: "q", label: "Judge Queue", kind: "queue", x: 260, y: 240 },
      { id: "w1", label: "Sandbox Wkr", kind: "worker", x: 100, y: 335 },
      { id: "w2", label: "Sandbox Wkr", kind: "worker", x: 260, y: 335 },
      { id: "tests", label: "Test Cases", kind: "storage", x: 100, y: 430 },
      { id: "lb", label: "Leaderboard", kind: "cache", x: 260, y: 430 }
    ],
    edges: [
      { from: "user", to: "api" },
      { from: "api", to: "db" },
      { from: "api", to: "q" },
      { from: "q", to: "w1" },
      { from: "q", to: "w2" },
      { from: "w1", to: "tests" },
      { from: "w2", to: "tests" },
      { from: "w1", to: "db", label: "verdict" },
      { from: "w2", to: "lb" }
    ],
    steps: [
      {
        add: ["user", "api", "db"],
        caption: "Submissions are stored with status PENDING and the user gets an id to watch."
      },
      { add: ["q"], caption: "A queue holds judge jobs, absorbing contest spikes." },
      {
        add: ["w1", "w2"],
        caption: "Autoscaled workers run each job in a locked-down sandbox with CPU, memory and no network."
      },
      { add: ["tests"], caption: "Hidden test cases are fetched from protected storage and cached on workers." },
      { add: ["lb"], caption: "Verdicts update the submission and, in contests, the leaderboard." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Run untrusted code safely against tests, scale for contest spikes, return deterministic verdicts and rankings."
    },
    {
      heading: "Flow",
      body: "API stores the submission and enqueues a job. Workers pull jobs, compile and run in a sandbox per test, compare output, and write the verdict."
    },
    {
      heading: "Isolation",
      body: "Containers with seccomp and dropped capabilities, or microVMs; no network, read-only filesystem, cgroup CPU and memory limits, wall-clock kill switch."
    },
    {
      heading: "Scale and fairness",
      body: "Autoscale workers on queue depth; prewarm before contests. Contest jobs can get a dedicated queue. Use one machine type and CPU-time limits for fairness."
    },
    {
      heading: "Results",
      body: "Clients poll or receive a push. Accepted contest submissions update a sorted-set leaderboard with penalty time."
    }
  ],
  keyPoints: [
    "Isolates untrusted code in sandboxes",
    "Blocks network and caps resources",
    "Queues jobs and autoscales workers",
    "Keeps timing fair and deterministic",
    "Retries safely after worker crashes",
    "Returns verdicts asynchronously",
    "Maintains a live leaderboard"
  ],
  cardIds: ["bulkhead", "backpressure", "sorted-set"]
};
