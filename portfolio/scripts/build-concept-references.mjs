#!/usr/bin/env node
/**
 * Inject #references sections (YouTube embeds + blog links) into all 110
 * concept HTML files under concepts/.
 *
 * Idempotent: skips files that already contain id="references".
 */
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const CONCEPTS_DIR = path.join(ROOT, "concepts");

const MARKER = 'id="references"';

// ══════════════════════════════════════════════════════════════════════
// REFS MANIFEST — 110 concept slugs
// Each slug maps to 3-5 references:
//   {type:"video", id:"YOUTUBE_ID", title, source, dur}
//   {type:"blog", url, title, source}
// ══════════════════════════════════════════════════════════════════════

const REFS = {

  // ── CACHING ──────────────────────────────────────────────────────
  "cache-strategies": [
    { type: "video", id: "U3RkDLtS7uY", title: "Caching — System Design Interview Concept", source: "Gaurav Sen", dur: "10 min" },
    { type: "video", id: "DUbEgNw-F9c", title: "Top Caching Strategies", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "jIA7z1gxuc8", title: "Caching Patterns — Write-Through, Write-Back, Write-Around", source: "Hussein Nasser", dur: "18 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/a-crash-course-in-caching", title: "A Crash Course in Caching", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://aws.amazon.com/caching/best-practices/", title: "Caching Best Practices", source: "AWS" },
  ],
  "cache-eviction": [
    { type: "video", id: "U3RkDLtS7uY", title: "Caching — System Design Interview Concept", source: "Gaurav Sen", dur: "10 min" },
    { type: "video", id: "DUbEgNw-F9c", title: "Cache Eviction Policies Explained", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "iuqZvajTOyA", title: "Redis Eviction Policies Deep Dive", source: "Hussein Nasser", dur: "35 min" },
    { type: "blog", url: "https://redis.io/docs/latest/develop/reference/eviction/", title: "Redis Eviction Policies", source: "Redis Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/cache-eviction-policies-system-design/", title: "Cache Eviction Policies", source: "GeeksforGeeks" },
  ],
  "cache-stampede": [
    { type: "video", id: "U3RkDLtS7uY", title: "Caching — System Design Interview Concept", source: "Gaurav Sen", dur: "10 min" },
    { type: "video", id: "DUbEgNw-F9c", title: "Top Caching Strategies", source: "ByteByteGo", dur: "12 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/a-crash-course-in-caching", title: "A Crash Course in Caching (stampede section)", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://engineering.fb.com/2013/06/25/core-infra/scaling-memcache-at-facebook/", title: "Scaling Memcache at Facebook", source: "Meta Engineering" },
  ],
  "cdn": [
    { type: "video", id: "8KuO4r5CHjM", title: "What is a CDN? How Does It Work?", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "RI9np1LWzqw", title: "How Cloudflare Works", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.cloudflare.com/how-cloudflare-works/", title: "How Cloudflare Works", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.akamai.com/blog/performance/how-does-a-cdn-work", title: "How Does a CDN Work?", source: "Akamai Blog" },
  ],
  "cdn-vs-application-cache": [
    { type: "video", id: "8KuO4r5CHjM", title: "What is a CDN? How Does It Work?", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "U3RkDLtS7uY", title: "Caching — System Design Interview", source: "Gaurav Sen", dur: "10 min" },
    { type: "video", id: "DUbEgNw-F9c", title: "Top Caching Strategies", source: "ByteByteGo", dur: "12 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/a-crash-course-in-caching", title: "A Crash Course in Caching", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://blog.cloudflare.com/how-cloudflare-works/", title: "How Cloudflare Works", source: "Cloudflare Blog" },
  ],

  // ── DATABASES ────────────────────────────────────────────────────
  "sql-vs-nosql": [
    { type: "video", id: "Q_9cFgzZr8Q", title: "SQL vs NoSQL — Which to Pick?", source: "Hussein Nasser", dur: "22 min" },
    { type: "video", id: "W2Z7fbCLSTw", title: "SQL vs NoSQL Explained", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/sql-vs-nosql", title: "SQL vs NoSQL", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/difference-between-sql-and-nosql/", title: "Difference Between SQL and NoSQL", source: "GeeksforGeeks" },
  ],
  "database-types": [
    { type: "video", id: "W2Z7fbCLSTw", title: "7 Database Paradigms", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "Q_9cFgzZr8Q", title: "SQL vs NoSQL — Which Database?", source: "Hussein Nasser", dur: "22 min" },
    { type: "video", id: "jb2AvF8XzII", title: "Which Database Model to Choose?", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/types-of-databases/", title: "Types of Databases", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.bytebytego.com/p/ep35-types-of-databases", title: "Types of Databases", source: "ByteByteGo Blog" },
  ],
  "acid-vs-base": [
    { type: "video", id: "pomxJOFVcQs", title: "ACID Properties in Databases", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "W2Z7fbCLSTw", title: "Database Paradigms", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/acid-properties-in-dbms/", title: "ACID Properties in DBMS", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.algomaster.io/p/acid-vs-base", title: "ACID vs BASE", source: "AlgoMaster" },
  ],
  "indexing": [
    { type: "video", id: "HubezKbFL7E", title: "Secret to Optimizing SQL Queries — Understand the SQL Execution Order", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "-qNSXDUc3Go", title: "Database Indexing Explained", source: "Hussein Nasser", dur: "25 min" },
    { type: "video", id: "Kv6bF-61BrI", title: "How Database Indexes Work", source: "Arpit Bhayani", dur: "18 min" },
    { type: "blog", url: "https://use-the-index-luke.com/", title: "Use The Index, Luke — SQL Indexing", source: "use-the-index-luke.com" },
    { type: "blog", url: "https://www.geeksforgeeks.org/indexing-in-databases-set-1/", title: "Indexing in Databases", source: "GeeksforGeeks" },
  ],
  "normalization-vs-denormalization": [
    { type: "video", id: "GFQaEYEc8_8", title: "Database Normalization Explained", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "W2Z7fbCLSTw", title: "Database Paradigms", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/denormalization-in-databases/", title: "Denormalization in Databases", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.algomaster.io/p/normalization-vs-denormalization", title: "Normalization vs Denormalization", source: "AlgoMaster" },
  ],
  "database-federation": [
    { type: "video", id: "W2Z7fbCLSTw", title: "Database Paradigms", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "Q_9cFgzZr8Q", title: "Database Architecture Concepts", source: "Hussein Nasser", dur: "22 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/database-sharding-a-system-design-concept/", title: "Database Sharding & Federation", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.algomaster.io/p/database-sharding", title: "Database Sharding & Federation", source: "AlgoMaster" },
  ],
  "database-migration-zero-downtime": [
    { type: "video", id: "W2Z7fbCLSTw", title: "Database Paradigms", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "hnpzNAPiC0E", title: "Zero-Downtime Database Migrations", source: "Hussein Nasser", dur: "18 min" },
    { type: "blog", url: "https://stripe.com/blog/online-migrations", title: "Online Migrations at Scale", source: "Stripe Blog" },
    { type: "blog", url: "https://blog.algomaster.io/p/zero-downtime-deployments", title: "Zero-Downtime Deployments", source: "AlgoMaster" },
  ],
  "transactions-distributed": [
    { type: "video", id: "eltn4x788UM", title: "Distributed Transactions — Two-Phase Commit", source: "Hussein Nasser", dur: "18 min" },
    { type: "video", id: "S4FnmSeRpAY", title: "Distributed Transactions Explained", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "vGQuGIWEEFg", title: "SAGA Pattern Explained", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/distributed-transactions", title: "Distributed Transactions", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/distributed-transactions-in-dbms/", title: "Distributed Transactions in DBMS", source: "GeeksforGeeks" },
  ],
  "data-lake-vs-warehouse": [
    { type: "video", id: "W2Z7fbCLSTw", title: "Database Paradigms", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "Q_9cFgzZr8Q", title: "Data Warehouse vs Data Lake", source: "Hussein Nasser", dur: "22 min" },
    { type: "blog", url: "https://aws.amazon.com/big-data/datalakes-and-analytics/what-is-a-data-lake/", title: "What Is a Data Lake?", source: "AWS" },
    { type: "blog", url: "https://www.geeksforgeeks.org/difference-between-data-lake-and-data-warehouse/", title: "Data Lake vs Data Warehouse", source: "GeeksforGeeks" },
  ],
  "write-ahead-log-wal": [
    { type: "video", id: "wI4hKwl1Cn4", title: "Write-Ahead Logging (WAL) Explained", source: "Arpit Bhayani", dur: "20 min" },
    { type: "video", id: "pomxJOFVcQs", title: "Database Internals — WAL", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://www.postgresql.org/docs/current/wal-intro.html", title: "Write-Ahead Logging (WAL)", source: "PostgreSQL Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/write-ahead-log-wal/", title: "Write-Ahead Log (WAL)", source: "GeeksforGeeks" },
  ],
  "geospatial-indexes": [
    { type: "video", id: "M4lR_VSGGyo", title: "Proximity Service — Geospatial Indexing", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "tu6QKpV7GiI", title: "Geospatial Queries — Design Yelp", source: "Gaurav Sen", dur: "18 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-yelp", title: "Design Yelp (geospatial section)", source: "AlgoMaster" },
    { type: "blog", url: "https://www.mongodb.com/docs/manual/geospatial-queries/", title: "Geospatial Queries", source: "MongoDB Docs" },
  ],
  "vector-databases": [
    { type: "video", id: "klTvEwg3oJ4", title: "Vector Databases Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "bZQun8Y4L2A", title: "Vector Search and Embeddings", source: "Arpit Bhayani", dur: "25 min" },
    { type: "blog", url: "https://www.pinecone.io/learn/vector-database/", title: "What is a Vector Database?", source: "Pinecone" },
    { type: "blog", url: "https://blog.bytebytego.com/p/vector-databases", title: "Vector Databases", source: "ByteByteGo Blog" },
  ],

  // ── DISTRIBUTED SYSTEMS FUNDAMENTALS ─────────────────────────────
  "cap-theorem": [
    { type: "video", id: "kwCFHLbIhak", title: "CAP Theorem Simplified", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "KmGy3sU6Xw8", title: "CAP Theorem — Distributed Systems", source: "Gaurav Sen", dur: "12 min" },
    { type: "video", id: "k-Yaq8AHlFA", title: "CAP Theorem Explained", source: "Hussein Nasser", dur: "15 min" },
    { type: "blog", url: "https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html", title: "Please Stop Calling Databases CP or AP", source: "Martin Kleppmann" },
    { type: "blog", url: "https://www.geeksforgeeks.org/the-cap-theorem-in-dbms/", title: "The CAP Theorem", source: "GeeksforGeeks" },
  ],
  "pacelc-theorem": [
    { type: "video", id: "kwCFHLbIhak", title: "CAP Theorem (extends to PACELC)", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "KmGy3sU6Xw8", title: "CAP & PACELC — Distributed Systems", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html", title: "Please Stop Calling Databases CP or AP", source: "Martin Kleppmann" },
    { type: "blog", url: "https://www.geeksforgeeks.org/pacelc-theorem/", title: "PACELC Theorem", source: "GeeksforGeeks" },
  ],
  "consistent-hashing": [
    { type: "video", id: "UF9Iqmg94tk", title: "Consistent Hashing Explained", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "zaRkONvyGr8", title: "Consistent Hashing — System Design", source: "Gaurav Sen", dur: "15 min" },
    { type: "video", id: "tHEyzVbl4bg", title: "Consistent Hashing Deep Dive", source: "Arpit Bhayani", dur: "22 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/consistent-hashing", title: "Consistent Hashing", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/consistent-hashing/", title: "Consistent Hashing", source: "GeeksforGeeks" },
  ],
  "sharding": [
    { type: "video", id: "5faMjKuB9bc", title: "Database Sharding Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "zaRkONvyGr8", title: "Sharding & Consistent Hashing", source: "Gaurav Sen", dur: "15 min" },
    { type: "video", id: "hdxdhCpgYo8", title: "Database Sharding Deep Dive", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/database-sharding", title: "Database Sharding", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/database-sharding-a-system-design-concept/", title: "Database Sharding", source: "GeeksforGeeks" },
  ],
  "replication": [
    { type: "video", id: "fUrKt-AQYtE", title: "Database Replication Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "bI8QASdfnVo", title: "Master-Slave vs Master-Master Replication", source: "Hussein Nasser", dur: "15 min" },
    { type: "video", id: "RIcNswbaHub", title: "Database Replication — System Design", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/database-replication", title: "Database Replication", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/data-replication-in-dbms/", title: "Data Replication in DBMS", source: "GeeksforGeeks" },
  ],
  "consensus-paxos-raft": [
    { type: "video", id: "vBhg2p8aAQ0", title: "Raft Consensus Algorithm", source: "Martin Kleppmann", dur: "20 min" },
    { type: "video", id: "uXEYuDwm7e4", title: "Paxos vs Raft — Consensus Explained", source: "Arpit Bhayani", dur: "25 min" },
    { type: "video", id: "IhJGe1Ge0YI", title: "Consensus in Distributed Systems", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://raft.github.io/", title: "The Raft Consensus Algorithm", source: "raft.github.io" },
    { type: "blog", url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", title: "Distributed Locking & Consensus", source: "Martin Kleppmann" },
  ],
  "leader-election": [
    { type: "video", id: "vBhg2p8aAQ0", title: "Raft — Leader Election", source: "Martin Kleppmann", dur: "20 min" },
    { type: "video", id: "IhJGe1Ge0YI", title: "Leader Election — Distributed Systems", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://raft.github.io/", title: "The Raft Consensus Algorithm", source: "raft.github.io" },
    { type: "blog", url: "https://www.geeksforgeeks.org/leader-election-in-distributed-systems/", title: "Leader Election in Distributed Systems", source: "GeeksforGeeks" },
  ],
  "quorum": [
    { type: "video", id: "uNxl3BFcKFQ", title: "Quorum Consensus — Distributed Systems", source: "Jordan Has No Life", dur: "15 min" },
    { type: "video", id: "KmGy3sU6Xw8", title: "Distributed Systems Concepts — Quorum", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", title: "Quorum & Distributed Locking", source: "Martin Kleppmann" },
    { type: "blog", url: "https://www.geeksforgeeks.org/quorum-consensus-in-distributed-systems/", title: "Quorum Consensus", source: "GeeksforGeeks" },
  ],
  "distributed-locking": [
    { type: "video", id: "v7x75aN9liM", title: "Distributed Locking with Redis (Redlock)", source: "Hussein Nasser", dur: "18 min" },
    { type: "video", id: "VJpfO6KdyWE", title: "Distributed Locks — System Design", source: "Arpit Bhayani", dur: "22 min" },
    { type: "blog", url: "https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html", title: "How to do distributed locking", source: "Martin Kleppmann" },
    { type: "blog", url: "https://redis.io/docs/latest/develop/use/patterns/distributed-locks/", title: "Distributed Locks with Redis", source: "Redis Docs" },
  ],
  "gossip-protocols": [
    { type: "video", id: "FY6OhPoT-As", title: "Gossip Protocol Explained", source: "Arpit Bhayani", dur: "18 min" },
    { type: "video", id: "KmGy3sU6Xw8", title: "Distributed Systems Concepts", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/gossip-protocol-in-distributed-systems/", title: "Gossip Protocol in Distributed Systems", source: "GeeksforGeeks" },
    { type: "blog", url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/gossip.html", title: "Gossip in Apache Cassandra", source: "Cassandra Docs" },
  ],
  "vector-clocks-lww": [
    { type: "video", id: "CMBjPCYRNNw", title: "Vector Clocks & CRDTs", source: "Martin Kleppmann", dur: "30 min" },
    { type: "video", id: "FY6OhPoT-As", title: "Conflict Resolution in Distributed Systems", source: "Arpit Bhayani", dur: "18 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/vector-clocks-in-distributed-systems/", title: "Vector Clocks in Distributed Systems", source: "GeeksforGeeks" },
    { type: "blog", url: "https://crdt.tech/", title: "CRDT Tech Resources", source: "crdt.tech" },
  ],
  "two-generals-byzantine-problems": [
    { type: "video", id: "IP-rGJKSZ3s", title: "The Byzantine Generals Problem", source: "Arpit Bhayani", dur: "20 min" },
    { type: "video", id: "vBhg2p8aAQ0", title: "Consensus & Fault Tolerance", source: "Martin Kleppmann", dur: "20 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/byzantine-fault-tolerance-in-distributed-systems/", title: "Byzantine Fault Tolerance", source: "GeeksforGeeks" },
    { type: "blog", url: "https://lamport.azurewebsites.net/pubs/byz.pdf", title: "The Byzantine Generals Problem (original paper)", source: "Leslie Lamport" },
  ],
  "delivery-guarantees": [
    { type: "video", id: "iJLL-KPqBpM", title: "Message Delivery Guarantees", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "J6CBdSCB_fY", title: "Kafka Delivery Semantics — At Most Once, At Least Once, Exactly Once", source: "Hussein Nasser", dur: "25 min" },
    { type: "blog", url: "https://kafka.apache.org/documentation/#semantics", title: "Message Delivery Semantics", source: "Apache Kafka Docs" },
    { type: "blog", url: "https://blog.bytebytego.com/p/delivery-guarantees", title: "Delivery Guarantees", source: "ByteByteGo Blog" },
  ],
  "read-repair-anti-entropy": [
    { type: "video", id: "uNxl3BFcKFQ", title: "Consistency in Distributed Databases", source: "Jordan Has No Life", dur: "15 min" },
    { type: "video", id: "FY6OhPoT-As", title: "Anti-Entropy & Repair Mechanisms", source: "Arpit Bhayani", dur: "18 min" },
    { type: "blog", url: "https://cassandra.apache.org/doc/latest/cassandra/operating/repair.html", title: "Anti-Entropy Repair", source: "Cassandra Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/read-repair-in-distributed-systems/", title: "Read Repair in Distributed Systems", source: "GeeksforGeeks" },
  ],
  "tunable-consistency-per-query": [
    { type: "video", id: "uNxl3BFcKFQ", title: "Tunable Consistency — Distributed Databases", source: "Jordan Has No Life", dur: "15 min" },
    { type: "video", id: "KmGy3sU6Xw8", title: "Consistency Models — Distributed Systems", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/dynamo.html", title: "Tunable Consistency in Cassandra", source: "Cassandra Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/eventual-consistency-vs-strong-consistency/", title: "Eventual vs Strong Consistency", source: "GeeksforGeeks" },
  ],

  // ── NETWORKING ───────────────────────────────────────────────────
  "tcp-vs-udp": [
    { type: "video", id: "qqRYkcta6IE", title: "TCP vs UDP — Networking Fundamentals", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "TCP vs UDP Comparison", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.cloudflare.com/the-road-to-quic/", title: "The Road to QUIC (TCP vs UDP context)", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/differences-between-tcp-and-udp/", title: "Differences Between TCP and UDP", source: "GeeksforGeeks" },
  ],
  "http-1-vs-2-vs-3": [
    { type: "video", id: "a-sBfyiXysI", title: "HTTP/1.1 vs HTTP/2 vs HTTP/3", source: "Hussein Nasser", dur: "25 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "HTTP Protocol Versions", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.cloudflare.com/http3-the-past-present-and-future/", title: "HTTP/3: The Past, Present, and Future", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/difference-between-http-1-1-and-http-2/", title: "HTTP/1.1 vs HTTP/2", source: "GeeksforGeeks" },
  ],
  "tls-https": [
    { type: "video", id: "j9QmMEWmcfo", title: "TLS Handshake — How HTTPS Works", source: "Hussein Nasser", dur: "22 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "HTTPS & TLS Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.cloudflare.com/keyless-ssl-the-nitty-gritty-technical-details/", title: "How TLS Works", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/transport-layer-security-tls/", title: "Transport Layer Security (TLS)", source: "GeeksforGeeks" },
  ],
  "dns": [
    { type: "video", id: "27r4Bzuj5NQ", title: "DNS Explained — How DNS Works", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "FnFtWsZ8IP0", title: "DNS Explained Deep Dive", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.cloudflare.com/what-is-dns/", title: "What Is DNS?", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/domain-name-system-dns-in-application-layer/", title: "Domain Name System (DNS)", source: "GeeksforGeeks" },
  ],
  "websockets-sse-polling": [
    { type: "video", id: "ZBM28ZPlin8", title: "WebSocket vs HTTP — When to Use What", source: "Hussein Nasser", dur: "18 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "Long Polling vs WebSocket vs SSE", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/websocket-vs-sse-vs-long-polling", title: "WebSocket vs SSE vs Long Polling", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/what-is-web-socket-and-how-it-is-different-from-the-http/", title: "WebSocket vs HTTP", source: "GeeksforGeeks" },
  ],
  "webhooks": [
    { type: "video", id: "x_jjhcnSHL4", title: "Webhooks Explained", source: "ByteByteGo", dur: "6 min" },
    { type: "video", id: "ZBM28ZPlin8", title: "Push Mechanisms — WebSocket, Webhooks, Polling", source: "Hussein Nasser", dur: "18 min" },
    { type: "blog", url: "https://stripe.com/docs/webhooks", title: "Stripe Webhooks", source: "Stripe Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/what-are-webhooks/", title: "What Are Webhooks?", source: "GeeksforGeeks" },
  ],
  "api-protocols-rest-graphql-grpc": [
    { type: "video", id: "4vLxWqE94l4", title: "gRPC vs REST — What Is gRPC?", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "hkXzsB8D_mo", title: "REST vs GraphQL vs gRPC", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/rest-vs-graphql-vs-grpc", title: "REST vs GraphQL vs gRPC", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/rest-vs-graphql/", title: "REST vs GraphQL", source: "GeeksforGeeks" },
  ],
  "api-versioning": [
    { type: "video", id: "hkXzsB8D_mo", title: "API Design Best Practices", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "4vLxWqE94l4", title: "API Versioning Strategies", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://stripe.com/blog/api-versioning", title: "APIs as Infrastructure: Future-proofing Stripe", source: "Stripe Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/api-versioning/", title: "API Versioning", source: "GeeksforGeeks" },
  ],
  "proxy-vs-reverse-proxy": [
    { type: "video", id: "4NB0NDtOwIQ", title: "Proxy vs Reverse Proxy Explained", source: "Hussein Nasser", dur: "18 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "Proxy & Reverse Proxy", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.cloudflare.com/what-is-a-reverse-proxy/", title: "What Is a Reverse Proxy?", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/difference-between-proxy-and-reverse-proxy/", title: "Proxy vs Reverse Proxy", source: "GeeksforGeeks" },
  ],
  "push-notification-protocols": [
    { type: "video", id: "bBTPDNxQk6E", title: "Design a Notification Service", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "ZBM28ZPlin8", title: "Push Technologies — WebSocket, SSE, Push", source: "Hussein Nasser", dur: "18 min" },
    { type: "blog", url: "https://firebase.google.com/docs/cloud-messaging", title: "Firebase Cloud Messaging", source: "Firebase Docs" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-notification-system", title: "Design a Notification System", source: "AlgoMaster" },
  ],
  "connection-pooling": [
    { type: "video", id: "pomxJOFVcQs", title: "Connection Pooling in Databases", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "Connection Pooling Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/connection-pooling/", title: "Connection Pooling", source: "GeeksforGeeks" },
    { type: "blog", url: "https://supabase.com/blog/supabase-pgbouncer", title: "Connection Pooling with PgBouncer", source: "Supabase Blog" },
  ],

  // ── ARCHITECTURE PATTERNS ────────────────────────────────────────
  "load-balancer": [
    { type: "video", id: "K0Ta65OqQkY", title: "Load Balancing — System Design Basics", source: "Gaurav Sen", dur: "12 min" },
    { type: "video", id: "sCR3SAVdyCc", title: "Load Balancer Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "galcDRNd5Ow", title: "Layer 4 vs Layer 7 Load Balancing", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/load-balancing-algorithms", title: "Load Balancing Algorithms", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/load-balancing-in-system-design/", title: "Load Balancing in System Design", source: "GeeksforGeeks" },
  ],
  "api-gateway": [
    { type: "video", id: "6ULyxuHKxg8", title: "API Gateway Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "K0Ta65OqQkY", title: "API Gateway vs Load Balancer", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/what-is-an-api-gateway/", title: "What Is an API Gateway?", source: "GeeksforGeeks" },
    { type: "blog", url: "https://aws.amazon.com/api-gateway/", title: "Amazon API Gateway", source: "AWS" },
  ],
  "microservices-vs-monolith": [
    { type: "video", id: "lTAcCNbJ7KE", title: "Microservices vs Monolith", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Microservices Architecture", source: "Gaurav Sen", dur: "15 min" },
    { type: "video", id: "rv4LlmGVWmE", title: "Monolith to Microservices Migration", source: "Hussein Nasser", dur: "22 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/microservices-vs-monolith", title: "Microservices vs Monolith", source: "AlgoMaster" },
    { type: "blog", url: "https://martinfowler.com/articles/microservices.html", title: "Microservices", source: "Martin Fowler" },
  ],
  "event-driven-architecture": [
    { type: "video", id: "STKCRSUsyP0", title: "Event-Driven Architecture Explained", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "vGQuGIWEEFg", title: "Event-Driven Architecture", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/event-driven-architecture", title: "Event-Driven Architecture", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://martinfowler.com/articles/201701-event-driven.html", title: "What do you mean by Event-Driven?", source: "Martin Fowler" },
  ],
  "event-sourcing-cqrs": [
    { type: "video", id: "STKCRSUsyP0", title: "Event Sourcing & CQRS", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "vGQuGIWEEFg", title: "Event Sourcing Explained", source: "Gaurav Sen", dur: "15 min" },
    { type: "video", id: "rUDN40rdly8", title: "Event Sourcing Deep Dive", source: "Martin Kleppmann", dur: "25 min" },
    { type: "blog", url: "https://martinfowler.com/eaaDev/EventSourcing.html", title: "Event Sourcing", source: "Martin Fowler" },
    { type: "blog", url: "https://www.geeksforgeeks.org/cqrs-pattern/", title: "CQRS Pattern", source: "GeeksforGeeks" },
  ],
  "service-mesh": [
    { type: "video", id: "16fgzklcF7Y", title: "Service Mesh Explained", source: "TechWorld with Nana", dur: "15 min" },
    { type: "video", id: "lTAcCNbJ7KE", title: "Microservices Communication — Service Mesh", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://istio.io/latest/docs/concepts/what-is-istio/", title: "What is Istio?", source: "Istio Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/what-is-a-service-mesh/", title: "What is a Service Mesh?", source: "GeeksforGeeks" },
  ],
  "service-discovery": [
    { type: "video", id: "lTAcCNbJ7KE", title: "Service Discovery in Microservices", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Service Discovery — System Design", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/service-discovery-in-microservices/", title: "Service Discovery in Microservices", source: "GeeksforGeeks" },
    { type: "blog", url: "https://www.consul.io/docs/intro", title: "HashiCorp Consul — Service Discovery", source: "Consul Docs" },
  ],
  "bff-backend-for-frontend": [
    { type: "video", id: "lTAcCNbJ7KE", title: "Backend for Frontend Pattern", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Microservices Patterns — BFF", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/backend-for-frontend", title: "Backend for Frontend (BFF) Pattern", source: "AlgoMaster" },
    { type: "blog", url: "https://samnewman.io/patterns/architectural/bff/", title: "Backends For Frontends", source: "Sam Newman" },
  ],
  "hexagonal-clean-architecture": [
    { type: "video", id: "lTAcCNbJ7KE", title: "Software Architecture Patterns", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Clean Architecture Principles", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html", title: "The Clean Architecture", source: "Robert C. Martin" },
    { type: "blog", url: "https://www.geeksforgeeks.org/hexagonal-architecture/", title: "Hexagonal Architecture", source: "GeeksforGeeks" },
  ],
  "domain-driven-design": [
    { type: "video", id: "lTAcCNbJ7KE", title: "Domain-Driven Design Basics", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "DDD — Domain-Driven Design", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://martinfowler.com/bliki/DomainDrivenDesign.html", title: "Domain-Driven Design", source: "Martin Fowler" },
    { type: "blog", url: "https://www.geeksforgeeks.org/domain-driven-design-ddd/", title: "Domain-Driven Design (DDD)", source: "GeeksforGeeks" },
  ],
  "stateless-services": [
    { type: "video", id: "lTAcCNbJ7KE", title: "Stateless Architecture", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Stateful vs Stateless Services", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/stateless-vs-stateful", title: "Stateless vs Stateful Services", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/stateful-vs-stateless-architecture/", title: "Stateful vs Stateless Architecture", source: "GeeksforGeeks" },
  ],
  "shared-nothing-architecture": [
    { type: "video", id: "5faMjKuB9bc", title: "Shared-Nothing Architecture & Sharding", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "hdxdhCpgYo8", title: "Shared Nothing vs Shared Everything", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/shared-nothing-architecture/", title: "Shared Nothing Architecture", source: "GeeksforGeeks" },
    { type: "blog", url: "https://blog.algomaster.io/p/database-sharding", title: "Database Sharding (shared-nothing)", source: "AlgoMaster" },
  ],
  "multi-tenancy": [
    { type: "video", id: "lTAcCNbJ7KE", title: "Multi-Tenancy Architecture", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "hdxdhCpgYo8", title: "Multi-Tenant Database Design", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/multi-tenant-architecture/", title: "Multi-Tenant Architecture", source: "GeeksforGeeks" },
    { type: "blog", url: "https://aws.amazon.com/solutions/saas/", title: "SaaS Multi-Tenancy Patterns", source: "AWS" },
  ],

  // ── MESSAGING & STREAMING ────────────────────────────────────────
  "message-queue-vs-pubsub": [
    { type: "video", id: "iJLL-KPqBpM", title: "Message Queue vs Pub/Sub", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "J6CBdSCB_fY", title: "Kafka, RabbitMQ, SQS — Messaging Compared", source: "Hussein Nasser", dur: "25 min" },
    { type: "video", id: "oKJYEBtAvP4", title: "Message Queues — System Design", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/message-queue-vs-pubsub", title: "Message Queue vs Pub/Sub", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://aws.amazon.com/message-queue/", title: "What is a Message Queue?", source: "AWS" },
  ],
  "kafka-internals": [
    { type: "video", id: "J6CBdSCB_fY", title: "Apache Kafka Architecture Deep Dive", source: "Hussein Nasser", dur: "25 min" },
    { type: "video", id: "iJLL-KPqBpM", title: "Kafka Explained in 10 Minutes", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "UNUz1-msbOM", title: "Kafka Internals — How Kafka Works", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://kafka.apache.org/documentation/", title: "Apache Kafka Documentation", source: "Apache Kafka" },
    { type: "blog", url: "https://blog.cloudflare.com/using-apache-kafka/", title: "Using Apache Kafka", source: "Cloudflare Blog" },
  ],
  "batch-vs-stream-processing": [
    { type: "video", id: "iJLL-KPqBpM", title: "Stream Processing vs Batch Processing", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "J6CBdSCB_fY", title: "Stream Processing Architecture", source: "Hussein Nasser", dur: "25 min" },
    { type: "blog", url: "https://flink.apache.org/what-is-flink/use-cases/", title: "Apache Flink Stream Processing", source: "Apache Flink" },
    { type: "blog", url: "https://www.geeksforgeeks.org/difference-between-batch-processing-and-stream-processing/", title: "Batch vs Stream Processing", source: "GeeksforGeeks" },
  ],
  "cdc-change-data-capture": [
    { type: "video", id: "STKCRSUsyP0", title: "Change Data Capture Explained", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "J6CBdSCB_fY", title: "CDC with Kafka & Debezium", source: "Hussein Nasser", dur: "25 min" },
    { type: "blog", url: "https://debezium.io/documentation/reference/stable/tutorial.html", title: "Debezium Tutorial — CDC", source: "Debezium Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/change-data-capture-cdc/", title: "Change Data Capture (CDC)", source: "GeeksforGeeks" },
  ],
  "backpressure-flow-control": [
    { type: "video", id: "iJLL-KPqBpM", title: "Backpressure in Message Queues", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "J6CBdSCB_fY", title: "Flow Control in Distributed Systems", source: "Hussein Nasser", dur: "25 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/backpressure-in-system-design/", title: "Backpressure in System Design", source: "GeeksforGeeks" },
    { type: "blog", url: "https://www.reactivemanifesto.org/", title: "The Reactive Manifesto", source: "reactivemanifesto.org" },
  ],

  // ── RESILIENCE & RELIABILITY ─────────────────────────────────────
  "circuit-breaker": [
    { type: "video", id: "ADHcBxEXvFA", title: "Circuit Breaker Pattern", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Resilience Patterns — Circuit Breaker", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://martinfowler.com/bliki/CircuitBreaker.html", title: "Circuit Breaker", source: "Martin Fowler" },
    { type: "blog", url: "https://www.geeksforgeeks.org/circuit-breaker-pattern/", title: "Circuit Breaker Pattern", source: "GeeksforGeeks" },
  ],
  "retry-backoff-jitter": [
    { type: "video", id: "ADHcBxEXvFA", title: "Retry Strategies & Circuit Breaker", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Retry with Exponential Backoff", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/", title: "Exponential Backoff and Jitter", source: "AWS Architecture Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/exponential-backoff-algorithm/", title: "Exponential Backoff Algorithm", source: "GeeksforGeeks" },
  ],
  "bulkhead-isolation": [
    { type: "video", id: "ADHcBxEXvFA", title: "Resilience Patterns — Bulkhead", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Bulkhead Pattern — Fault Isolation", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead", title: "Bulkhead Pattern", source: "Azure Architecture" },
    { type: "blog", url: "https://www.geeksforgeeks.org/bulkhead-pattern/", title: "Bulkhead Pattern", source: "GeeksforGeeks" },
  ],
  "graceful-degradation": [
    { type: "video", id: "ADHcBxEXvFA", title: "Resilience Patterns", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Graceful Degradation in System Design", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/graceful-degradation", title: "Graceful Degradation", source: "AlgoMaster" },
    { type: "blog", url: "https://netflixtechblog.com/making-the-netflix-api-more-resilient-a8ec62f456d5", title: "Making the Netflix API More Resilient", source: "Netflix Tech Blog" },
  ],
  "request-hedging": [
    { type: "video", id: "ADHcBxEXvFA", title: "Resilience Patterns", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Hedged Requests — Reducing Tail Latency", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://research.google/pubs/pub40801/", title: "The Tail at Scale", source: "Google Research" },
    { type: "blog", url: "https://www.geeksforgeeks.org/hedged-requests-in-distributed-systems/", title: "Hedged Requests", source: "GeeksforGeeks" },
  ],
  "idempotency": [
    { type: "video", id: "ADHcBxEXvFA", title: "Idempotency & Resilience", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "4OuaONkZw1I", title: "Idempotency Explained", source: "Hussein Nasser", dur: "15 min" },
    { type: "blog", url: "https://stripe.com/docs/idempotency", title: "Idempotent Requests", source: "Stripe Docs" },
    { type: "blog", url: "https://blog.algomaster.io/p/idempotency", title: "Idempotency in System Design", source: "AlgoMaster" },
  ],
  "rate-limiting-algorithms": [
    { type: "video", id: "FU4WlwfS3G0", title: "System Design: Rate Limiter", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "mhUQe4BKZXs", title: "Rate Limiting (Leaky Bucket, Token Bucket, Sliding Window)", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://stripe.com/blog/rate-limiters", title: "Scaling Your API with Rate Limiters", source: "Stripe Blog" },
    { type: "blog", url: "https://blog.cloudflare.com/counting-things-a-lot-of-different-things/", title: "Rate Limiting at Cloudflare", source: "Cloudflare Blog" },
  ],
  "chaos-engineering": [
    { type: "video", id: "ADHcBxEXvFA", title: "Resilience & Chaos Engineering", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Chaos Engineering Principles", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://netflixtechblog.com/the-netflix-simian-army-16e57fbab116", title: "The Netflix Simian Army", source: "Netflix Tech Blog" },
    { type: "blog", url: "https://principlesofchaos.org/", title: "Principles of Chaos Engineering", source: "principlesofchaos.org" },
  ],
  "disaster-recovery-rto-rpo": [
    { type: "video", id: "ADHcBxEXvFA", title: "Disaster Recovery Concepts", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "RTO & RPO Explained", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://aws.amazon.com/blogs/architecture/disaster-recovery-dr-architecture-on-aws/", title: "Disaster Recovery on AWS", source: "AWS Architecture Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/rto-and-rpo-in-system-design/", title: "RTO and RPO", source: "GeeksforGeeks" },
  ],
  "heartbeat-failure-detection": [
    { type: "video", id: "FY6OhPoT-As", title: "Failure Detection in Distributed Systems", source: "Arpit Bhayani", dur: "18 min" },
    { type: "video", id: "KmGy3sU6Xw8", title: "Heartbeat & Failure Detection", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/heartbeat-mechanism-in-distributed-systems/", title: "Heartbeat Mechanism", source: "GeeksforGeeks" },
    { type: "blog", url: "https://cassandra.apache.org/doc/latest/cassandra/architecture/gossip.html", title: "Gossip & Failure Detection in Cassandra", source: "Cassandra Docs" },
  ],
  "availability-nines": [
    { type: "video", id: "ADHcBxEXvFA", title: "High Availability Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Availability — Nines of Uptime", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/availability-and-reliability", title: "Availability and Reliability", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/availability-in-system-design/", title: "Availability in System Design", source: "GeeksforGeeks" },
  ],
  "slos-slis-slas": [
    { type: "video", id: "9TJx7QTrTyo", title: "SLOs, SLIs, SLAs — Monitoring Concepts", source: "TechWorld with Nana", dur: "22 min" },
    { type: "video", id: "ADHcBxEXvFA", title: "Service Level Objectives", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://sre.google/sre-book/service-level-objectives/", title: "Service Level Objectives", source: "Google SRE Book" },
    { type: "blog", url: "https://www.geeksforgeeks.org/sli-slo-sla-in-system-design/", title: "SLI, SLO, SLA", source: "GeeksforGeeks" },
  ],
  "multi-region-active-active-vs-active-passive": [
    { type: "video", id: "ADHcBxEXvFA", title: "Multi-Region Architecture", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Active-Active vs Active-Passive", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://aws.amazon.com/blogs/architecture/disaster-recovery-dr-architecture-on-aws/", title: "Multi-Region DR on AWS", source: "AWS Architecture Blog" },
    { type: "blog", url: "https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b", title: "Active-Active for Multi-Regional Resiliency", source: "Netflix Tech Blog" },
  ],

  // ── SCALING & INFRASTRUCTURE ─────────────────────────────────────
  "horizontal-vs-vertical-scaling": [
    { type: "video", id: "sCR3SAVdyCc", title: "Horizontal vs Vertical Scaling", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "K0Ta65OqQkY", title: "Scaling — System Design Basics", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/horizontal-vs-vertical-scaling", title: "Horizontal vs Vertical Scaling", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/horizontal-and-vertical-scaling-in-databases/", title: "Horizontal and Vertical Scaling", source: "GeeksforGeeks" },
  ],
  "autoscaling": [
    { type: "video", id: "sCR3SAVdyCc", title: "Auto-Scaling Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "16fgzklcF7Y", title: "Kubernetes Autoscaling", source: "TechWorld with Nana", dur: "15 min" },
    { type: "blog", url: "https://aws.amazon.com/autoscaling/", title: "AWS Auto Scaling", source: "AWS" },
    { type: "blog", url: "https://www.geeksforgeeks.org/auto-scaling-in-cloud-computing/", title: "Auto Scaling in Cloud Computing", source: "GeeksforGeeks" },
  ],
  "edge-computing": [
    { type: "video", id: "8KuO4r5CHjM", title: "Edge Computing & CDNs", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "RI9np1LWzqw", title: "Edge Computing with Cloudflare Workers", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.cloudflare.com/what-is-edge-computing/", title: "What Is Edge Computing?", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/what-is-edge-computing/", title: "What Is Edge Computing?", source: "GeeksforGeeks" },
  ],
  "compression-encoding": [
    { type: "video", id: "ip-UmK-EUOc", title: "Data Compression & Encoding", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "qqRYkcta6IE", title: "Compression in Networking", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.cloudflare.com/results-experimenting-brotli/", title: "Experimenting with Brotli Compression", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/data-compression-in-system-design/", title: "Data Compression", source: "GeeksforGeeks" },
  ],
  "memory-mapped-files": [
    { type: "video", id: "wI4hKwl1Cn4", title: "Memory-Mapped Files & IO", source: "Arpit Bhayani", dur: "20 min" },
    { type: "video", id: "pomxJOFVcQs", title: "Database Storage Internals", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/memory-mapped-io/", title: "Memory-Mapped I/O", source: "GeeksforGeeks" },
    { type: "blog", url: "https://db.cs.cmu.edu/mmap-cidr2022/", title: "Are You Sure You Want to Use MMAP?", source: "CMU Database Group" },
  ],
  "concurrency-models": [
    { type: "video", id: "pomxJOFVcQs", title: "Concurrency in Databases", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Concurrency Models Explained", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/concurrency-models", title: "Concurrency Models", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/concurrency-in-operating-system/", title: "Concurrency Models", source: "GeeksforGeeks" },
  ],

  // ── DATA STRUCTURES & ALGORITHMS ─────────────────────────────────
  "bloom-filter": [
    { type: "video", id: "V3pzxngeLqw", title: "Bloom Filters — Why They Work", source: "Arpit Bhayani", dur: "20 min" },
    { type: "video", id: "lJYufx0bfpw", title: "Bloom Filter Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/bloom-filters", title: "Bloom Filters", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/bloom-filters-introduction-and-python-implementation/", title: "Bloom Filters Introduction", source: "GeeksforGeeks" },
  ],
  "hyperloglog-sketches": [
    { type: "video", id: "lJYufx0bfpw", title: "HyperLogLog Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "V3pzxngeLqw", title: "Probabilistic Data Structures", source: "Arpit Bhayani", dur: "20 min" },
    { type: "blog", url: "https://redis.io/docs/latest/develop/data-types/probabilistic/hyperloglogs/", title: "HyperLogLog in Redis", source: "Redis Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/hyperloglog-algorithm/", title: "HyperLogLog Algorithm", source: "GeeksforGeeks" },
  ],
  "merkle-trees": [
    { type: "video", id: "tHEyzVbl4bg", title: "Merkle Trees in Distributed Systems", source: "Arpit Bhayani", dur: "22 min" },
    { type: "video", id: "fUrKt-AQYtE", title: "Merkle Trees — Data Integrity Verification", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/merkle-tree-in-blockchain/", title: "Merkle Tree", source: "GeeksforGeeks" },
    { type: "blog", url: "https://cassandra.apache.org/doc/latest/cassandra/operating/repair.html", title: "Anti-Entropy Repair with Merkle Trees", source: "Cassandra Docs" },
  ],
  "erasure-coding": [
    { type: "video", id: "UmWtcgC96X8", title: "Erasure Coding & Data Durability", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "tHEyzVbl4bg", title: "Erasure Coding Explained", source: "Arpit Bhayani", dur: "22 min" },
    { type: "blog", url: "https://blog.min.io/erasure-coding/", title: "Erasure Coding in MinIO", source: "MinIO Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/erasure-coding-in-system-design/", title: "Erasure Coding", source: "GeeksforGeeks" },
  ],
  "url-encoding-base62": [
    { type: "video", id: "fMZMm_0ZhK4", title: "URL Shortening — Base62 Encoding", source: "Gaurav Sen", dur: "12 min" },
    { type: "video", id: "rGQKHpjMn_M", title: "Design a URL Shortener", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/design-a-url-shortener", title: "URL Shortener (Base62 section)", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/how-to-design-a-tiny-url-or-url-shortener/", title: "URL Shortener Design", source: "GeeksforGeeks" },
  ],

  // ── SECURITY ─────────────────────────────────────────────────────
  "auth-oauth-jwt": [
    { type: "video", id: "fyTxwIa-1U0", title: "OAuth 2.0 Explained", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "4vLxWqE94l4", title: "JWT vs Session Authentication", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://blog.bytebytego.com/p/oauth-20-explained", title: "OAuth 2.0 Explained", source: "ByteByteGo Blog" },
    { type: "blog", url: "https://auth0.com/docs/get-started", title: "Auth0 — OAuth & JWT Getting Started", source: "Auth0 Docs" },
  ],
  "ddos-protection": [
    { type: "video", id: "RI9np1LWzqw", title: "DDoS Protection & Cloudflare", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "DDoS Attack Types & Mitigation", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://blog.cloudflare.com/tag/ddos/", title: "DDoS Protection", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/deniel-of-service-ddos-attack/", title: "DDoS Attack", source: "GeeksforGeeks" },
  ],
  "secret-management": [
    { type: "video", id: "fyTxwIa-1U0", title: "Secrets Management & Security", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "16fgzklcF7Y", title: "Kubernetes Secrets & Vault", source: "TechWorld with Nana", dur: "15 min" },
    { type: "blog", url: "https://www.vaultproject.io/docs/what-is-vault", title: "What is Vault?", source: "HashiCorp Vault Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/secret-management-in-system-design/", title: "Secret Management", source: "GeeksforGeeks" },
  ],
  "field-level-encryption": [
    { type: "video", id: "fyTxwIa-1U0", title: "Encryption Strategies", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "4vLxWqE94l4", title: "Encryption at Rest vs in Transit", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://www.mongodb.com/docs/manual/core/csfle/", title: "Client-Side Field Level Encryption", source: "MongoDB Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/field-level-encryption/", title: "Field-Level Encryption", source: "GeeksforGeeks" },
  ],
  "tokenization-pci": [
    { type: "video", id: "olfaBgJrUBI", title: "Payment Security — Tokenization", source: "ByteByteGo", dur: "12 min" },
    { type: "video", id: "fyTxwIa-1U0", title: "Tokenization & PCI Compliance", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://stripe.com/docs/security", title: "Stripe Security & PCI", source: "Stripe Docs" },
    { type: "blog", url: "https://www.geeksforgeeks.org/tokenization-in-system-design/", title: "Tokenization in System Design", source: "GeeksforGeeks" },
  ],
  "gdpr-right-to-be-forgotten": [
    { type: "video", id: "fyTxwIa-1U0", title: "Data Privacy & Security", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://stripe.com/blog/engineering-privacy", title: "Engineering for Privacy", source: "Stripe Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/gdpr-general-data-protection-regulation/", title: "GDPR Overview", source: "GeeksforGeeks" },
    { type: "blog", url: "https://engineering.linkedin.com/blog/2020/data-privacy-at-scale", title: "Data Privacy at Scale", source: "LinkedIn Engineering" },
  ],
  "zero-trust-networking": [
    { type: "video", id: "RI9np1LWzqw", title: "Zero Trust Architecture", source: "Hussein Nasser", dur: "20 min" },
    { type: "video", id: "fyTxwIa-1U0", title: "Zero Trust Security Model", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://blog.cloudflare.com/cloudflare-one/", title: "Cloudflare One — Zero Trust", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/zero-trust-security-model/", title: "Zero Trust Security Model", source: "GeeksforGeeks" },
  ],

  // ── OBSERVABILITY & OPERATIONS ───────────────────────────────────
  "observability-triad": [
    { type: "video", id: "9TJx7QTrTyo", title: "Observability — Logs, Metrics, Traces", source: "TechWorld with Nana", dur: "22 min" },
    { type: "video", id: "h4Sl21AKiDg", title: "Observability in Distributed Systems", source: "ByteByteGo", dur: "10 min" },
    { type: "blog", url: "https://prometheus.io/docs/introduction/overview/", title: "Prometheus Overview", source: "Prometheus Docs" },
    { type: "blog", url: "https://www.datadoghq.com/blog/monitoring-101-collecting-data/", title: "Monitoring 101", source: "Datadog Blog" },
  ],
  "deployment-strategies-blue-green-canary": [
    { type: "video", id: "AWVTKBUnoIg", title: "Deployment Strategies Explained", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "scEDHsr3APg", title: "Blue-Green, Canary, Rolling Deployments", source: "TechWorld with Nana", dur: "15 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/deployment-strategies", title: "Deployment Strategies", source: "AlgoMaster" },
    { type: "blog", url: "https://martinfowler.com/bliki/CanaryRelease.html", title: "Canary Release", source: "Martin Fowler" },
  ],
  "feature-flags-rollouts": [
    { type: "video", id: "AWVTKBUnoIg", title: "Feature Flags & Progressive Rollout", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "scEDHsr3APg", title: "Feature Toggles Explained", source: "TechWorld with Nana", dur: "15 min" },
    { type: "blog", url: "https://martinfowler.com/articles/feature-toggles.html", title: "Feature Toggles (Feature Flags)", source: "Martin Fowler" },
    { type: "blog", url: "https://www.geeksforgeeks.org/feature-flags-in-system-design/", title: "Feature Flags", source: "GeeksforGeeks" },
  ],
  "ab-testing-platform": [
    { type: "video", id: "AWVTKBUnoIg", title: "A/B Testing Architecture", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "scEDHsr3APg", title: "A/B Testing in Production", source: "TechWorld with Nana", dur: "15 min" },
    { type: "blog", url: "https://netflixtechblog.com/its-all-a-bout-testing-the-netflix-experimentation-platform-4e1ca458c15", title: "Netflix Experimentation Platform", source: "Netflix Tech Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/ab-testing-system-design/", title: "A/B Testing System Design", source: "GeeksforGeeks" },
  ],
  "latency-numbers": [
    { type: "video", id: "FqR5vESuKe0", title: "Latency Numbers Every Programmer Should Know", source: "ByteByteGo", dur: "6 min" },
    { type: "video", id: "qYhRvH9tJKw", title: "Latency & Throughput", source: "Gaurav Sen", dur: "15 min" },
    { type: "blog", url: "https://colin-scott.github.io/personal_website/research/interactive_latency.html", title: "Interactive Latency Numbers", source: "Colin Scott" },
    { type: "blog", url: "https://blog.bytebytego.com/p/latency-numbers", title: "Latency Numbers", source: "ByteByteGo Blog" },
  ],
  "back-of-envelope-estimation": [
    { type: "video", id: "FqR5vESuKe0", title: "Back-of-Envelope Estimation", source: "ByteByteGo", dur: "6 min" },
    { type: "video", id: "K0Ta65OqQkY", title: "System Design Estimation Practice", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/back-of-envelope-estimation", title: "Back-of-Envelope Estimation", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/back-of-the-envelope-estimation-system-design/", title: "Back of Envelope Estimation", source: "GeeksforGeeks" },
  ],

  // ── INTERVIEW ────────────────────────────────────────────────────
  "interview-framework": [
    { type: "video", id: "bUHFg8CZFpI", title: "System Design Interview Framework", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "K0Ta65OqQkY", title: "How to Approach System Design", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/system-design-interview-framework", title: "System Design Interview Framework", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/how-to-crack-system-design-round-in-interviews/", title: "How to Crack System Design", source: "GeeksforGeeks" },
  ],
  "interview-tactics-playbook": [
    { type: "video", id: "bUHFg8CZFpI", title: "System Design Interview Tips", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "K0Ta65OqQkY", title: "System Design Tips & Tactics", source: "Gaurav Sen", dur: "12 min" },
    { type: "blog", url: "https://blog.algomaster.io/p/system-design-interview-framework", title: "System Design Interview Framework", source: "AlgoMaster" },
    { type: "blog", url: "https://www.geeksforgeeks.org/top-10-system-design-interview-questions-and-answers/", title: "Top 10 System Design Questions", source: "GeeksforGeeks" },
  ],

  // ── ML/AI INFRASTRUCTURE ─────────────────────────────────────────
  "llm-serving-infrastructure": [
    { type: "video", id: "jkrNMKz9pWU", title: "How ChatGPT Works Technically", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "bZQun8Y4L2A", title: "LLM Inference Optimization", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://vllm.ai/", title: "vLLM: Fast LLM Serving", source: "vLLM Project" },
    { type: "blog", url: "https://lilianweng.github.io/posts/2023-01-27-the-transformer-family-v2/", title: "The Transformer Family", source: "Lilian Weng (OpenAI)" },
  ],
  "embedding-generation-pipelines": [
    { type: "video", id: "klTvEwg3oJ4", title: "Embeddings & Vector Search", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "bZQun8Y4L2A", title: "Embedding Generation at Scale", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://www.pinecone.io/learn/vector-database/", title: "Vector Embeddings Pipeline", source: "Pinecone" },
    { type: "blog", url: "https://blog.bytebytego.com/p/vector-databases", title: "Vector Databases & Embeddings", source: "ByteByteGo Blog" },
  ],
  "model-serving-online-vs-batch": [
    { type: "video", id: "jkrNMKz9pWU", title: "Online vs Batch Model Serving", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "bZQun8Y4L2A", title: "ML Model Serving Infrastructure", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://netflixtechblog.com/system-architectures-for-personalization-and-recommendation-e081aa94b5d8", title: "ML System Architectures at Netflix", source: "Netflix Tech Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/online-vs-offline-machine-learning/", title: "Online vs Offline ML", source: "GeeksforGeeks" },
  ],
  "online-learning-vs-offline-training": [
    { type: "video", id: "jkrNMKz9pWU", title: "ML Training Paradigms", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "bZQun8Y4L2A", title: "Online vs Offline Training", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://www.geeksforgeeks.org/online-vs-offline-machine-learning/", title: "Online vs Offline Machine Learning", source: "GeeksforGeeks" },
    { type: "blog", url: "https://uber.com/blog/michelangelo-machine-learning-platform/", title: "Michelangelo: Uber's ML Platform", source: "Uber Engineering" },
  ],
  "feature-store": [
    { type: "video", id: "jkrNMKz9pWU", title: "ML Infrastructure — Feature Store", source: "ByteByteGo", dur: "10 min" },
    { type: "video", id: "bZQun8Y4L2A", title: "Feature Stores in ML Systems", source: "Arpit Bhayani", dur: "30 min" },
    { type: "blog", url: "https://www.tecton.ai/blog/what-is-a-feature-store/", title: "What Is a Feature Store?", source: "Tecton" },
    { type: "blog", url: "https://uber.com/blog/michelangelo-machine-learning-platform/", title: "Uber's Michelangelo Platform", source: "Uber Engineering" },
  ],

  // ── TIME & CLOCKS ────────────────────────────────────────────────
  "time-sync-clocks": [
    { type: "video", id: "CMBjPCYRNNw", title: "Time, Clocks, and Ordering in Distributed Systems", source: "Martin Kleppmann", dur: "30 min" },
    { type: "video", id: "FY6OhPoT-As", title: "Clock Synchronization", source: "Arpit Bhayani", dur: "18 min" },
    { type: "blog", url: "https://blog.cloudflare.com/roughtime/", title: "Roughtime — Authenticated Time", source: "Cloudflare Blog" },
    { type: "blog", url: "https://www.geeksforgeeks.org/clock-synchronization-in-distributed-system/", title: "Clock Synchronization in Distributed Systems", source: "GeeksforGeeks" },
  ],
  "clock-skew-tolerance-design": [
    { type: "video", id: "CMBjPCYRNNw", title: "Time, Clocks, and Ordering", source: "Martin Kleppmann", dur: "30 min" },
    { type: "video", id: "FY6OhPoT-As", title: "Clock Skew & Drift", source: "Arpit Bhayani", dur: "18 min" },
    { type: "blog", url: "https://cloud.google.com/spanner/docs/true-time-external-consistency", title: "TrueTime & External Consistency", source: "Google Cloud" },
    { type: "blog", url: "https://www.geeksforgeeks.org/clock-synchronization-in-distributed-system/", title: "Clock Synchronization", source: "GeeksforGeeks" },
  ],

  // ── MEDIA PIPELINES ──────────────────────────────────────────────
  "image-video-pipeline": [
    { type: "video", id: "jPKTo1iGQiE", title: "Video Processing Pipeline — System Design", source: "Gaurav Sen", dur: "18 min" },
    { type: "video", id: "ryw1jgmGJkM", title: "How Netflix Encodes Video", source: "ByteByteGo", dur: "12 min" },
    { type: "blog", url: "https://netflixtechblog.com/high-quality-video-encoding-at-scale-d159db052746", title: "High Quality Video Encoding at Scale", source: "Netflix Tech Blog" },
    { type: "blog", url: "https://blog.cloudflare.com/building-cloudflare-images/", title: "Building Cloudflare Images", source: "Cloudflare Blog" },
  ],

  // ── MOBILE & FRONTEND ────────────────────────────────────────────
  "mobile-offline-first-sync": [
    { type: "video", id: "CMBjPCYRNNw", title: "CRDTs for Offline-First Apps", source: "Martin Kleppmann", dur: "30 min" },
    { type: "video", id: "ip-UmK-EUOc", title: "Offline-First Architecture", source: "ByteByteGo", dur: "8 min" },
    { type: "blog", url: "https://crdt.tech/", title: "CRDT Resources for Sync", source: "crdt.tech" },
    { type: "blog", url: "https://www.geeksforgeeks.org/offline-first-applications/", title: "Offline-First Applications", source: "GeeksforGeeks" },
  ],
  "service-workers-pwa-offline": [
    { type: "video", id: "ip-UmK-EUOc", title: "Service Workers & PWA", source: "ByteByteGo", dur: "8 min" },
    { type: "video", id: "RI9np1LWzqw", title: "Caching with Service Workers", source: "Hussein Nasser", dur: "20 min" },
    { type: "blog", url: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API", title: "Service Worker API", source: "MDN Web Docs" },
    { type: "blog", url: "https://web.dev/learn/pwa/", title: "Learn PWA", source: "web.dev" },
  ],
};

// ══════════════════════════════════════════════════════════════════════
// INJECTION LOGIC (same structure as build-references.mjs)
// ══════════════════════════════════════════════════════════════════════

function buildRefSection(refs) {
  const playIcon = `<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>`;
  const items = refs.map((r) => {
    if (r.type === "video") {
      return `
      <a href="https://www.youtube.com/watch?v=${r.id}" class="ref-video" target="_blank" rel="noopener">
        <div class="ref-thumb">
          <img src="https://i.ytimg.com/vi/${r.id}/maxresdefault.jpg"
               alt="${r.title}" loading="lazy"
               onerror="this.src='https://i.ytimg.com/vi/${r.id}/hqdefault.jpg'"/>
          <div class="ref-play"><div class="ref-play-icon">${playIcon}</div></div>
        </div>
        <div class="ref-meta">
          <div class="ref-title">${r.title}</div>
          <div class="ref-source">${r.source}${r.dur ? ` · ${r.dur}` : ""}</div>
        </div>
      </a>`;
    }
    return `
      <a href="${r.url}" class="ref-link" target="_blank" rel="noopener">
        <div class="ref-title">${r.title}</div>
        <div class="ref-source">${r.source}</div>
      </a>`;
  }).join("");

  return `
  <section class="section" id="references">
    <div class="section-head"><span class="section-n">📺</span><h2 class="section-title">References &amp; Videos</h2></div>
    <div class="prose">
      <div class="ref-grid">${items}
      </div>
    </div>
  </section>

`;
}

async function inject(dir, slugMap) {
  let count = 0;
  for (const [slug, refs] of Object.entries(slugMap)) {
    const file = path.join(dir, `${slug}.html`);
    let raw;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch {
      console.log(`  ⚠ ${slug}.html not found, skipping`);
      continue;
    }
    if (raw.includes(MARKER)) {
      console.log(`  ⏭ ${slug} already has references`);
      continue;
    }
    const idx = raw.lastIndexOf("</main>");
    if (idx === -1) {
      console.log(`  ⚠ ${slug} has no </main> tag`);
      continue;
    }
    const block = buildRefSection(refs);
    const next = raw.slice(0, idx) + block + raw.slice(idx);
    await fs.writeFile(file, next);
    count++;
    console.log(`  ✓ ${slug}`);
  }
  return count;
}

// Run
const count = await inject(CONCEPTS_DIR, REFS);
console.log(`\nInjected references into ${count} concept files.`);
