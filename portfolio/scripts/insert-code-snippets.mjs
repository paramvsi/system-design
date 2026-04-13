#!/usr/bin/env node
// Insert a small code snippet into 30 key concept HTMLs, typically inside
// the #deep-dive or #how-it-works section. Idempotent.
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "..", "..", "concepts");

const MARKER = "data-code-snippet=\"1\"";

// Each entry: [slug, caption, language, code] — idempotent via MARKER.
const SNIPPETS = [
  ["consistent-hashing", "Consistent hash ring (30 lines)", "python", `from hashlib import md5
from bisect import bisect

class HashRing:
    def __init__(self, nodes, vnodes=150):
        self.ring = {}
        for n in nodes:
            for i in range(vnodes):
                h = int(md5(f"{n}#{i}".encode()).hexdigest(), 16)
                self.ring[h] = n
        self.sorted = sorted(self.ring)

    def get(self, key):
        h = int(md5(key.encode()).hexdigest(), 16)
        idx = bisect(self.sorted, h) % len(self.sorted)
        return self.ring[self.sorted[idx]]

    def add(self, node, vnodes=150):
        for i in range(vnodes):
            h = int(md5(f"{node}#{i}".encode()).hexdigest(), 16)
            self.ring[h] = node
        self.sorted = sorted(self.ring)

# Adding 1 shard to N=10 → only 1/11 of keys remap (vs N/2 in mod-hashing)`],

  ["bloom-filter", "Bloom filter in ~25 lines", "python", `import mmh3
from bitarray import bitarray

class BloomFilter:
    def __init__(self, size=10_000_000, k=7):
        self.size = size
        self.k = k
        self.bits = bitarray(size)
        self.bits.setall(0)

    def _hashes(self, item):
        h1 = mmh3.hash(item, 0) % self.size
        h2 = mmh3.hash(item, 1) % self.size
        return [(h1 + i * h2) % self.size for i in range(self.k)]

    def add(self, item):
        for h in self._hashes(item):
            self.bits[h] = 1

    def contains(self, item):
        return all(self.bits[h] for h in self._hashes(item))

# 10M bits + 7 hashes → ~1% false-positive at ~1M inserts; 1.2 MB total`],

  ["backpressure-flow-control", "Count-Min Sketch (streaming top-K)", "python", `import mmh3

class CountMinSketch:
    def __init__(self, width=10_000, depth=4):
        self.w, self.d = width, depth
        self.grid = [[0] * width for _ in range(depth)]

    def add(self, item, count=1):
        for i in range(self.d):
            self.grid[i][mmh3.hash(item, i) % self.w] += count

    def estimate(self, item):
        # MIN across rows — over-estimate only, never under
        return min(self.grid[i][mmh3.hash(item, i) % self.w]
                   for i in range(self.d))

# Trade: ~N×W×8 bytes for constant-space approx counts at any scale`],

  ["hyperloglog-sketches", "HyperLogLog cardinality in 20 lines", "python", `import math, mmh3

class HLL:
    def __init__(self, p=14):  # p=14 → 16 KB, ~0.8% error
        self.p = p
        self.m = 1 << p
        self.registers = [0] * self.m

    def add(self, item):
        h = mmh3.hash64(item)[0] & ((1 << 64) - 1)
        idx = h >> (64 - self.p)
        w = (h << self.p) & ((1 << 64) - 1) | (1 << (self.p - 1))
        self.registers[idx] = max(self.registers[idx],
                                  64 - w.bit_length() + 1)

    def count(self):
        alpha = 0.7213 / (1 + 1.079 / self.m)
        z = sum(2.0 ** -r for r in self.registers)
        return int(alpha * self.m * self.m / z)

# 16 KB counts cardinalities up to billions with ~0.8% error`],

  ["cache-eviction", "LRU cache — hashmap + doubly-linked list", "python", `class Node:
    __slots__ = "k", "v", "prev", "next"
    def __init__(self, k, v):
        self.k, self.v = k, v
        self.prev = self.next = None

class LRU:
    def __init__(self, cap):
        self.cap, self.map = cap, {}
        self.head, self.tail = Node(0, 0), Node(0, 0)  # sentinels
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, n):
        n.prev.next, n.next.prev = n.next, n.prev

    def _add(self, n):  # insert right after head
        n.next = self.head.next; n.prev = self.head
        self.head.next.prev = n; self.head.next = n

    def get(self, k):
        if k not in self.map: return -1
        n = self.map[k]; self._remove(n); self._add(n)
        return n.v

    def put(self, k, v):
        if k in self.map: self._remove(self.map[k])
        elif len(self.map) == self.cap:
            lru = self.tail.prev; self._remove(lru); del self.map[lru.k]
        n = Node(k, v); self._add(n); self.map[k] = n`],

  ["url-encoding-base62", "Snowflake 64-bit ID generator", "go", `package snowflake

import (
    "sync"
    "time"
)

const (
    epoch     int64 = 1577836800000 // 2020-01-01 UTC ms
    machineBits = 10
    seqBits     = 12
    maxSeq      = (1 << seqBits) - 1
)

type Node struct {
    mu       sync.Mutex
    machine  int64 // 0..1023
    lastMs   int64
    seq      int64
}

func (n *Node) NextID() int64 {
    n.mu.Lock(); defer n.mu.Unlock()
    now := time.Now().UnixMilli() - epoch
    if now == n.lastMs {
        n.seq = (n.seq + 1) & maxSeq
        if n.seq == 0 {
            for now <= n.lastMs { now = time.Now().UnixMilli() - epoch }
        }
    } else { n.seq = 0 }
    n.lastMs = now
    return (now << (machineBits+seqBits)) | (n.machine << seqBits) | n.seq
}

// 4096 IDs/ms/machine × 1024 machines = 4B IDs/sec ceiling`],

  ["circuit-breaker", "Circuit breaker state machine", "python", `import time
from enum import Enum

class State(Enum): CLOSED, OPEN, HALF_OPEN = 1, 2, 3

class CircuitBreaker:
    def __init__(self, fail_threshold=5, reset_timeout=30):
        self.fail_threshold = fail_threshold
        self.reset_timeout = reset_timeout
        self.failures = 0
        self.state = State.CLOSED
        self.opened_at = 0

    def call(self, fn, *args, **kw):
        if self.state == State.OPEN:
            if time.time() - self.opened_at >= self.reset_timeout:
                self.state = State.HALF_OPEN  # probe
            else:
                raise Exception("circuit open")
        try:
            r = fn(*args, **kw)
            self._on_success(); return r
        except Exception as e:
            self._on_failure(); raise

    def _on_success(self):
        self.failures = 0; self.state = State.CLOSED

    def _on_failure(self):
        self.failures += 1
        if self.failures >= self.fail_threshold:
            self.state = State.OPEN
            self.opened_at = time.time()`],

  ["retry-backoff-jitter", "Exponential backoff with jitter", "python", `import random, time

def retry(fn, max_attempts=5, base=0.1, cap=10.0):
    """Full-jitter exponential backoff (AWS recommended)."""
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception:
            if attempt == max_attempts - 1: raise
            # base × 2^attempt, capped; uniform jitter 0..backoff
            backoff = min(cap, base * (2 ** attempt))
            time.sleep(random.uniform(0, backoff))

# Attempt delays: 0-0.1s, 0-0.2s, 0-0.4s, 0-0.8s, 0-1.6s
# Full-jitter outperforms "backoff + small jitter" for contended resources`],

  ["rate-limiting-algorithms", "Token bucket rate limiter", "python", `import time

class TokenBucket:
    def __init__(self, rate_per_sec, burst):
        self.rate = rate_per_sec
        self.capacity = burst
        self.tokens = burst
        self.last = time.monotonic()

    def allow(self, cost=1):
        now = time.monotonic()
        # refill based on elapsed time
        self.tokens = min(self.capacity, self.tokens + (now - self.last) * self.rate)
        self.last = now
        if self.tokens >= cost:
            self.tokens -= cost
            return True
        return False

# 100 rps sustained, 500 burst → can handle short spikes without dropping`],

  ["merkle-trees", "Merkle tree root computation", "python", `import hashlib

def leaf(d): return hashlib.sha256(b"L" + d).digest()
def node(a, b): return hashlib.sha256(b"N" + a + b).digest()

def merkle_root(leaves):
    if not leaves: return None
    level = [leaf(x) for x in leaves]
    while len(level) > 1:
        if len(level) % 2: level.append(level[-1])  # dup last
        level = [node(level[i], level[i+1]) for i in range(0, len(level), 2)]
    return level[0]

def proof(leaves, idx):
    path = []
    level = [leaf(x) for x in leaves]
    while len(level) > 1:
        if len(level) % 2: level.append(level[-1])
        sibling = idx ^ 1
        path.append((level[sibling], sibling & 1))
        level = [node(level[i], level[i+1]) for i in range(0, len(level), 2)]
        idx //= 2
    return path

# Bitcoin, Git, Dynamo, ZFS — all use variants of this`],

  ["cache-stampede", "XFetch — probabilistic early recomputation", "python", `import random, time, math

def xfetch(key, ttl, beta=1.0, recompute_fn=None):
    """Probabilistically recompute before expiry; prevents stampedes."""
    value, delta, expiry = cache_get(key)  # delta = last recompute time
    now = time.time()
    if value is None or now - delta * beta * math.log(random.random()) >= expiry:
        value = recompute_fn()
        cache_set(key, value, ttl=ttl)
    return value

# Without XFetch: at TTL=T+0, all concurrent requests miss → thundering herd.
# With XFetch: probability of early recompute rises smoothly as expiry nears;
# one request wins, others keep serving the stale value until it rotates.`],

  ["idempotency", "Idempotency-key enforcement (Postgres)", "sql", `-- client sends Idempotency-Key header
-- server upserts into an idempotent-requests table:
CREATE TABLE idempotency_keys (
  key          TEXT PRIMARY KEY,
  user_id      BIGINT NOT NULL,
  request_hash TEXT NOT NULL,        -- SHA-256 of body
  response     JSONB,
  status_code  INT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL  -- e.g. now() + INTERVAL '24 hours'
);

-- On request:
-- 1. SELECT existing row FOR UPDATE
-- 2. If hit + request_hash matches → return stored response (200)
-- 3. If hit + request_hash differs → 409 Conflict
-- 4. If miss → INSERT placeholder, execute, UPDATE with response`],

  ["indexing", "Cursor-based pagination (stable under insert)", "sql", `-- ❌ OFFSET / LIMIT breaks: new rows shift everyone's view
-- SELECT * FROM posts ORDER BY id DESC LIMIT 20 OFFSET 40;

-- ✓ Cursor (opaque token = last-seen id or (ts, id) tuple):
SELECT id, title, created_at
FROM posts
WHERE (created_at, id) < ($1, $2)     -- cursor from previous page
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Encode cursor as base64(created_at || id); send to client.
-- Stable under concurrent inserts. O(log N) per page via composite index.

CREATE INDEX posts_ts_id_desc ON posts(created_at DESC, id DESC);`],

  ["distributed-locking", "Optimistic concurrency (version column)", "sql", `-- Version column incremented on every write.
CREATE TABLE orders (
  id      BIGSERIAL PRIMARY KEY,
  status  TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  ...
);

-- Update with CAS semantics:
UPDATE orders
SET status = 'shipped', version = version + 1
WHERE id = $1 AND version = $2;   -- $2 = version client fetched

-- If 0 rows updated: conflict; client re-reads + retries.
-- No locks held during user think-time. Wins on low-contention paths;
-- retry-storms on hot rows (use pessimistic there).`],

  ["event-driven-architecture", "Transactional outbox pattern", "sql", `-- Dual-write problem: write to DB + emit Kafka event atomically.
-- Solution: outbox table in same transaction as business write.

CREATE TABLE outbox (
  id            BIGSERIAL PRIMARY KEY,
  aggregate_id  BIGINT NOT NULL,
  event_type    TEXT NOT NULL,
  payload       JSONB NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  published     BOOLEAN DEFAULT false
);

-- Application writes both in one transaction:
BEGIN;
  INSERT INTO orders (...) VALUES (...);
  INSERT INTO outbox (aggregate_id, event_type, payload)
  VALUES ($orderId, 'OrderCreated', $payloadJson);
COMMIT;

-- Separate CDC process (Debezium) or polling worker reads new rows
-- from outbox, publishes to Kafka, marks published=true.`],

  ["transactions-distributed", "2PC coordinator pseudo-code", "python", `# 2PC (expensive, blocks on coordinator failure — prefer sagas where possible)

class Coordinator:
    def commit(self, txn_id, participants):
        # Phase 1: PREPARE
        votes = []
        for p in participants:
            try:
                votes.append(p.prepare(txn_id))  # writes UNDO + REDO log
            except Exception:
                votes.append(False)
        if not all(votes):
            for p in participants: p.rollback(txn_id)
            return "aborted"

        # Phase 2: COMMIT
        self.log.write(f"COMMIT {txn_id}")  # durable decision point
        for p in participants:
            while True:
                try: p.commit(txn_id); break
                except Exception: continue   # infinitely retry
        return "committed"

# Problem: coordinator crash between phase 1 and phase 2 blocks every
# participant holding prepared locks. This is why sagas + idempotency
# wins for most distributed-transaction use cases.`],

  ["event-sourcing-cqrs", "Saga with compensating actions", "python", `# Order saga: reserve → charge → ship → notify
# On failure, compensate completed steps in reverse order.

class Saga:
    def __init__(self, steps):
        self.steps = steps  # [(action, compensation), ...]
        self.completed = []

    def run(self, ctx):
        for action, compensate in self.steps:
            try:
                action(ctx)
                self.completed.append(compensate)
            except Exception as e:
                # Roll back completed steps in reverse
                for c in reversed(self.completed):
                    try: c(ctx)
                    except: pass  # compensations themselves must be idempotent
                raise

# Use Saga when: transactions span services, low contention, some slack OK
# Don't use Saga when: strict ACID required, low value (just pay the cost of 2PC)`],

  ["write-ahead-log-wal", "Write-ahead log append + flush", "python", `import json, os, time

class WAL:
    def __init__(self, path, sync_every_ms=5):
        self.f = open(path, "ab")
        self.sync_every_ms = sync_every_ms
        self.last_sync = time.monotonic() * 1000

    def append(self, record):
        line = json.dumps(record) + "\\n"
        self.f.write(line.encode())
        now = time.monotonic() * 1000
        if now - self.last_sync >= self.sync_every_ms:
            self.f.flush()
            os.fsync(self.f.fileno())
            self.last_sync = now

# Group commit: batch records between fsyncs. Trade durability window
# (bounded by sync_every_ms) for dramatically higher write throughput.`],

  ["vector-clocks-lww", "Vector clock merge (causality tracking)", "python", `def merge(a, b):
    """Pointwise max: a[node] = max(a[node], b[node])"""
    out = dict(a)
    for node, ts in b.items():
        out[node] = max(out.get(node, 0), ts)
    return out

def happens_before(a, b):
    """True if a ⇒ b (a causally precedes b)"""
    strict = False
    for node in a.keys() | b.keys():
        av, bv = a.get(node, 0), b.get(node, 0)
        if av > bv: return False
        if av < bv: strict = True
    return strict

def concurrent(a, b):
    return not happens_before(a, b) and not happens_before(b, a)

# Example: A=[A1,B0], B=[A0,B1] → concurrent (neither precedes).
# On read, server returns both versions; app resolves.`],

  ["batch-vs-stream-processing", "Reservoir sampling (uniform sample from stream)", "python", `import random

def reservoir_sample(stream, k):
    """Uniform sample of k items from unknown-length stream."""
    sample = []
    for i, item in enumerate(stream):
        if i < k:
            sample.append(item)
        else:
            # Each new item has k / (i+1) probability of replacing
            j = random.randint(0, i)
            if j < k:
                sample[j] = item
    return sample

# Property: after processing N items, each of the N had equal k/N probability
# of being in the final sample. O(1) memory, O(N) time.`],

  ["sql-vs-nosql", "Bulk insert via Postgres COPY", "sql", `-- Single-row INSERTs: ~5,000/sec
-- Batched INSERT multi-VALUES: ~50,000/sec
-- COPY FROM STDIN: ~500,000/sec (100x faster)

-- Client side (psycopg):
with conn.cursor() as cur:
    with cur.copy("COPY events (user_id, ts, type) FROM STDIN") as copy:
        for row in rows:
            copy.write_row((row.user_id, row.ts, row.type))

-- Caveats:
-- * No triggers or constraints fire per-row as they do with INSERT
-- * Entire COPY is single transaction; huge copy = huge undo log
-- * Common technique: COPY to staging table, then INSERT INTO main FROM staging`],

  ["quorum", "Quorum N/R/W (Dynamo-style)", "python", `# N = total replicas, R = read quorum, W = write quorum
# Consistency iff R + W > N

def write(key, value, replicas, W):
    acks = 0
    for r in replicas:
        try:
            r.put(key, value)
            acks += 1
            if acks >= W: return "ok"
        except Exception:
            pass
    return "failed" if acks < W else "ok"

def read(key, replicas, R):
    results = []
    for r in replicas:
        try: results.append(r.get(key))
        except: pass
        if len(results) >= R: break
    # Return value with latest vector clock; trigger read-repair for stale
    return max(results, key=lambda x: x.version) if results else None

# N=3, R=2, W=2 → tolerates 1 failure per op; strong consistency.
# N=3, R=1, W=3 → fast reads, slow writes.
# N=3, R=1, W=1 → eventual consistency.`],

  ["database-types", "LSM-tree sketch (memtable + SSTables)", "python", `# LSM = Log-Structured Merge tree. Writes: append to memtable + WAL.
# Reads: check memtable → bloom filters → SSTables from newest to oldest.

class LSM:
    def __init__(self, memtable_limit=10**6):
        self.memtable = {}  # sorted map (in-mem B-tree in real engines)
        self.wal = WAL("lsm.wal")
        self.sstables = []  # list of on-disk immutable files, newest first

    def put(self, k, v):
        self.wal.append((k, v))
        self.memtable[k] = v
        if len(self.memtable) >= 10**6:
            self._flush()

    def _flush(self):
        sst = SSTable.from_dict(self.memtable)
        self.sstables.insert(0, sst)
        self.memtable = {}
        self.wal.rotate()

    def get(self, k):
        if k in self.memtable: return self.memtable[k]
        for sst in self.sstables:
            if k in sst.bloom:  # cheap probabilistic check
                v = sst.get(k)
                if v is not None: return v
        return None

# Compaction merges older SSTables; Cassandra, RocksDB, LevelDB all do this.`],

  ["read-repair-anti-entropy", "Read-repair in quorum read", "python", `def read_with_repair(key, replicas, R):
    # Collect R responses
    responses = []
    for r in replicas:
        try: responses.append((r, r.get(key)))
        except: pass
        if len(responses) >= R: break

    if not responses: return None

    # Pick version with latest vector clock
    latest = max(responses, key=lambda x: x[1].version if x[1] else 0)

    # Read-repair: fire-and-forget writes to replicas with stale data
    for r, resp in responses:
        if resp is None or resp.version < latest[1].version:
            try: r.put(key, latest[1])  # non-blocking; doesn't affect caller
            except: pass

    return latest[1]

# Lightweight anti-entropy: stale replicas caught up on every read they serve.`],

  ["mobile-offline-first-sync", "G-Counter CRDT (grow-only counter)", "python", `class GCounter:
    """Each replica tracks its own contribution; total = sum."""
    def __init__(self, replica_id):
        self.replica = replica_id
        self.counts = {replica_id: 0}

    def inc(self, n=1):
        self.counts[self.replica] += n

    def value(self):
        return sum(self.counts.values())

    def merge(self, other):
        for r, v in other.counts.items():
            self.counts[r] = max(self.counts.get(r, 0), v)
        return self

# Two phones increment offline; reconnect; merge = sum of each replica's
# own count. Associative, commutative, idempotent. No conflict resolution needed.

# PN-Counter = two G-counters (inc + dec). Supports decrement.`],

  ["observability-triad", "Exponential moving average for trending detection", "python", `class EMA:
    """Smoothed running average with geometric decay."""
    def __init__(self, alpha=0.1):
        self.alpha = alpha  # higher = faster response, noisier
        self.value = None

    def update(self, x):
        if self.value is None:
            self.value = x
        else:
            self.value = self.alpha * x + (1 - self.alpha) * self.value
        return self.value

# For trending: ratio = current_rate / EMA_rate.
# > 1.5x = spiking.  α=0.1 covers ~10 periods; pick for your window.`],

  ["leader-election", "Raft leader election (pseudocode)", "python", `# Raft: followers → candidate → leader.
# Random election timeout (150–300ms) prevents split votes.

import random

class RaftNode:
    def __init__(self, node_id, peers):
        self.id = node_id
        self.peers = peers
        self.term = 0
        self.voted_for = None
        self.state = "follower"
        self.timeout = random.uniform(0.15, 0.30)

    def on_timeout(self):
        # Followers promote to candidate when leader silent too long
        self.state = "candidate"
        self.term += 1
        self.voted_for = self.id
        votes = 1
        for p in self.peers:
            if p.request_vote(self.term, self.id): votes += 1
        if votes > (len(self.peers) + 1) // 2:
            self.state = "leader"
            self.start_heartbeats()
        else:
            self.state = "follower"  # lost or split

    def request_vote(self, term, candidate_id):
        if term > self.term and self.voted_for is None:
            self.term, self.voted_for = term, candidate_id
            return True
        return False`],

  ["kafka-internals", "Top-K with heap + CMS", "python", `import heapq
import mmh3

class TopK:
    """Track top K heavy hitters in a stream using CMS + min-heap."""
    def __init__(self, k=10, cms_width=10**4, cms_depth=4):
        self.k = k
        self.cms = CountMinSketch(cms_width, cms_depth)
        self.heap = []  # min-heap of (count, item)
        self.in_heap = set()

    def add(self, item):
        self.cms.add(item)
        count = self.cms.estimate(item)
        if item in self.in_heap:
            # Rebuild heap with updated count (simple)
            self.heap = [(c, i) for c, i in self.heap if i != item]
            heapq.heappush(self.heap, (count, item))
        elif len(self.heap) < self.k:
            heapq.heappush(self.heap, (count, item))
            self.in_heap.add(item)
        elif count > self.heap[0][0]:
            _, removed = heapq.heapreplace(self.heap, (count, item))
            self.in_heap.remove(removed); self.in_heap.add(item)

    def top(self):
        return sorted(self.heap, reverse=True)`],

  ["message-queue-vs-pubsub", "Simple in-memory pub/sub with backpressure", "python", `import asyncio
from collections import defaultdict

class PubSub:
    def __init__(self, buffer_size=1000):
        self.channels = defaultdict(list)  # topic -> [asyncio.Queue]

    def subscribe(self, topic):
        q = asyncio.Queue(maxsize=1000)
        self.channels[topic].append(q)
        return q

    async def publish(self, topic, msg):
        dead = []
        for q in self.channels[topic]:
            try:
                q.put_nowait(msg)   # drop on backpressure, don't block
            except asyncio.QueueFull:
                dead.append(q)       # slow consumer → disconnect
        for q in dead: self.channels[topic].remove(q)

# Real systems (Redis pub/sub, Kafka) follow this shape but with durability
# + cluster-wide routing. In-memory version is the mental model.`],

  ["cdc-change-data-capture", "Event-sourced aggregate rebuild", "python", `class BankAccount:
    """State is derived by replaying events; events are source of truth."""
    def __init__(self):
        self.balance = 0
        self.uncommitted = []

    def apply(self, event):
        if event["type"] == "deposit":
            self.balance += event["amount"]
        elif event["type"] == "withdraw":
            self.balance -= event["amount"]

    @classmethod
    def from_history(cls, events):
        account = cls()
        for e in events: account.apply(e)
        return account

    def deposit(self, amount):
        event = {"type": "deposit", "amount": amount}
        self.apply(event)           # apply to in-memory state
        self.uncommitted.append(event)

# Store events in append-only log. Rebuild state on load.
# Snapshots every N events keep replay time bounded.`],
];

