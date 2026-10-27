export default {
  id: "job-scheduler",
  title: "Design a Distributed Job Scheduler",
  difficulty: "hard",
  minutes: 15,
  tags: ["queues", "reliability", "consistency"],
  prompt: "Build a scheduler that runs jobs at set times or on cron schedules, like 'send invoices every day at 9am' or 'run this report in 2 hours'. It handles 100 million scheduled jobs and up to 50,000 job starts per second at the top of each hour.",
  requirements: {
    functional: [
      "Schedule one-off and recurring jobs",
      "Run each job on a worker at the right time",
      "Retries, timeouts and job status"
    ],
    nonFunctional: [
      "Jobs start within seconds of their time",
      "Each run happens once (no duplicates, no misses)",
      "Scheduler survives node failures"
    ]
  },
  quiz: [
    {
      q: "Find due jobs efficiently among 100M?",
      choices: [
        "Scan all jobs every second",
        "Index by next_run_time and poll small time buckets",
        "Ask each job",
        "Random checks"
      ],
      answer: 1,
      why: "Ordering by next run time means each tick only reads what's due.",
      tag: "data-model"
    },
    {
      q: "Several scheduler nodes poll at once. Avoid running a job twice?",
      choices: [
        "Hope timing differs",
        "Run on all nodes",
        "Use one node only forever",
        "Claim jobs atomically (conditional update or lease)"
      ],
      answer: 3,
      why: "A compare-and-set claim lets exactly one node take each run.",
      tag: "consistency"
    },
    {
      q: "Top-of-hour spike of 50k starts/s. Smooth it with?",
      choices: [
        "Run all inline in the scheduler",
        "Reject jobs",
        "Hand off due jobs to a queue that workers drain",
        "Delay all by a day"
      ],
      answer: 2,
      why: "Separating 'decide what's due' from 'execute' lets workers scale independently.",
      tag: "queues"
    },
    {
      q: "Worker crashes mid-job. Detect and retry by?",
      choices: ["Heartbeat/lease timeout, then requeue", "Wait forever", "Mark success", "Delete job"],
      answer: 0,
      why: "When a running job's lease lapses, it's assumed dead and retried.",
      tag: "reliability"
    },
    {
      q: "Retried jobs may run twice. Therefore jobs should be?",
      choices: ["Very long", "Secret", "Stateless forever", "Idempotent"],
      answer: 3,
      why: "At-least-once execution is practical; idempotent jobs make it safe.",
      tag: "consistency"
    },
    {
      q: "Recurring cron job: after a run, the scheduler should?",
      choices: ["Delete the job", "Compute and store the next run time", "Run it again immediately", "Ask the user"],
      answer: 1,
      why: "Updating next_run_time keeps recurring jobs flowing through the same index.",
      tag: "data-model"
    },
    {
      q: "Partition the job table by?",
      choices: ["Hash of job id, with each scheduler owning some partitions", "Owner name", "Creation month", "Job size"],
      answer: 0,
      why: "Spreading jobs evenly and assigning partitions avoids contention between schedulers.",
      tag: "sharding"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Job Submitter", kind: "client", x: 180, y: 50 },
      { id: "api", label: "Scheduler API", kind: "service", x: 180, y: 126 },
      { id: "db", label: "Jobs DB", kind: "db", x: 180, y: 202 },
      { id: "sched", label: "Schedulers", kind: "service", x: 100, y: 278 },
      { id: "coord", label: "Coordinator", kind: "db", x: 260, y: 278 },
      { id: "q", label: "Run Queue", kind: "queue", x: 180, y: 354 },
      { id: "w", label: "Workers", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "db" },
      { from: "sched", to: "db", label: "claim due" },
      { from: "sched", to: "coord", label: "partitions" },
      { from: "sched", to: "q" },
      { from: "q", to: "w" },
      { from: "w", to: "db", label: "status" }
    ],
    steps: [
      {
        add: ["client", "api", "db"],
        caption: "Jobs are stored with their schedule and next run time, indexed by that time."
      },
      {
        add: ["sched", "coord"],
        caption: "Scheduler nodes each own a set of partitions, assigned through a coordinator."
      },
      {
        add: ["q"],
        caption: "Every second, each scheduler claims due jobs in its partitions and pushes them to a run queue."
      },
      {
        add: ["w"],
        caption: "Workers execute jobs with timeouts and heartbeats, then record the result and next run time."
      }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Schedule one-off and cron jobs, start them on time at up to 50k/s, run each exactly once effectively, and tolerate failures."
    },
    {
      heading: "Storage",
      body: "jobs(id, schedule, next_run_time, status, attempt, payload) partitioned by hash of id, indexed by (partition, next_run_time)."
    },
    {
      heading: "Dispatch",
      body: "Partitions are leased to scheduler nodes. Each tick, a node selects due jobs, claims them with a conditional update (status SCHEDULED → QUEUED, version bump), and enqueues them."
    },
    {
      heading: "Execution",
      body: "Workers pull from the queue, heartbeat while running, and on completion set status and compute the next run for recurring jobs. Timeouts trigger retries with backoff and a max attempt count."
    },
    {
      heading: "Guarantees",
      body: "At-least-once execution with idempotent jobs (pass a run id). Missed runs after outages follow a policy: run once, run all, or skip."
    }
  ],
  keyPoints: [
    "Indexes jobs by next run time",
    "Claims jobs atomically to avoid duplicates",
    "Separates scheduling from execution with a queue",
    "Uses heartbeats or leases to detect dead workers",
    "Requires idempotent jobs",
    "Computes next run for recurring jobs",
    "Partitions jobs across scheduler nodes",
    "Defines a policy for missed runs"
  ],
  cardIds: ["delayed-delivery", "lease", "optimistic-locking", "retry-backoff"]
};
