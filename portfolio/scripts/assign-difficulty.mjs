#!/usr/bin/env node
// Batch-assign difficulty to problems that have null difficulty.
// Writes directly into the source HTML files by adding/updating
// a data-difficulty attribute that the extractor can pick up,
// OR by inserting a difficulty badge into the hero.
// Simpler approach: just patch the extracted JSON index + regenerate.

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "..", "content");

const ASSIGNMENTS = {
  // EASY (straightforward, single-service, well-known pattern)
  "001-url-shortener": "EASY",
  "unique-id-generator": "EASY",
  "count-active-users": "MEDIUM",
  "youtube-likes-counter": "EASY",

  // MEDIUM (multi-service, standard patterns, moderate complexity)
  "004-whatsapp-system-design": "MEDIUM",
  "002-news-feed": "MEDIUM",
  "005-youtube-netflix": "MEDIUM",
  "instagram": "MEDIUM",
  "slack-discord": "MEDIUM",
  "gmail": "MEDIUM",
  "google-calendar": "MEDIUM",
  "google-news": "MEDIUM",
  "reddit-full": "MEDIUM",
  "twitter-trending": "MEDIUM",
  "search-engine": "MEDIUM",
  "008-web-crawler": "MEDIUM",
  "003-google-drive": "MEDIUM",
  "dropbox-sync": "MEDIUM",
  "distributed-cache": "MEDIUM",
  "key-value-store": "MEDIUM",
  "s3-object-storage": "MEDIUM",
  "shopping-cart": "MEDIUM",
  "airbnb": "MEDIUM",
  "doordash-uber-eats": "MEDIUM",
  "ad-click-aggregator": "MEDIUM",
  "metrics-monitoring": "MEDIUM",
  "code-deployment": "MEDIUM",
  "leetcode-judge": "MEDIUM",
  "design-cdn": "MEDIUM",
  "reminder-alert": "MEDIUM",
  "collaborative-whiteboard": "MEDIUM",

  // HARD (multi-domain, financial, real-time constraints, deep tradeoffs)
  "crypto-exchange": "HARD",
  "google-ads": "HARD",
  "stock-exchange": "HARD",
  "fraud-detection": "HARD",
  "flash-sale": "HARD",
  "design-chatgpt": "HARD",
  "live-streaming": "HARD",

  // Already assigned (verify)
  "007-rate-limiter": "MEDIUM",
  "006-typeahead-suggestions": "MEDIUM",
  "009-yelp-google-places": "MEDIUM",
};

// Patch _index.json directly
const indexPath = path.join(CONTENT_DIR, "_index.json");
const index = JSON.parse(await fs.readFile(indexPath, "utf8"));

let patched = 0;
for (const entry of index) {
  const assigned = ASSIGNMENTS[entry.slug];
  if (assigned && entry.difficulty !== assigned) {
    entry.difficulty = assigned;
    patched++;
    console.log(`  ✓ ${entry.slug}: ${assigned}`);
  }
}

await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
console.log(`\n✓ Patched ${patched} entries in _index.json`);

// Also patch each individual JSON
for (const entry of index) {
  const assigned = ASSIGNMENTS[entry.slug];
  if (!assigned) continue;
  const fp = path.join(CONTENT_DIR, `${entry.slug}.json`);
  try {
    const data = JSON.parse(await fs.readFile(fp, "utf8"));
    if (data.difficulty !== assigned) {
      data.difficulty = assigned;
      await fs.writeFile(fp, JSON.stringify(data, null, 2));
    }
  } catch {}
}
console.log("✓ Individual JSONs updated.");