let changed = 0;
for (const [slug, caption, lang, code] of SNIPPETS) {
  const file = path.join(SRC_DIR, `${slug}.html`);
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (e) {
    console.log(`  ! skip ${slug}: ${e.message}`);
    continue;
  }
  if (raw.includes(MARKER) && raw.includes(`>${caption}<`)) {
    console.log(`  · ${slug}: already has snippet`);
    continue;
  }
  // Find insertion point: prefer #how-it-works, then #deep-dive, then first section
  const escapedCode = code
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const block = `
      <div class="code-caption" ${MARKER}>${caption}</div>
      <pre><code class="lang-${lang}">${escapedCode}</code></pre>
  `;
  // Prefer inserting just before </div> that closes the first .prose inside the target section
  const sectionIdx = raw.search(/id="(how-it-works|deep-dive)"/);
  if (sectionIdx === -1) {
    console.log(`  ! ${slug}: no how-it-works/deep-dive section`);
    continue;
  }
  // Find the first `</div>` that closes `<div class="prose">` after that
  const proseIdx = raw.indexOf('<div class="prose">', sectionIdx);
  if (proseIdx === -1) {
    console.log(`  ! ${slug}: no .prose in target section`);
    continue;
  }
  // Walk forward from proseIdx counting <div> nesting until we close .prose
  let i = proseIdx + '<div class="prose">'.length;
  let depth = 1;
  while (i < raw.length && depth > 0) {
    const open = raw.indexOf('<div', i);
    const close = raw.indexOf('</div>', i);
    if (close === -1) break;
    if (open !== -1 && open < close) { depth++; i = open + 4; }
    else { depth--; i = close + 6; }
  }
  const insertAt = i - 6; // just before the matching </div>
  const next = raw.slice(0, insertAt) + block + raw.slice(insertAt);
  await fs.writeFile(file, next);
  console.log(`  ✓ ${slug}: inserted snippet (${lang}, ${code.split("\n").length} lines)`);
  changed++;
}
console.log(`\nDone — ${changed} concept file(s) updated.`);
