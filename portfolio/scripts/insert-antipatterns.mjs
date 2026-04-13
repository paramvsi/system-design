#!/usr/bin/env node
// Insert a #antipatterns section before #interview-tips in top problem HTMLs.
// Idempotent: skips files that already have <section ... id="antipatterns">.
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "..", "..");

const AP = {
  "instagram": [
    ["Store photos + videos in Postgres as blobs", "Database sharding is for rows, not multi-MB binaries. Every query pulls massive bytes; cache churn destroys hit ratio.", "Direct-to-S3 via pre-signed URLs; metadata rows in Postgres reference S3 keys; CDN serves derivatives."],
    ["Fan out on write to all 500k followers of a celebrity", "10M celebrities × average-follower-count = trillions of writes/day. Hot-key Redis explodes.", "Hybrid fan-out: push to normal users' timelines, pull-on-read for celebrity accounts."],
    ["Transcode video synchronously on upload", "CPU-bound work on the request path. One viral moment = API tier down.", "Upload returns immediately; async transcoder consumes from a queue and emits derivatives."],
  ],
  "slack-discord": [
    ["One WebSocket server per user", "Stateful long-lived connections don't scale horizontally with naive sharding.", "Pool of gateway servers each holding tens of thousands of conns; consistent hashing by conn_id."],
    ["Persist message in Kafka as source of truth", "Kafka is event log, not OLTP. Random access for scrollback is slow.", "Persist in Cassandra (partition by channel_id, clustering by message_id); Kafka only for fan-out notify."],
    ["Broadcast every message to every channel subscriber via WebSocket", "500k-member Discord channels × 1 msg = 500k WS sends. Infrastructure melts.", "Lazy loading: only users actively viewing get real-time pushes; others see unread counters + fetch on open."],
  ],
  "uber-system-design": [
    ["Nearest-driver wins every trip", "Greedy local assignment leaves Dashers idle on one side, riders waiting on other.", "2-second batched window + Hungarian-algorithm assignment optimizing global score (distance, ETA, fairness)."],
    ["Single Postgres table for all locations", "Millions of driver location pings/sec melts OLTP. Geo query on B-tree is O(N).", "Redis GEO or H3 hex-cell index; ring queries on cell + 18 neighbors; history to Cassandra."],
    ["Strong consistency on all trip state", "2PC across driver + rider + payments is slow AND brittle.", "Saga with idempotent steps; compensating actions on failure; strong only on fund movements."],
  ],
  "004-whatsapp-system-design": [
    ["Relational DB with rows per message", "~100B messages/day on a RDBMS is hopeless.", "Cassandra (partition by chat_id, clustering by ts); cold data tiered to cheaper storage."],
    ["Always-on server storage for all media", "S3 bills at EB scale get expensive.", "E2E encrypted media; server holds encrypted blob briefly, expires after recipient fetches."],
    ["Single global WebSocket gateway", "Cross-region latency kills typing indicators + delivery receipts.", "Regional gateways; users connect nearest; cross-region messages routed via Kafka-style log."],
  ],
  "002-news-feed": [
    ["Scan all posts, filter by follow graph, sort by time", "O(N × following) per feed load. Dies past ~1M users.", "Pre-computed sorted-set feed per user; fan-out-on-write for normal users."],
    ["ElasticSearch as primary feed store", "Great for search; suboptimal for infinite-scroll + real-time inserts.", "Redis sorted sets for hot feed; ES for search + analytics."],
    ["Re-rank every feed request from scratch", "Ranking 5000 candidates per load × 100M DAU is compute-bound.", "Pre-compute ranked batches offline; rerank top-200 online with lightweight ML."],
  ],
  "005-youtube-netflix": [
    ["Stream directly from S3", "Origin bandwidth bills + latency kill the playback.", "Multi-CDN edge caching; HLS segments served from edges; origin is last resort."],
    ["Transcode on playback request", "GPU time per request is absurd; viewers see spinner for minutes.", "Pre-transcode all renditions on upload; manifest points at pre-built segments."],
    ["Stream a single 1080p file to all devices", "Mobile on 3G can't handle 1080p; desktop wants 4K.", "Adaptive bitrate (HLS/DASH); player chooses rendition per-segment based on bandwidth."],
  ],
  "search-engine": [
    ["Grep-style linear scan over all docs", "100B pages × 100 KB = you're done.", "Inverted index per term; posting lists; scatter-gather across document-sharded index."],
    ["One giant inverted index on one machine", "Doesn't fit; one query's miss kills everyone.", "Document-sharded across ~1000 shards; each returns local top-K; aggregator merges."],
    ["Rerank all 100B results with BERT for every query", "BERT at 100K QPS over 100B docs is impossible.", "Two-stage: cheap BM25 over millions → heavy ML rerank over top-1000."],
  ],
  "doordash-uber-eats": [
    ["Dispatch every order instantly on arrival", "Greedy assignment misses batching opportunities; Dashers deadhead.", "2-second batched window; Hungarian assignment with batching bonus."],
    ["Poll for order status every second", "Millions of clients × 1/sec = DDoS on your own API.", "WebSocket push or long-poll; status delta events; client pulls on wake."],
    ["One `orders` table with everything", "Merchant / Dasher / Rider / Payments all fight over this hot row.", "Split into Marketplace / Order / Logistics / Payment services with their own stores."],
  ],
  "payment-gateway": [
    ["Single DB transaction wrapping bank call", "External call inside a lock is minutes of blocked rows.", "Auth/capture are separate external calls; saga with idempotency key per step."],
    ["Retry failed payments blindly", "Double-charge = angry customers + chargebacks.", "Idempotency key per attempt; dedup on (key, user). Only retry on safe errors (5xx, timeouts)."],
    ["Store card numbers directly", "PCI nightmare + breach exposure.", "Tokenize via provider (Stripe, Braintree); store only the token + last-4 + exp."],
  ],
  "stock-exchange": [
    ["Match orders across threads for parallelism", "Breaks price-time priority; non-deterministic fills.", "Single-threaded matching per symbol; state journaled; deterministic replay."],
    ["Lock rows in Postgres for each fill", "Nowhere near the required throughput (10-100k trades/sec/symbol).", "In-memory order book; fills written via journal, settled async to DB."],
    ["Use message queue (Kafka) for order routing", "Ordering guarantee isn't strict enough; spikes add latency.", "Low-latency sequencer with durable journal; Kafka for post-trade analytics only."],
  ],
  "ticketmaster-system-design": [
    ["Optimistic concurrency on seat row", "100k people all try to grab seat A12 simultaneously → 99,999 retries.", "Pessimistic lock + queue-based waiting room; users enter sequentially."],
    ["Cache seat availability aggressively", "TTL of seconds means 10k users see the same seat as available.", "Real-time availability; SSE/WebSocket updates; cache only static (event, venue) data."],
    ["One monolithic DB transaction from reserve → payment", "Transaction holds seat locks for minutes while user types card info.", "Two-phase: soft hold (5 min TTL) then payment; explicit release on timeout."],
  ],
  "003-google-drive": [
    ["Upload full file on every change", "Changing one byte of a 2GB video uploads 2GB.", "Chunked content-addressable storage (4MB blocks, SHA-256 keyed); dedup + delta sync."],
    ["Resolve all conflicts via OT / CRDT", "File systems don't know file semantics; a .docx CRDT would corrupt docs.", "Save both versions as `foo.txt` and `foo (conflicted copy).txt`; let user pick."],
    ["Notify all N users' devices by polling every 30s", "Scales linearly with user count × device count.", "Long-poll / WebSocket notify; clients pull delta since last cursor."],
  ],
  "007-rate-limiter": [
    ["Fixed-window counters in Redis", "Burst right at the window boundary passes 2× the limit.", "Sliding-window log or sliding-window counter; smooths burst at boundary."],
    ["Check limit in app server memory", "Each instance has its own counter; user rotates through instances.", "Centralized Redis INCR with TTL; or token bucket per user_id."],
    ["One bucket for all traffic", "Can't limit per-API or per-user class.", "Hierarchy: global → per-tenant → per-endpoint → per-user; deny if any exceeded."],
  ],
  "notification-system": [
    ["Send every notification to every device immediately", "10M notifications/sec ingest; APNs/FCM rate-limits throttle you.", "Queue + batch per-device-token; respect provider rate limits; dedup collapsed notifications."],
    ["Send SMS for every in-app notification", "Cost explodes; users unsubscribe.", "Channel preferences per user; in-app default; SMS only for critical (payment, 2FA)."],
    ["Write notification to DB synchronously before acking API", "Notification service becomes part of the hot path.", "Fire-and-forget event to Kafka; notify service consumes + delivers async."],
  ],
  "006-typeahead-suggestions": [
    ["Scan full text of all suggestions per keystroke", "Linear in corpus size; 50K QPS on 100M entries is dead.", "Pre-built trie or aho-corasick index; sublinear lookup."],
    ["Hit your authoritative DB on every keystroke", "Debounced or not, DB dies.", "Dedicated suggestion service with in-memory trie; rebuilt from query logs offline."],
    ["Use generic search index (ElasticSearch) for autocomplete", "Overkill for the latency + ranking needs.", "Tiny dedicated index with heavy-hitter ranking from query logs."],
  ],
};

