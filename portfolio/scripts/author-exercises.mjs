#!/usr/bin/env node
// Emit 15 exercise HTML files under /exercises/.
// Each file is self-contained: #problem hero + #prompt + #hints + #rubric + #redflags.
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "..", "exercises");

await fs.mkdir(OUT_DIR, { recursive: true });

/**
 * Each exercise:
 * { slug, title, accent:{h,s,l}, prompt, budget, hints:[3], rubric:[ {points, desc} ×8 ],
 *   redflags:[5], refProblem:slug }
 */
const EX = [
  {
    slug: "exercise-instagram",
    title: "Instagram / Photo + Reels Sharing",
    accent: { h: 330, s: 72, l: 52 },
    prompt: "Design a photo + short-video sharing app at planet scale. 2B MAU, ~95M uploads/day, read-heavy ~100:1. Home feed blends followed accounts with algorithmic recommendations; reels feed is purely algorithmic.",
    budget: "45 min whiteboard",
    refProblem: "instagram",
    hints: [
      "Split the problem into (a) media pipeline, (b) feed, (c) reels ranker. They have different architectures and different read/write ratios.",
      "For feed: hybrid fan-out. Push-on-write to normal users, pull-on-read for celebrities. The threshold is the design choice.",
      "For media: direct-to-S3 uploads with pre-signed URLs; async transcoding; CDN with tiered storage for cost.",
    ],
    rubric: [
      { points: 1, desc: "Back-of-envelope: 95M uploads/day → ~1,200/sec writes, ~290k feed loads/sec, ~3 PB/day media" },
      { points: 2, desc: "Media pipeline: direct-to-S3 via pre-signed URLs; async transcoder emits 5–10 derivatives; CDN lazy-pulls on first view" },
      { points: 2, desc: "Hybrid fan-out explicitly: push for ≤ N-follower users, pull-on-read for celebrities (N ≈ 100k follower threshold)" },
      { points: 1, desc: "Feed storage: Redis sorted-sets per user (timeline); posts sharded by user_id in Cassandra" },
      { points: 1, desc: "Reels vs home feed are separate products: different ranker, different candidate pool" },
      { points: 1, desc: "Storage tiering: hot (SSD) / warm (HDD) / cold (Glacier) — discusses cost saving math" },
      { points: 1, desc: "Mentions collapse_id or equivalent for dedup across retries; idempotency on PUT" },
      { points: 1, desc: "Addresses failure modes: celebrity hot-key on feed cache; upload token abuse; CDN cache miss cascade" },
    ],
    redflags: [
      "Proposes storing photo bytes in Postgres / MySQL",
      "Uploads go through app servers (byte proxy) instead of direct-to-S3",
      "Fan-out naively to all followers regardless of celebrity status",
      "Synchronous transcoding blocking the upload request",
      "Ignores feed read QPS (290k/sec) — treats as just a write problem",
    ],
  },
  {
    slug: "exercise-slack-discord",
    title: "Slack / Discord — Real-Time Messaging",
    accent: { h: 250, s: 65, l: 55 },
    prompt: "Design Slack or Discord. Real-time team messaging with channels, DMs, threads, reactions, presence, file sharing. 10M concurrent WebSocket connections per region; channels up to 500k members (Discord large guilds).",
    budget: "45 min whiteboard",
    refProblem: "slack-discord",
    hints: [
      "The hard part is the WebSocket gateway tier — tens of millions of long-lived connections. Stateful, sticky, connection-oriented. Different from REST.",
      "Large channels break naive fan-out. A 500k-member channel can't push every message to every member's WebSocket.",
      "Separate the durable message log (Cassandra) from the real-time notify fabric (Redis pub/sub). They have different consistency + latency needs.",
    ],
    rubric: [
      { points: 1, desc: "WebSocket gateway tier ~500 servers × 20k conns each; consistent-hash LB by conn_id" },
      { points: 2, desc: "Per-channel publish fan-out: only gateways with active subscribers get the message (not all N gateways)" },
      { points: 2, desc: "Cassandra for durable message history: partition by channel_id, clustering by monotonic message_id" },
      { points: 1, desc: "Redis pub/sub (not Kafka) for real-time delivery — sub-ms latency; durability is Cassandra's job" },
      { points: 1, desc: "Large-guild lazy load: channels > 75k members don't push real-time to non-viewers; only unread counts" },
      { points: 1, desc: "Presence as separate service; batched + coalesced; tolerates brief staleness" },
      { points: 1, desc: "Client-side message_id + nonce for dedup; clients sort by message_id" },
      { points: 1, desc: "Graceful reconnect: session resume with sequence number for replay" },
    ],
    redflags: [
      "Proposes single Postgres table for all messages",
      "Doesn't mention WebSocket — uses HTTP polling",
      "Broadcasts every large-channel message to every member's WebSocket",
      "Conflates durable storage with notify fabric (e.g., Kafka for both)",
      "Ignores presence as a scale problem",
    ],
  },
  {
    slug: "exercise-uber",
    title: "Uber / Lyft — Ride Dispatch",
    accent: { h: 200, s: 70, l: 45 },
    prompt: "Design Uber. Riders request; nearby driver assigned; live tracking; dynamic pricing; payments. ~10M rides/day; dispatch latency < 3s; ETA accuracy ±3 min p90.",
    budget: "45 min whiteboard",
    refProblem: "uber-system-design",
    hints: [
      "Dispatch is not nearest-driver. It's a batched (1–2s window) assignment problem optimizing multiple objectives.",
      "Geospatial index (H3 / geohash / quadtree) for 'nearby drivers' queries at high QPS.",
      "ETA + routing is ML, not distance-over-speed. Features include time-of-day, traffic, driver profile, historical data.",
    ],
    rubric: [
      { points: 1, desc: "BoE: ~116 rides/sec avg, ~300K active drivers, ~150K location-pings/sec baseline" },
      { points: 2, desc: "Dispatch as batched (~2s window) assignment problem; Hungarian algorithm over (driver, ride) scores" },
      { points: 2, desc: "H3 hexagonal cells for geo-index; ring queries for nearby drivers; Redis GEO as implementation" },
      { points: 1, desc: "Saga pattern for trip lifecycle: request → assign → pickup → drop → pay — each idempotent step" },
      { points: 1, desc: "ML-based ETA: GBDT model with distance, traffic, time-of-day, driver speed; not simple distance/speed" },
      { points: 1, desc: "Surge pricing: real-time feature of demand/supply ratio per region; enforced at quote time, locked for N min" },
      { points: 1, desc: "Discusses how driver location pings are downsampled (every 4s, not every 100ms) + stored tiered" },
      { points: 1, desc: "Failure handling: dispatch fallback to nearest-driver on ML outage; payment held on auth before assign" },
    ],
    redflags: [
      "Proposes nearest-driver-wins greedy assignment (doesn't discuss batching)",
      "SQL table for driver locations with no geospatial index",
      "ETA is 'distance / avg_speed' with no ML",
      "2-phase commit across driver / rider / payment (should be saga)",
      "Ignores surge pricing complexity",
    ],
  },
  {
    slug: "exercise-whatsapp",
    title: "WhatsApp — Chat at Planet Scale",
    accent: { h: 145, s: 55, l: 45 },
    prompt: "Design WhatsApp. 2B users, ~100B messages/day, end-to-end encrypted, works on flaky mobile networks, ~1-sec delivery when both online.",
    budget: "45 min whiteboard",
    refProblem: "004-whatsapp-system-design",
    hints: [
      "E2E encryption changes storage design — server stores ciphertext blobs, not message content. Can't search server-side.",
      "Offline queue: recipient offline = message held at server, delivered on reconnect.",
      "Per-user mailbox sharding is the core partitioning choice.",
    ],
    rubric: [
      { points: 1, desc: "BoE: 100B/day → ~1.2M msgs/sec avg, peaks ~3M/sec; ~10KB avg (text); ~1MB (media)" },
      { points: 2, desc: "E2E encryption via Signal protocol (X3DH + Double Ratchet); server never sees plaintext" },
      { points: 2, desc: "Per-user mailbox sharded by user_id; messages held until ack from recipient's device" },
      { points: 1, desc: "Persistent WebSocket (or XMPP) per device for push; reconnect replay on window" },
      { points: 1, desc: "Media separately in S3-like blob store, referenced by metadata; expire after recipient fetches" },
      { points: 1, desc: "Delivery receipts + read receipts as explicit events; privacy settings gate" },
      { points: 1, desc: "Group chat: server broadcasts to all members' queues; each is encrypted per-recipient (Sender Keys)" },
      { points: 1, desc: "Addresses cold-start: first-time device auth + key exchange; backup encrypted with user-held key" },
    ],
    redflags: [
      "Stores messages in RDBMS with billion-row table",
      "Proposes server-side search of chat history (breaks E2E)",
      "Doesn't mention E2E at all",
      "Ignores offline delivery (assumes both parties always online)",
      "Group chats via single 'group message' row (doesn't scale or re-encrypt per recipient)",
    ],
  },
  {
    slug: "exercise-news-feed",
    title: "Twitter / News Feed",
    accent: { h: 210, s: 85, l: 50 },
    prompt: "Design Twitter's home timeline. 500M DAU, average follows 200 accounts, ~6K tweets/sec global, feed load < 200ms p99.",
    budget: "45 min whiteboard",
    refProblem: "002-news-feed",
    hints: [
      "Fan-out on write vs on read — this is the canonical tradeoff. What if a user follows a celebrity with 100M followers?",
      "Hybrid: push to most users, pull for celebrities. The cutover threshold is a key design decision.",
      "Pre-compute materialized feeds. Don't query at read time from 200 users × days-of-tweets.",
    ],
    rubric: [
      { points: 1, desc: "BoE: ~290K feed loads/sec; 6K tweets/sec × 200 fan-out = 1.2M fan-out events/sec worst case" },
      { points: 2, desc: "Hybrid fan-out explicit: push-on-write for normal users (≤ 100K followers), pull-on-read for celebrities" },
      { points: 2, desc: "Feed storage: Redis sorted-set per user (timeline), TTL-bounded; backfill from tweet DB when empty" },
      { points: 1, desc: "Tweet storage: Cassandra, partition by user_id; read path: GET by tweet_id" },
      { points: 1, desc: "Ranker vs chronological: mention algorithmic re-ranking with recent engagement features" },
      { points: 1, desc: "Cache warming for users about to log in; invalidation on new tweet from followed account" },
      { points: 1, desc: "Image/video handled via URL reference; CDN serves; tweet stores cheap pointer only" },
      { points: 1, desc: "Addresses hot-key problem on celebrity's fan-out queue; backpressure / shedding plan" },
    ],
    redflags: [
      "Naive: query all followed users' tweets at read time and sort (doesn't scale past ~1K users)",
      "Ignores celebrity problem; fan-out-on-write to 100M followers",
      "Stores full tweet bytes in feed (should be IDs only with DB fetch)",
      "No eviction / TTL on pre-computed feeds (memory explodes)",
      "Single Postgres table for all tweets (billions of rows)",
    ],
  },
  {
    slug: "exercise-youtube-netflix",
    title: "YouTube / Netflix — Video Streaming",
    accent: { h: 0, s: 75, l: 50 },
    prompt: "Design YouTube's video delivery. Hundreds of millions of hours/day streamed, 4K support, adaptive bitrate, global latency < 500ms playback-start.",
    budget: "45 min whiteboard",
    refProblem: "005-youtube-netflix",
    hints: [
      "Transcoding ladder: single upload becomes 5–10 renditions (240p through 4K) in multiple codecs (H.264, H.265, AV1).",
      "Adaptive bitrate (HLS / DASH) — manifest file + 6-second segments. Client switches rendition per segment.",
      "Multi-CDN: edge caches serve most traffic. Origin is rarely hit.",
    ],
    rubric: [
      { points: 1, desc: "BoE: 500 hours uploaded/min → 720K hours/day; avg bitrate 5 Mbps; ~30 PB/day egress peak" },
      { points: 2, desc: "Transcoding ladder on upload: 240p/480p/720p/1080p/4K × H.264/H.265/AV1; async via GPU farm" },
      { points: 2, desc: "HLS/DASH adaptive bitrate with 6-sec segments; client measures bandwidth, picks next segment's rendition" },
      { points: 1, desc: "Multi-CDN edge caching; origin shield for missed edge queries; cold tail eviction" },
      { points: 1, desc: "Manifest file (.m3u8) + segment URLs; player downloads manifest + segments from CDN" },
      { points: 1, desc: "Pre-encode popular videos to all renditions immediately; long-tail can lazily transcode on first view" },
      { points: 1, desc: "Direct-to-S3 upload; transcoder consumes from queue; 30-min 1080p = ~30 sec GPU transcode" },
      { points: 1, desc: "Metrics + playback analytics: bitrate switches, rebuffers; fed into CDN routing decisions" },
    ],
    redflags: [
      "Streams single 1080p file to all devices (no adaptive)",
      "Transcodes on playback request",
      "Origin directly serves viewers (no CDN)",
      "Uses WebRTC or similar real-time protocol for video-on-demand (wrong tool)",
      "Ignores codec diversity (H.264 + H.265 + AV1) and client compatibility",
    ],
  },
  {
    slug: "exercise-search-engine",
    title: "Google Search — Web Search Engine",
    accent: { h: 205, s: 75, l: 48 },
    prompt: "Design Google's web search. 100B pages indexed, 100K queries/sec, < 200ms p99 query latency. Crawl + index + rank.",
    budget: "45 min whiteboard",
    refProblem: "search-engine",
    hints: [
      "Three independent pipelines: crawl (continuous), index build (batch), query serving (real-time). Don't conflate.",
      "Document-sharded inverted index across ~1000 shards. Scatter-gather at query time.",
      "Two-stage ranking: cheap BM25 over millions → heavy BERT rerank over top-1000.",
    ],
    rubric: [
      { points: 1, desc: "BoE: 100B pages × 100KB HTML = 10PB raw; ~100M unique terms; ~400PB stored with derivatives" },
      { points: 2, desc: "Document-sharded inverted index; ~1000 shards; scatter-gather query with aggregator merge" },
      { points: 2, desc: "Two-stage ranking: BM25 first-pass over candidates → BERT/cross-encoder rerank over top 1000" },
      { points: 1, desc: "Query cache absorbs ~30% of traffic (repeated queries); LRU with short TTL" },
      { points: 1, desc: "Crawler: URL frontier + fetchers + parser + dedup (SimHash); polite per-host rate limits" },
      { points: 1, desc: "Separate fresh-index for breaking-news content; merged at query time with main index" },
      { points: 1, desc: "Snippet generation + spell-correction + query expansion on the critical path" },
      { points: 1, desc: "Hedged requests to handle straggler shards: duplicate slow requests after N ms" },
    ],
    redflags: [
      "Term-sharded index without discussing hot-term problem",
      "One massive inverted index on a single machine",
      "Real-time index updates (no batch pipeline)",
      "Rerank all results with BERT (too slow)",
      "Ignores crawling / indexing; jumps straight to query serving",
    ],
  },
  {
    slug: "exercise-doordash",
    title: "DoorDash / Uber Eats",
    accent: { h: 15, s: 80, l: 50 },
    prompt: "Design DoorDash. Three-sided marketplace: eater orders, merchant prepares, Dasher delivers. ~6M orders/day; peak 600 orders/sec; dispatch < 3s.",
    budget: "45 min whiteboard",
    refProblem: "doordash-uber-eats",
    hints: [
      "Three domains: Marketplace (restaurants), Order (saga), Logistics (dispatch). Each owns its own data.",
      "Dispatch is the heart — batched 2-sec window, optimize distance + prep time + batching potential.",
      "ETA is ML with traffic, prep-time, distance; padded for UX asymmetry (2 min early beats 2 min late).",
    ],
    rubric: [
      { points: 1, desc: "BoE: 6M orders/day → 70/sec avg, 600/sec peak (Fri dinner); 300K active Dashers; ~10K geo-queries/sec" },
      { points: 2, desc: "Dispatch as 2-sec batched assignment (Hungarian algorithm) over (order, Dasher) scores" },
      { points: 2, desc: "Order lifecycle as saga: payment auth → create order → restaurant accept → dispatch → deliver" },
      { points: 1, desc: "H3 hex cells for geo-index; ring queries for nearby Dashers; Redis hot, Cassandra history" },
      { points: 1, desc: "Three-sided: separate apps + SLAs for eater / merchant / Dasher; merchant POS integration" },
      { points: 1, desc: "ML ETA with traffic, prep-time, historical; padded by 2 min for UX" },
      { points: 1, desc: "Batched multi-order delivery: cut cost per delivery ~30%" },
      { points: 1, desc: "Graceful degrade: ML outage → fallback to nearest-Dasher heuristic; keep orders flowing" },
    ],
    redflags: [
      "Nearest-Dasher-wins greedy (no batching)",
      "Misses the merchant side entirely",
      "Tries 2PC across payment + restaurant + dispatch",
      "One orders table hot-contested across all three parties",
      "ETA is distance / avg speed (no ML)",
    ],
  },
  {
    slug: "exercise-payment-gateway",
    title: "Payment Gateway",
    accent: { h: 145, s: 65, l: 42 },
    prompt: "Design a payment gateway like Stripe. Charge cards, handle refunds, webhooks to merchants, idempotent, ~100 TPS peak, PCI-DSS compliant.",
    budget: "45 min whiteboard",
    refProblem: "payment-gateway",
    hints: [
      "Never store card numbers. Tokenize via the card network; store only the token + last-4 + exp.",
      "Every API call has an Idempotency-Key. Critical for retry safety.",
      "Double-entry ledger. All value movements are atomic accounting transactions.",
    ],
    rubric: [
      { points: 2, desc: "Idempotency-Key required on POST /charges; stored with response; duplicate = return stored response" },
      { points: 2, desc: "PCI tokenization: raw card → token via card network; never touch raw PAN; scope PCI to a narrow vault" },
      { points: 2, desc: "Double-entry ledger: each charge/refund is balanced debit/credit; all fund movement is atomic" },
      { points: 1, desc: "Auth vs capture: separate external calls; hold funds on auth; capture within 7 days" },
      { points: 1, desc: "Webhook delivery: at-least-once with exp-backoff retries over 3 days; signed payloads" },
      { points: 1, desc: "Fraud scoring on every charge — separate ML service; decision in <100ms budget" },
      { points: 1, desc: "Saga for multi-step flows: auth → risk check → capture → notify; each step idempotent" },
    ],
    redflags: [
      "Stores raw card numbers in DB",
      "No idempotency mechanism (double-charges on retry)",
      "Synchronous webhooks blocking the API response",
      "Single DB transaction across external card-network call (blocks too long)",
      "No double-entry ledger; uses row-update for balances",
    ],
  },
  {
    slug: "exercise-stock-exchange",
    title: "Stock Exchange — Matching Engine",
    accent: { h: 30, s: 70, l: 50 },
    prompt: "Design a stock exchange. Price-time priority order matching, 100K trades/sec/symbol peak, < 1ms p99 latency, strong consistency.",
    budget: "45 min whiteboard",
    refProblem: "stock-exchange",
    hints: [
      "In-memory matching per symbol. One process per symbol. Serialized with a journal.",
      "Pre-trade risk holds funds before matching. Trade settler writes double-entry ledger post-fill.",
      "Single-threaded matching > parallel. Determinism + replayable state > throughput.",
    ],
    rubric: [
      { points: 2, desc: "Per-symbol single-threaded matching engine with in-memory order book (price-time priority)" },
      { points: 2, desc: "Every mutation journaled (append-only log) before apply; deterministic replay on restart" },
      { points: 1, desc: "Pre-trade risk: balance-hold on order submit; rejected if insufficient" },
      { points: 1, desc: "Trade settler writes double-entry ledger (buyer/seller funds + instrument); idempotent by trade_id" },
      { points: 1, desc: "Market-data fanout via WS/multicast to subscribers; delta updates; < 10ms latency target" },
      { points: 1, desc: "Hot vs cold order book: hot levels around mid-price; deep tail rarely touched" },
      { points: 1, desc: "Circuit breakers on extreme price moves; halt symbol on anomaly" },
      { points: 1, desc: "Clock-drift + jitter: deterministic sequence numbers from matching engine; not wall-clock" },
    ],
    redflags: [
      "Matching in a DB transaction (too slow for 100K/sec)",
      "Parallel matching across symbols with no serialization (order crossings)",
      "No journaling / replay (state lost on crash)",
      "Single-machine matching for entire exchange (no per-symbol isolation)",
      "Skipping pre-trade risk (allows negative-balance order)",
    ],
  },
  {
    slug: "exercise-ticketmaster",
    title: "Ticketmaster — Event Ticketing",
    accent: { h: 280, s: 60, l: 50 },
    prompt: "Design Ticketmaster. Concert tickets go on sale at 10am; 500K users try to grab 40K seats simultaneously. No double-bookings. Fair queue.",
    budget: "45 min whiteboard",
    refProblem: "ticketmaster-system-design",
    hints: [
      "Waiting room (FIFO queue) before the seat-picker even loads. Users enter in batches.",
      "Seat hold pattern: soft hold with TTL (5 min) while user picks + pays. Explicit release on timeout.",
      "Pessimistic lock on seat row at commit time — NOT optimistic. 100K users on same seat = 99,999 retry-storm.",
    ],
    rubric: [
      { points: 2, desc: "Waiting room FIFO queue as frontline; admits N users/sec to the seat picker" },
      { points: 2, desc: "Seat hold with explicit TTL (5 min); automatic release on timeout; atomic swap on purchase" },
      { points: 2, desc: "Pessimistic lock on seat rows (not optimistic) — avoids thundering-herd retries on popular seats" },
      { points: 1, desc: "Inventory cache (Redis) for 'seats remaining' reads; authoritative lock in DB for writes" },
      { points: 1, desc: "Anti-bot: captcha, rate-limit per IP/account, proof-of-work or challenge on suspicious" },
      { points: 1, desc: "Payment saga: hold seat → auth payment → confirm purchase → release hold on fail" },
      { points: 1, desc: "Pre-allocation: seats assigned to ticketing groups (resellers/presale) before public sale" },
    ],
    redflags: [
      "Optimistic concurrency on popular seats (retry storms — 99K failures per seat)",
      "Cache seat availability aggressively (users all see 'available' for same seat)",
      "One big DB transaction from 'pick seat' through 'type card info' (locks for minutes)",
      "No waiting room — 500K users hit seat-picker at t=0",
      "No bot protection",
    ],
  },
  {
    slug: "exercise-google-drive",
    title: "Google Drive / Dropbox",
    accent: { h: 215, s: 75, l: 48 },
    prompt: "Design Google Drive. Files up to 100 GB, folder hierarchy, sharing ACLs, cross-device sync, 1B+ users.",
    budget: "45 min whiteboard",
    refProblem: "003-google-drive",
    hints: [
      "Chunked content-addressable storage (4 MB blocks, SHA-256 keyed). Delta sync = upload only missing blocks.",
      "Metadata (tree, versions, ACLs) in transactional DB. Bytes in blob store. Don't conflate.",
      "Offline-first client: local SQLite + operation queue; sync engine reconciles.",
    ],
    rubric: [
      { points: 2, desc: "Chunked CAS: files split into 4 MB blocks, SHA-256-keyed; cross-user dedup of identical blocks" },
      { points: 2, desc: "Metadata in Postgres (sharded by user_id) — file tree + versions + ACLs; transactional" },
      { points: 2, desc: "Blocks in object store (S3-like); deduplicated by hash; erasure-coded for durability" },
      { points: 1, desc: "Delta sync: /blocks/check returns missing hashes; client uploads only those" },
      { points: 1, desc: "Offline-first client: SQLite local + operation queue; reconciles via vector clocks" },
      { points: 1, desc: "Conflict resolution: save both versions as foo.txt + foo (conflicted copy).txt (not merge)" },
      { points: 1, desc: "Sharing via ACLs on metadata node; not file content; propagate via permission event" },
    ],
    redflags: [
      "Uploads whole file on every change (no chunking)",
      "Tries CRDT / OT merge on file content (file systems don't have semantic awareness)",
      "Stores byte content in Postgres",
      "Single ACL check at upload (doesn't propagate when folder-shared)",
      "No client-side sync engine; assumes always-online",
    ],
  },
  {
    slug: "exercise-rate-limiter",
    title: "Rate Limiter",
    accent: { h: 200, s: 65, l: 50 },
    prompt: "Design a distributed rate limiter. Per-user, per-API, across 100 app servers. 100K QPS. Sliding-window (not fixed-window).",
    budget: "30 min whiteboard",
    refProblem: "007-rate-limiter",
    hints: [
      "Fixed-window has boundary burst (2× at window edge). Sliding-window smooths this.",
      "Centralized Redis with atomic INCR + TTL beats in-memory per-server counters.",
      "Token bucket for request-rate; leaky bucket for outflow rate. Different properties.",
    ],
    rubric: [
      { points: 2, desc: "Sliding-window (log or counter) not fixed-window — discusses boundary burst problem" },
      { points: 2, desc: "Centralized Redis INCR per key (user+endpoint); atomic + TTL-based window" },
      { points: 1, desc: "Token bucket for flexibility: sustained rate + burst allowance" },
      { points: 1, desc: "Multi-tier: global → tenant → endpoint → user; deny if ANY exceeded" },
      { points: 1, desc: "Fail-open on Redis outage (don't block all traffic) or circuit-breaker to local fallback" },
      { points: 1, desc: "Returns 429 with Retry-After header + rate-limit metadata (X-RateLimit-Remaining)" },
      { points: 1, desc: "Discusses cost: ~10 Redis calls/sec/user; plans for millions of active users" },
      { points: 1, desc: "Per-user priorities: premium users higher limits; internal bots separate bucket" },
    ],
    redflags: [
      "Fixed-window counter (2x burst at boundary)",
      "Per-server in-memory counter (bypassed by rotating through servers)",
      "No fail-open on Redis down (entire service blocks)",
      "Synchronous slow Redis in request path (should be async-capable)",
      "Single global limiter with no tenant/user granularity",
    ],
  },
  {
    slug: "exercise-notification-system",
    title: "Notification System",
    accent: { h: 30, s: 80, l: 50 },
    prompt: "Design a notification system. Push (iOS/Android/web), SMS, email. 10M messages/sec peak. Per-user preferences. Delivery tracking.",
    budget: "30 min whiteboard",
    refProblem: "notification-system",
    hints: [
      "Fan-out on a pub/sub (Kafka) — decouple producers from per-channel delivery workers.",
      "Per-channel worker pools (APNs, FCM, web-push, SMS, email) each with its own rate limits.",
      "Dedup + preferences + throttling live in a central service before fan-out.",
    ],
    rubric: [
      { points: 2, desc: "Event-sourced via Kafka; producers emit notification-request; delivery workers consume per-channel" },
      { points: 2, desc: "Per-channel worker pools (APNs/FCM/SMS/email) each obeying provider rate limits + retries" },
      { points: 1, desc: "Central preferences service: user opt-in/opt-out per channel + notification type; filter before fan-out" },
      { points: 1, desc: "Dedup by (user, notification_id) within TTL window to prevent duplicate delivery" },
      { points: 1, desc: "Collapse / rate-limit notifications: '3 mentions in #general' beats 3 separate pushes" },
      { points: 1, desc: "Token management: APNs/FCM tokens expire; cleanup pipeline from delivery errors" },
      { points: 1, desc: "Delivery tracking: status DB (queued → sent → delivered → clicked); expose via API" },
      { points: 1, desc: "Priority lanes: transactional (auth codes) vs marketing; separate queues + SLAs" },
    ],
    redflags: [
      "Synchronous notification in request path",
      "Single worker pool serves all channels (APNs throttle blocks everything)",
      "No preferences / opt-out handling (violates GDPR/CAN-SPAM)",
      "Doesn't clean up dead tokens (keeps sending to them, gets throttled)",
      "No dedup (sends same notification N times on retry)",
    ],
  },
  {
    slug: "exercise-url-shortener",
    title: "URL Shortener — bit.ly / TinyURL",
    accent: { h: 180, s: 70, l: 45 },
    prompt: "Design a URL shortener. 100M URLs/day, 10:1 read:write, < 100ms p99 redirect latency, analytics on click counts.",
    budget: "30 min whiteboard",
    refProblem: "001-url-shortener",
    hints: [
      "Short-code generation: base62 over a 64-bit counter = ~11 chars; or hash + collision check.",
      "Write path: Postgres sharded by counter-range; read path: Redis cache + DB fallback.",
      "Analytics is async: click event → Kafka → batch aggregate into clickhouse/BigQuery.",
    ],
    rubric: [
      { points: 1, desc: "Short-code: base62 of counter (~7 chars for 62^7 = 3.5T URLs) OR hash + collision check" },
      { points: 2, desc: "Counter-based via distributed sequence generator (Snowflake / Ticket servers); no central bottleneck" },
      { points: 2, desc: "Read path: Redis cache (hot URLs) → Postgres (warm) — sharded by short_code hash" },
      { points: 1, desc: "Click analytics async: emit event → Kafka → aggregator → ClickHouse for query" },
      { points: 1, desc: "BoE: 100M/day → 1K writes/sec, 10K reads/sec; ~500 GB/yr URL storage" },
      { points: 1, desc: "Custom short-codes: reserve namespace; collision detection on pick" },
      { points: 1, desc: "Expiry + analytics retention: cold URL cleanup; tiered storage for old data" },
      { points: 1, desc: "Abuse prevention: rate-limit per IP on creation; URL reputation check (Safe Browsing)" },
    ],
    redflags: [
      "UUID as short-code (too long — defeats the purpose)",
      "Sequential INT from one DB counter (becomes bottleneck)",
      "Synchronous click-count increment in redirect path",
      "No cache — every redirect hits DB",
      "No abuse prevention (becomes phishing relay)",
    ],
  },
];

