#!/usr/bin/env node
// Inject data-tooltip + data-concept-link attributes into key SVG <rect> nodes
// of 10 top problem HTML files. Uses text match against the rect's adjacent
// <text> element to identify which box is which. Idempotent.
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const SRC_DIR = path.resolve(__dirname, "..", "..");

// Per-problem: array of { match, tooltip, concept }
// `match` matches the text content of the <text> element SIBLING in the same SVG
// (case-insensitive, loose). We find the first rect immediately preceding the
// matched text and annotate it.
const TOOLTIPS = {
  "instagram.html": [
    { match: "api gateway", tooltip: "Validates auth, applies rate limits per user (e.g. 5 posts/min). Routes to upload, feed, or graph service.", concept: "/concepts/api-gateway" },
    { match: "upload svc", tooltip: "Issues pre-signed S3 URLs. Client streams bytes directly to S3 — app tier never sees the bytes.", concept: "/concepts/image-video-pipeline" },
    { match: "s3 originals", tooltip: "Direct-to-S3 multipart upload. Triggers a validator Lambda on ObjectCreated.", concept: "/s3-object-storage" },
    { match: "transcoder", tooltip: "GPU worker pool. Emits 5–10 derivatives per photo, HLS ladder per reel.", concept: "/005-youtube-netflix" },
    { match: "cdn", tooltip: "Lazy-pulls derivatives on first viewer request. Hot edge cache; regional shield; tiered storage.", concept: "/concepts/cdn" },
  ],
  "slack-discord.html": [
    { match: "load balancer", tooltip: "L4 consistent-hash by conn_id for sticky WebSocket sessions. TLS terminates here.", concept: "/concepts/load-balancer" },
    { match: "gateway #1", tooltip: "One of ~500 gateway servers, each holding ~20k persistent WebSocket connections.", concept: "/concepts/websockets-sse-polling" },
    { match: "message svc", tooltip: "Validates + deduplicates by (user, nonce) within 5-min window. Writes to Cassandra before notify.", concept: "/concepts/idempotency" },
    { match: "redis pub/sub", tooltip: "Sub-ms latency fan-out. Only gateways with active subscribers for a channel get the message.", concept: "/concepts/message-queue-vs-pubsub" },
    { match: "cassandra", tooltip: "Partition by channel_id; clustering by monotonic message_id. Durable; source of truth.", concept: "/concepts/sharding" },
  ],
  "search-engine.html": [
    { match: "url frontier", tooltip: "Priority queue of URLs to crawl, politely (per-host rate). Seeded + grown from link discovery.", concept: "/008-web-crawler" },
    { match: "fetchers", tooltip: "HTTP fetch pool. Respects robots.txt, per-host throttle, redirect chains.", concept: "/008-web-crawler" },
    { match: "dedup", tooltip: "SimHash-based near-duplicate detection. Prevents index bloat from mirrored content.", concept: "/concepts/bloom-filter" },
    { match: "inverted index", tooltip: "Document-sharded across ~1000 shards. Each shard holds a subset of doc_ids + full posting lists for those docs.", concept: "/concepts/indexing" },
    { match: "aggregator", tooltip: "Scatter-gather across all shards; merges shard-local top-100 into global top-1000. Hedged requests for stragglers.", concept: "/concepts/request-hedging" },
    { match: "reranker", tooltip: "BERT cross-encoder scores top-1000 with query + doc pairs. 100× more expensive per-doc than BM25.", concept: "/concepts/model-serving-online-vs-batch" },
  ],
  "uber-system-design.html": [
    { match: "dispatch", tooltip: "Runs in 2-sec batched windows. Hungarian algorithm over (driver, ride) scores.", concept: "/concepts/geospatial-indexes" },
    { match: "eta", tooltip: "GBDT ML model with features: distance, traffic, time-of-day, driver speed profile, historical.", concept: "/concepts/model-serving-online-vs-batch" },
    { match: "geo", tooltip: "H3 hexagonal cell index. Ring queries for 'nearby drivers' — user's cell + ~18 neighbors.", concept: "/concepts/geospatial-indexes" },
  ],
  "doordash-uber-eats.html": [
    { match: "dispatch", tooltip: "2-sec batched window; Hungarian algorithm assigns Dashers to orders optimally.", concept: "/concepts/geospatial-indexes" },
    { match: "location", tooltip: "H3 hex cells keyed in Redis for hot; Cassandra for history. 75K location pings/sec baseline.", concept: "/concepts/geospatial-indexes" },
    { match: "order svc", tooltip: "Saga orchestrator: payment auth → restaurant accept → dispatch → delivery. Idempotent steps.", concept: "/concepts/event-sourcing-cqrs" },
    { match: "eta", tooltip: "GBDT with distance + traffic + restaurant prep-time + historical. Padded for UX asymmetry.", concept: "/concepts/model-serving-online-vs-batch" },
  ],
  "s3-object-storage.html": [
    { match: "index svc", tooltip: "Metadata service: (bucket, key) → object_id + shard locations. Auto-splits hot partitions.", concept: "/concepts/sharding" },
    { match: "magic pocket", tooltip: "Content-addressable byte storage with Reed-Solomon erasure coding. 11 nines durability at 1.4× overhead.", concept: "/concepts/erasure-coding" },
    { match: "front-end", tooltip: "Authenticates, routes, computes shard-affinity. No persistent state; horizontally scales.", concept: "/concepts/stateless-services" },
  ],
  "design-cdn.html": [
    { match: "pop nyc", tooltip: "Point-of-presence: nginx/envoy + NVMe cache + TLS termination. One of ~300 globally.", concept: "/concepts/cdn" },
    { match: "regional na", tooltip: "Mid-tier cache between edge PoPs and origin. Absorbs PoP misses; drops origin load ~10×.", concept: "/concepts/cdn" },
    { match: "origin", tooltip: "Customer's server. CDN tries hard to never hit it. Stale-while-revalidate on origin down.", concept: "/concepts/cdn-vs-application-cache" },
    { match: "purge svc", tooltip: "Control-plane pub/sub: customer API call → propagates invalidations to all PoPs in ~3 seconds.", concept: "/concepts/cdn" },
  ],
  "002-news-feed.html": [
    { match: "tweet svc", tooltip: "Write path: validate, persist to Cassandra (partition by user_id), emit to fan-out queue.", concept: "/concepts/sharding" },
    { match: "fan-out", tooltip: "For normal users: push to follower timelines. For celebrities (>100K followers): skip → pulled at read time.", concept: "/002-news-feed" },
    { match: "timeline cache", tooltip: "Redis sorted-set per user. TTL-bounded. On miss: backfill from tweet DB + followed-users timeline.", concept: "/concepts/cache-strategies" },
    { match: "ranker", tooltip: "Online re-ranking of top-N tweets with recent engagement features. BERT for text, GBDT for signals.", concept: "/concepts/model-serving-online-vs-batch" },
  ],
  "005-youtube-netflix.html": [
    { match: "transcoder", tooltip: "GPU worker pool. Produces HLS ladder: 240p → 4K × H.264 / H.265 / AV1. ~30s GPU/min video.", concept: "/concepts/image-video-pipeline" },
    { match: "cdn", tooltip: "Multi-CDN edge. Most traffic hits edge cache; origin shield for misses. Edge PoPs globally.", concept: "/concepts/cdn" },
    { match: "manifest", tooltip: "HLS .m3u8 file: lists all renditions + segment URLs. Player chooses rendition per 6-sec segment.", concept: "/concepts/image-video-pipeline" },
    { match: "origin", tooltip: "S3-like blob store for renditions. Direct-to-S3 upload; CDN pulls on first viewer request.", concept: "/s3-object-storage" },
  ],
  "004-whatsapp-system-design.html": [
    { match: "chat svc", tooltip: "Accepts encrypted message; writes to recipient's mailbox queue. Never decrypts — E2E opaque.", concept: "/concepts/tls-https" },
    { match: "mailbox", tooltip: "Per-user inbox queue. Sharded by user_id. Message held until recipient's device acks.", concept: "/004-whatsapp-system-design" },
    { match: "media svc", tooltip: "E2E-encrypted media blob stored briefly in S3; deleted after recipient fetches.", concept: "/concepts/image-video-pipeline" },
  ],
};

