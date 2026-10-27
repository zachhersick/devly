export default [
  { id: "qps-math", front: "Daily requests to QPS, fast", back: "A day has about 86,400 seconds, so call it 100k. 1 million requests a day is roughly 10 per second on average; multiply by 2–5 for peak.", tags: ["estimation"] },
  { id: "storage-math", front: "Estimating storage", back: "Items per day × bytes per item × days of retention × replication factor. 1M items/day at 1 KB is 1 GB/day, about 365 GB a year before replication.", tags: ["estimation", "storage"] },
  { id: "latency-numbers", front: "Latency ballpark numbers", back: "Memory read: ~100 ns. SSD random read: ~100 µs. Same-datacenter round trip: ~0.5 ms. Cross-continent round trip: ~100 ms. Network across the world dominates everything else.", tags: ["estimation"] },
  { id: "read-write-ratio", front: "Why ask about the read/write ratio?", back: "Read-heavy systems (100:1) lean on caches and replicas. Write-heavy systems need partitioning, append-only storage and queues. The ratio picks the architecture.", tags: ["estimation", "requirements"] },
  { id: "availability-nines", front: "What do the nines allow?", back: "99.9% allows about 8.8 hours of downtime a year; 99.99% about 53 minutes; 99.999% about 5 minutes. Each extra nine costs a lot more redundancy.", tags: ["estimation", "reliability"] },
  { id: "bandwidth-math", front: "Estimating bandwidth", back: "Peak requests per second × average response size. 10k req/s of 100 KB images is 1 GB/s, which is why large media goes through a CDN.", tags: ["estimation", "scaling"] }
];