const MARKER = 'id="antipatterns"';
const INSERT_BEFORE_PATTERNS = [
  '<section class="section" id="interview-tips">',
  '<div class="section" id="interview-tips">',
  '<!-- ═══════════════ 13 · INTERVIEW TIPS ═══════════════ -->',
];

function buildBlock(slug, items) {
  const rows = items.map(([bad, why, good]) => `
    <div class="antipattern">
      <div class="icon">🚫</div>
      <div>
        <div class="bad">${bad}</div>
        <p class="why">${why}</p>
      </div>
      <div class="good"><strong>✓ Better:</strong> ${good}</div>
    </div>`).join("");
  return `
  <section class="section" id="antipatterns">
    <div class="section-head"><span class="section-n">⚠</span><h2 class="section-title">Anti-patterns</h2></div>
    <div class="prose">
      ${rows}
    </div>
  </section>

  `;
}

let changed = 0;
for (const [slug, items] of Object.entries(AP)) {
  const file = path.join(SRC_DIR, `${slug}.html`);
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (e) {
    console.log(`  ! skip ${slug}: ${e.message}`);
    continue;
  }
  if (raw.includes(MARKER)) {
    console.log(`  · ${slug}: already has antipatterns`);
    continue;
  }
  let idx = -1;
  for (const p of INSERT_BEFORE_PATTERNS) {
    idx = raw.indexOf(p);
    if (idx !== -1) break;
  }
  if (idx === -1) {
    console.log(`  ! ${slug}: no interview-tips section found`);
    continue;
  }
  const block = buildBlock(slug, items);
  const next = raw.slice(0, idx) + block + raw.slice(idx);
  await fs.writeFile(file, next);
  console.log(`  ✓ ${slug}: inserted ${items.length} antipatterns`);
  changed++;
}
console.log(`\nDone — ${changed} file(s) updated.`);