let changed = 0;
for (const [filename, tooltips] of Object.entries(TOOLTIPS)) {
  const file = path.join(SRC_DIR, filename);
  let raw;
  try {
    raw = await fs.readFile(file, "utf8");
  } catch (e) {
    console.log(`  ! skip ${filename}: ${e.message}`);
    continue;
  }

  let newRaw = raw;
  let fileChanged = 0;

  for (const { match, tooltip, concept } of tooltips) {
    // Find the <text> element whose content matches (case-insensitive)
    // Pattern: <text ...>Match</text> — then walk backward to the nearest <rect ...>
    const textRegex = new RegExp(
      `<text([^>]*)>([^<]*${match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^<]*)</text>`,
      "gi"
    );
    const textMatch = textRegex.exec(newRaw);
    if (!textMatch) {
      console.log(`  · ${filename}: no text "${match}" found`);
      continue;
    }
    const textIdx = textMatch.index;
    // Walk backward looking for the most recent <rect  — up to 1500 chars
    const searchFrom = Math.max(0, textIdx - 1500);
    const windowStr = newRaw.slice(searchFrom, textIdx);
    const rectMatches = [...windowStr.matchAll(/<rect\b[^>]*>/g)];
    if (rectMatches.length === 0) {
      console.log(`  · ${filename}: no rect preceding "${match}"`);
      continue;
    }
    const rect = rectMatches[rectMatches.length - 1];
    const rectStart = searchFrom + rect.index;
    const rectTag = rect[0];

    if (rectTag.includes("data-tooltip=")) {
      // Already annotated — skip
      continue;
    }
    const annotatedTag = rectTag.replace(
      /<rect\b/,
      `<rect data-tooltip="${tooltip.replace(/"/g, "&quot;")}" data-concept-link="${concept}"`
    );
    newRaw = newRaw.slice(0, rectStart) + annotatedTag + newRaw.slice(rectStart + rectTag.length);
    fileChanged++;
  }

  if (fileChanged > 0) {
    await fs.writeFile(file, newRaw);
    console.log(`  ✓ ${filename}: ${fileChanged} tooltips injected`);
    changed++;
  }
}
console.log(`\n✓ ${changed} files updated.`);
