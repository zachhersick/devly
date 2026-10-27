export default {
  id: "object-storage",
  title: "Design S3-Style Object Storage",
  difficulty: "hard",
  minutes: 15,
  tags: ["storage", "replication", "reliability"],
  prompt: "Build an object store where users put and get files (objects) in buckets, from a few bytes to 5 TB. It holds 100 billion objects totalling 1 exabyte. Data must be extremely durable (eleven nines) while keeping storage cost low.",
  requirements: {
    functional: ["Create buckets; put, get, delete and list objects", "Multipart upload for large objects", "Object versioning"],
    nonFunctional: ["99.999999999% durability", "High throughput for large objects", "Low cost per GB"]
  },
  quiz: [
    {
      q: "Why separate metadata from data nodes?",
      choices: [
        "For style",
        "Small, queryable metadata and huge blobs scale differently",
        "Metadata is bigger",
        "Required by HTTP"
      ],
      answer: 1,
      why: "Metadata needs fast lookups and listing; data needs cheap, massive capacity.",
      tag: "storage"
    },
    {
      q: "3 full copies of 1 EB costs 3 EB. Cheaper durability?",
      choices: ["One copy only", "RAID 0", "Compress twice", "Erasure coding, e.g. 8 data + 4 parity chunks"],
      answer: 3,
      why: "8+4 erasure coding survives 4 lost chunks at 1.5× overhead instead of 3×.",
      tag: "storage"
    },
    {
      q: "Uploading a 5 TB file reliably?",
      choices: [
        "One giant PUT",
        "Email it",
        "Multipart: upload parts in parallel, then complete",
        "Split into 5 TB of tiny objects manually"
      ],
      answer: 2,
      why: "Parts can be retried independently and assembled at the end.",
      tag: "api"
    },
    {
      q: "Listing objects by prefix needs?",
      choices: [
        "Metadata sorted by bucket + key (range-partitioned)",
        "Scanning all data nodes",
        "A CDN",
        "Random sharding only"
      ],
      answer: 0,
      why: "Sorted keys make prefix listing a range scan.",
      tag: "data-model"
    },
    {
      q: "Silent disk corruption (bit rot). Detect with?",
      choices: ["Users report it", "Never happens", "Reboot disks", "Checksums verified on read and by background scrubbing"],
      answer: 3,
      why: "Scrubbers re-read data, verify checksums and repair from other chunks.",
      tag: "reliability"
    },
    {
      q: "Chunks of one object should be placed?",
      choices: [
        "All on one disk for speed",
        "On different disks, nodes and racks or zones",
        "In RAM",
        "Random including same disk"
      ],
      answer: 1,
      why: "Spreading across failure domains keeps correlated failures from losing data.",
      tag: "replication"
    },
    {
      q: "Overwriting a key while others read it. Readers see?",
      choices: [
        "Old or new object, never a mix: metadata points to whole versions",
        "A blend of bytes",
        "An error always",
        "Nothing"
      ],
      answer: 0,
      why: "Writes create a new immutable version; the metadata pointer flips atomically.",
      tag: "consistency"
    }
  ],
  diagram: {
    nodes: [
      { id: "client", label: "Client", kind: "client", x: 180, y: 50 },
      { id: "fe", label: "Front End API", kind: "gateway", x: 180, y: 126 },
      { id: "meta", label: "Metadata Svc", kind: "service", x: 100, y: 202 },
      { id: "place", label: "Placement Svc", kind: "service", x: 260, y: 202 },
      { id: "mdb", label: "Metadata DB", kind: "db", x: 180, y: 278 },
      { id: "d1", label: "Data Node", kind: "storage", x: 60, y: 354 },
      { id: "d2", label: "Data Node", kind: "storage", x: 180, y: 354 },
      { id: "d3", label: "Data Node", kind: "storage", x: 300, y: 354 },
      { id: "scrub", label: "Scrubber", kind: "worker", x: 180, y: 430 }
    ],
    edges: [
      { from: "client", to: "fe", label: "PUT/GET" },
      { from: "fe", to: "meta" },
      { from: "fe", to: "place" },
      { from: "meta", to: "mdb" },
      { from: "fe", to: "d1", label: "chunks" },
      { from: "fe", to: "d2" },
      { from: "fe", to: "d3" },
      { from: "scrub", to: "d1" },
      { from: "scrub", to: "d3" }
    ],
    steps: [
      {
        add: ["client", "fe"],
        caption: "Clients call a stateless front end that handles auth, routing and multipart uploads."
      },
      {
        add: ["place"],
        caption: "A placement service picks data nodes in different racks and zones for each object's chunks."
      },
      { add: ["d1", "d2", "d3"], caption: "The front end erasure-codes the object and writes chunks to those nodes." },
      {
        add: ["meta", "mdb"],
        caption: "Only after chunks are durable does it commit metadata: bucket, key, version, size, checksum, chunk locations."
      },
      { add: ["scrub"], caption: "Background scrubbers verify checksums and rebuild lost chunks from the survivors." }
    ]
  },
  modelAnswer: [
    {
      heading: "Requirements",
      body: "Bucket/object CRUD, multipart, versioning; eleven nines durability for an exabyte at low cost."
    },
    {
      heading: "Architecture",
      body: "Stateless API front ends; a metadata service on a sharded, replicated, range-partitioned store; a placement service; and many data nodes holding chunks on disks."
    },
    {
      heading: "Write path",
      body: "Split object into stripes, erasure code (e.g. 8+4), place chunks across failure domains, write and verify, then commit metadata atomically. Large objects use multipart."
    },
    {
      heading: "Read path",
      body: "Look up metadata, fetch any 8 of 12 chunks in parallel, verify checksums, decode and stream."
    },
    {
      heading: "Durability operations",
      body: "Scrub continuously, repair chunks when disks or nodes fail, and track repair speed, since durability depends on fixing faster than failures pile up."
    }
  ],
  keyPoints: [
    "Separates metadata and data planes",
    "Uses erasure coding to cut replication cost",
    "Places chunks across failure domains",
    "Supports multipart upload",
    "Commits metadata after data is durable",
    "Uses checksums and background scrubbing",
    "Partitions metadata to support prefix listing"
  ],
  cardIds: ["object-metadata-split", "range-vs-hash-partitioning", "merkle-tree", "availability-nines"]
};
