export default [
  { id: "sli-slo", front: "SLI, SLO, error budget", back: "An SLI is a measured signal (share of requests under 300 ms). An SLO is the target (99.9%). The error budget is the allowed miss, and spending it slows down risky launches.", tags: ["observability", "reliability"] },
  { id: "percentile-latency", front: "Why p99 instead of average latency?", back: "Averages hide the slow tail that real users feel. p99 means 1 in 100 requests is slower than this, and pages with many calls hit the tail often.", tags: ["observability"] },
  { id: "graceful-degradation", front: "Graceful degradation", back: "When a dependency fails, serve a reduced experience (cached data, hidden widget) instead of an error page. Decide in advance which features are optional.", tags: ["reliability"] },
  { id: "health-checks", front: "Liveness vs readiness checks", back: "Liveness asks 'is the process stuck?' and triggers a restart. Readiness asks 'can it take traffic now?' and removes it from the load balancer until ready.", tags: ["reliability", "load-balancing"] },
  { id: "bulkhead", front: "Bulkhead", back: "Give each dependency or tenant its own pool of threads or connections, so one slow part can't exhaust resources for everything else.", tags: ["reliability"] },
  { id: "distributed-tracing", front: "Distributed tracing", back: "A trace id is passed through every service a request touches, and each records a timed span. Lets you see which hop made a request slow.", tags: ["observability"] },
  { id: "checkpointing", front: "Checkpointing", back: "Periodically save progress (an offset, a snapshot) so a restarted worker resumes from there instead of starting over. Combine with idempotent writes to tolerate the replayed gap.", tags: ["reliability", "queues"] }
];