function buildExercise(ex) {
  const rubricRows = ex.rubric.map((r, i) => `
      <li><span class="rubric-points">+${r.points}</span> ${r.desc}</li>`).join("");
  const totalPoints = ex.rubric.reduce((sum, r) => sum + r.points, 0);
  const hintItems = ex.hints.map((h, i) => `
      <details class="exercise-hint">
        <summary>Hint ${i + 1}</summary>
        <p>${h}</p>
      </details>`).join("");
  const redflagItems = ex.redflags.map((r) => `<li>${r}</li>`).join("\n        ");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${ex.title} — Exercise</title>
  <style>:root { --accent-h: ${ex.accent.h}; --accent-s: ${ex.accent.s}%; --accent-l: ${ex.accent.l}%; }
    .exercise-hint { background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
    .exercise-hint summary { cursor: pointer; font-family: var(--font-mono); font-size: 12px; color: var(--accent-text); letter-spacing: 0.04em; text-transform: uppercase; font-weight: 500; }
    .exercise-hint p { margin: 8px 0 0; font-size: 13px; color: var(--text-secondary); }
    .rubric-list { padding-left: 0; list-style: none; }
    .rubric-list li { padding: 8px 12px; background: var(--bg-subtle); border-left: 3px solid var(--accent-border); border-radius: 4px; margin-bottom: 6px; font-size: 13px; }
    .rubric-points { display: inline-block; min-width: 28px; background: var(--accent-light); color: var(--accent-text); font-family: var(--font-mono); font-size: 11px; font-weight: 600; padding: 2px 6px; border-radius: 3px; margin-right: 8px; }
    .redflag-list { list-style: "🚫 "; padding-left: 28px; }
    .redflag-list li { font-size: 13px; color: var(--text-secondary); margin-bottom: 6px; }
    .reveal-gate { text-align: center; padding: 20px; background: var(--bg-subtle); border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted); font-size: 13px; }
  </style>
</head>
<body>

<main>

  <div class="hero" id="problem">
    <div class="hero-kicker">Exercise · ${ex.budget}</div>
    <h1 class="hero-title">${ex.title}</h1>
    <p class="hero-desc">Whiteboard exercise. Try the problem cold, then reveal the rubric to self-score.</p>
    <div class="hero-tags">
      <span class="tag accent">Out of ${ex.rubric.reduce((s, r) => s + r.points, 0)} points</span>
      <span class="tag">${ex.budget}</span>
      <span class="tag"><a href="/${ex.refProblem}">Reference solution →</a></span>
    </div>
  </div>

  <section class="section" id="prompt">
    <div class="section-head"><span class="section-n">01</span><h2 class="section-title">Prompt</h2></div>
    <div class="prose">
      <p>${ex.prompt}</p>
      <p><strong>Time budget:</strong> ${ex.budget}. Draw architecture, estimate numbers, discuss tradeoffs.</p>
    </div>
  </section>

  <section class="section" id="hints">
    <div class="section-head"><span class="section-n">02</span><h2 class="section-title">Hints (progressive — click to reveal)</h2></div>
    <div class="prose">
      ${hintItems}
    </div>
  </section>

  <section class="section" id="rubric" data-reveal-gate="rubric">
    <div class="section-head"><span class="section-n">03</span><h2 class="section-title">Rubric — ${totalPoints} points</h2></div>
    <div class="prose">
      <ul class="rubric-list">${rubricRows}
      </ul>
      <p><strong>Self-score:</strong> tally the points you would have mentioned unprompted. 7+ is interview-ready on this problem.</p>
    </div>
  </section>

  <section class="section" id="redflags" data-reveal-gate="redflags">
    <div class="section-head"><span class="section-n">04</span><h2 class="section-title">Red flags (things that tank the interview)</h2></div>
    <div class="prose">
      <ul class="redflag-list">
        ${redflagItems}
      </ul>
    </div>
  </section>

</main>
</body>
</html>
`;
}

let count = 0;
for (const ex of EX) {
  const file = path.join(OUT_DIR, `${ex.slug}.html`);
  await fs.writeFile(file, buildExercise(ex));
  count++;
}
console.log(`\n✓ Authored ${count} exercises → ${OUT_DIR}`);

// Emit the slug list for EXERCISE_CATEGORIES update:
console.log("\nSlugs (for EXERCISE_CATEGORIES in extract.mjs):");
console.log(EX.map((e) => `"${e.slug}"`).join(", "));
