#!/usr/bin/env node
// Parse each SD HTML file at SRC_DIR into a JSON structure + per-problem CSS.
// Re-runnable. Idempotent. Writes to content/ and public/styles/.

import { JSDOM } from "jsdom";
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// CLI: node scripts/extract.mjs [--kind=problems|concepts|postmortems|exercises]
const KIND = (process.argv.find((a) => a.startsWith("--kind=")) || "--kind=problems")
  .split("=")[1];

const ROOT_DIR = path.resolve(__dirname, "..", "..");          // /home/paramvsi/Learning/SystemDesign

const SRC_DIR =
  KIND === "concepts"    ? path.resolve(ROOT_DIR, "concepts") :
  KIND === "postmortems" ? path.resolve(ROOT_DIR, "postmortems") :
  KIND === "exercises"   ? path.resolve(ROOT_DIR, "exercises") :
  ROOT_DIR;

const CONTENT_DIR =
  KIND === "concepts"    ? path.resolve(__dirname, "..", "content", "concepts") :
  KIND === "postmortems" ? path.resolve(__dirname, "..", "content", "postmortems") :
  KIND === "exercises"   ? path.resolve(__dirname, "..", "content", "exercises") :
  path.resolve(__dirname, "..", "content");

const STYLES_DIR =
  KIND === "concepts"    ? path.resolve(__dirname, "..", "public", "styles", "concepts") :
  KIND === "postmortems" ? path.resolve(__dirname, "..", "public", "styles", "postmortems") :
  KIND === "exercises"   ? path.resolve(__dirname, "..", "public", "styles", "exercises") :
  path.resolve(__dirname, "..", "public", "styles");

const SKIP = new Set([
  "TEMPLATE.html",
  "paramveer_8month_study_plan.html",
  "paramveer_weekly_blueprint.html",
  "thyroid-hair-guide.html",
]);

// Section IDs we treat as canonical. Any id starting with "deep-dive" also passes.
const KNOWN_IDS = new Set([
  // Problem-page sections
  "problem","requirements","scale","api","architecture",
  "deep-dive","tradeoffs","failures","interview-tips","similar","evolution",
  "antipatterns",
  // Concept-page sections
  "intuition","how-it-works","variants","real-world","used-in",
  // Post-mortem sections
  "tldr","timeline","rootcause","impact","lessons","concepts-used",
  // Exercise sections
  "prompt","hints","rubric","redflags","reference-answer",
]);
const isKnownSectionId = (id) => KNOWN_IDS.has(id) || id.startsWith("deep-dive");

// Map any slug referenced by ../xxx/index.html to the filename slug we publish under.
const SLUG_ALIASES = {
  "url-shortener":       "001-url-shortener",
  "twitter-feed":        "002-news-feed",
  "news-feed":           "002-news-feed",
  "twitter":             "002-news-feed",
  "google-drive":        "003-google-drive",
  "dropbox":             "003-google-drive",
  "whatsapp":            "004-whatsapp-system-design",
  "whatsapp-chat":       "004-whatsapp-system-design",
  "chat-system":         "004-whatsapp-system-design",
  "youtube":             "005-youtube-netflix",
  "netflix":             "005-youtube-netflix",
  "video-streaming":     "005-youtube-netflix",
  "typeahead":           "006-typeahead-suggestions",
  "typeahead-suggestions":"006-typeahead-suggestions",
  "search-autocomplete": "006-typeahead-suggestions",
  "autocomplete":        "006-typeahead-suggestions",
  "rate-limiter":        "007-rate-limiter",
  "web-crawler":         "008-web-crawler",
  "crawler":             "008-web-crawler",
  "yelp":                "009-yelp-google-places",
  "google-places":       "009-yelp-google-places",
  "yelp-google-places":  "009-yelp-google-places",
  // same-name, unnumbered:
  "ecommerce":           "ecommerce-system-design",
  "pubg":                "pubg-system-design",
  "ticketmaster":        "ticketmaster-system-design",
  "uber":                "uber-system-design",
  "stock-trading":       "stock-trading-platform",
};

const PROBLEM_CATEGORIES = {
  "Social & Feed": [
    "002-news-feed", "reddit-comments", "mutual-connections",
    "recommendation-algorithm", "leaderboard", "instagram", "twitter-trending",
    "youtube-likes-counter", "reddit-full",
  ],
  "Storage & Data": [
    "003-google-drive", "google-docs", "distributed-logging", "dropbox-sync",
    "s3-object-storage",
  ],
  "Communication": [
    "004-whatsapp-system-design", "notification-system", "video-conferencing",
    "slack-discord", "gmail", "google-calendar", "reminder-alert",
  ],
  "Media & Streaming": [
    "005-youtube-netflix", "live-streaming",
  ],
  "Search & Discovery": [
    "006-typeahead-suggestions", "008-web-crawler", "009-yelp-google-places", "google-maps",
    "search-engine", "google-news",
  ],
  "Infrastructure": [
    "007-rate-limiter", "distributed-job-scheduler", "distributed-locking",
    "distributed-queue", "count-active-users", "design-cdn",
    "unique-id-generator", "leetcode-judge",
  ],
  "Financial & Trading": [
    "bidding-platform", "payment-gateway", "stock-exchange", "stock-trading-platform",
    "crypto-exchange", "fraud-detection",
  ],
  "Marketplace & Booking": [
    "001-url-shortener", "ecommerce-system-design", "ticketmaster-system-design", "uber-system-design",
    "doordash-uber-eats", "airbnb", "flash-sale",
  ],
  "Gaming": [
    "pubg-system-design",
  ],
};

const CONCEPT_CATEGORIES = {
  "Foundations": [
    "interview-framework", "back-of-envelope-estimation", "latency-numbers",
    "availability-nines", "slos-slis-slas", "time-sync-clocks",
    "concurrency-models", "shared-nothing-architecture", "multi-tenancy",
  ],
  "Networking & Delivery": [
    "dns", "cdn", "tcp-vs-udp", "http-1-vs-2-vs-3", "tls-https",
    "proxy-vs-reverse-proxy", "websockets-sse-polling",
    "api-protocols-rest-graphql-grpc", "service-mesh",
    "webhooks", "api-versioning", "edge-computing", "compression-encoding",
  ],
  "Scaling": [
    "horizontal-vs-vertical-scaling", "load-balancer", "stateless-services",
    "autoscaling", "api-gateway",
  ],
  "Databases": [
    "sql-vs-nosql", "acid-vs-base", "cap-theorem", "pacelc-theorem", "replication",
    "sharding", "indexing", "normalization-vs-denormalization", "database-types",
    "transactions-distributed", "write-ahead-log-wal",
    "connection-pooling", "database-federation", "cdc-change-data-capture",
    "data-lake-vs-warehouse",
  ],
  "Caching": [
    "cache-strategies", "cache-eviction", "cdn-vs-application-cache", "cache-stampede",
  ],
  "Messaging & Async": [
    "message-queue-vs-pubsub", "delivery-guarantees", "event-sourcing-cqrs",
    "kafka-internals", "batch-vs-stream-processing",
  ],
  "Distributed Systems": [
    "consensus-paxos-raft", "distributed-locking", "leader-election",
    "consistent-hashing", "vector-clocks-lww", "gossip-protocols",
    "quorum", "heartbeat-failure-detection", "service-discovery",
    "two-generals-byzantine-problems", "read-repair-anti-entropy",
    "tunable-consistency-per-query", "clock-skew-tolerance-design",
  ],
  "Reliability": [
    "circuit-breaker", "retry-backoff-jitter", "bulkhead-isolation",
    "rate-limiting-algorithms", "idempotency",
    "graceful-degradation", "backpressure-flow-control",
    "feature-flags-rollouts", "chaos-engineering", "request-hedging",
    "deployment-strategies-blue-green-canary",
  ],
  "Observability & Security": [
    "observability-triad", "auth-oauth-jwt", "ddos-protection",
    "secret-management",
    "zero-trust-networking", "tokenization-pci",
    "field-level-encryption", "gdpr-right-to-be-forgotten",
  ],
  "Data Structures": [
    "bloom-filter", "geospatial-indexes",
    "merkle-trees", "hyperloglog-sketches",
    "memory-mapped-files", "erasure-coding", "url-encoding-base62",
  ],
  "Machine Learning Systems": [
    "feature-store", "model-serving-online-vs-batch", "vector-databases",
    "embedding-generation-pipelines", "online-learning-vs-offline-training",
    "ab-testing-platform", "llm-serving-infrastructure",
  ],
  "Architecture Patterns": [
    "microservices-vs-monolith", "domain-driven-design",
    "event-driven-architecture", "hexagonal-clean-architecture",
    "bff-backend-for-frontend",
  ],
  "Operations": [
    "disaster-recovery-rto-rpo",
    "multi-region-active-active-vs-active-passive",
    "database-migration-zero-downtime",
  ],
  "Frontend & Mobile": [
    "service-workers-pwa-offline", "mobile-offline-first-sync",
    "image-video-pipeline", "push-notification-protocols",
  ],
  "Interview Tactics": [
    "interview-tactics-playbook",
  ],
};

const POSTMORTEM_CATEGORIES = {
  "Deploy / operator error": [
    "aws-s3-2017-typo", "knight-capital-2012", "gitlab-2017-db-delete",
    "crowdstrike-2024-kernel-driver", "reddit-2023-k8s-upgrade",
    "datadog-2023-systemd",
  ],
  "Coordination + consensus": [
    "github-2018-network-partition", "roblox-2021-consul",
    "slack-2022-consul",
  ],
  "Capacity + cascading failure": [
    "slack-2021-jan-aws", "cloudflare-2019-regex",
  ],
  "Infrastructure + network": [
    "facebook-2021-bgp",
  ],
};

const EXERCISE_CATEGORIES = {
  "Social & Feed": [
    "exercise-instagram", "exercise-news-feed",
  ],
  "Communication": [
    "exercise-slack-discord", "exercise-whatsapp", "exercise-notification-system",
  ],
  "Media & Streaming": [
    "exercise-youtube-netflix",
  ],
  "Search & Discovery": [
    "exercise-search-engine",
  ],
  "Marketplace & Booking": [
    "exercise-uber", "exercise-doordash", "exercise-ticketmaster",
  ],
  "Storage & Data": [
    "exercise-google-drive",
  ],
  "Financial & Trading": [
    "exercise-payment-gateway", "exercise-stock-exchange",
  ],
  "Infrastructure": [
    "exercise-rate-limiter", "exercise-url-shortener",
  ],
};

const CATEGORIES =
  KIND === "concepts"    ? CONCEPT_CATEGORIES :
  KIND === "postmortems" ? POSTMORTEM_CATEGORIES :
  KIND === "exercises"   ? EXERCISE_CATEGORIES :
  PROBLEM_CATEGORIES;
const CATEGORY_OF = {};
for (const [cat, slugs] of Object.entries(CATEGORIES)) {
  for (const s of slugs) CATEGORY_OF[s] = cat;
}

// ── Helpers ──────────────────────────────────────────────────────────────

function normalizeHrefToSlug(href) {
  if (!href) return null;
  const m1 = href.match(/^\.\.\/([a-z0-9-]+)\/(?:index\.html)?$/i);
  const m2 = href.match(/^\/?([a-z0-9-]+)\/?$/);
  const m3 = href.match(/^([a-z0-9-]+)\.html$/i);
  const raw = (m1 ?? m2 ?? m3)?.[1];
  if (!raw) return null;
  return SLUG_ALIASES[raw] ?? raw;
}

function extractAccent(rawHtml) {
  const h = rawHtml.match(/--accent-h:\s*([\d.]+)/)?.[1];
  const s = rawHtml.match(/--accent-s:\s*([\d.]+)%/)?.[1];
  const l = rawHtml.match(/--accent-l:\s*([\d.]+)%/)?.[1];
  return {
    h: h ? Number(h) : 217,
    s: s ? Number(s) : 91,
    l: l ? Number(l) : 50,
  };
}

// Pull JS array literals like FLOW_NODES=['a','b'] or FLOW_NODES=[{label:'x',sub:'y'}, ...].
function extractFlowArrays(scriptText) {
  const grabArrayLiteral = (name) => {
    // Find `NAME = [` then balance brackets to closing ];
    const start = scriptText.search(new RegExp(`\\b${name}\\s*=\\s*\\[`));
    if (start < 0) return null;
    const openIdx = scriptText.indexOf("[", start);
    let depth = 0, inStr = false, strCh = "";
    for (let i = openIdx; i < scriptText.length; i++) {
      const c = scriptText[i];
      const p = scriptText[i - 1];
      if (inStr) {
        if (c === strCh && p !== "\\") inStr = false;
        continue;
      }
      if (c === "'" || c === '"' || c === "`") { inStr = true; strCh = c; continue; }
      if (c === "[") depth++;
      else if (c === "]") {
        depth--;
        if (depth === 0) return scriptText.slice(openIdx, i + 1);
      }
    }
    return null;
  };

  const evalLiteral = (src) => {
    try {
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${src});`)();
    } catch {
      return null;
    }
  };

  const nodesSrc = grabArrayLiteral("FLOW_NODES");
  const descsSrc = grabArrayLiteral("FLOW_DESCS");
  if (!nodesSrc || !descsSrc) return null;
  const nodesRaw = evalLiteral(nodesSrc);
  const descsRaw = evalLiteral(descsSrc);
  if (!Array.isArray(nodesRaw) || !Array.isArray(descsRaw)) return null;

  // Normalize nodes — accept string OR {label, sub} objects.
  const nodes = nodesRaw.map((n) => {
    if (typeof n === "string") return n;
    if (n && typeof n === "object") {
      if (n.sub) return `${n.label} · ${n.sub}`;
      return String(n.label ?? "");
    }
    return String(n ?? "");
  }).filter(Boolean);

  const descs = descsRaw.map((d) => (typeof d === "string" ? d : String(d ?? "")));

  return { nodes, descs };
}

// Extract the single inline <style> block as CSS text, drop :root {...} rule to
// avoid overriding the accent vars we inject via inline style on the page root.
function extractInlineCSS(rawHtml) {
  const m = rawHtml.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
  if (!m) return "";
  let css = m[1];
  // Drop the :root { ... } rule — accent vars are set by React inline style.
  css = css.replace(/:root\s*\{[\s\S]*?\}\s*/m, "");
  return css.trim();
}

// Rewire inline onclick="hlNode('x')" → data-hl-node="x"; nuke all other inline JS.
function sanitizeSvgNodeHandlers(rootEl) {
  rootEl.querySelectorAll("[onclick]").forEach((el) => {
    const h = el.getAttribute("onclick") || "";
    const m = h.match(/hlNode\(\s*['"]([^'"]+)['"]\s*\)/);
    if (m) {
      el.removeAttribute("onclick");
      el.setAttribute("data-hl-node", m[1]);
      const style = el.getAttribute("style") || "";
      if (!/cursor\s*:/.test(style)) {
        el.setAttribute("style", style ? `${style};cursor:pointer` : "cursor:pointer");
      }
    } else {
      el.removeAttribute("onclick");
    }
  });
}

// Rewrite ../foo/index.html → /foo   and   foo.html → /foo
function rewriteCrossLinks(rootEl, audit, sourceFile) {
  rootEl.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (!href) return;
    if (href.startsWith("#")) return;                 // in-page anchor — keep
    if (/^https?:/i.test(href)) return;               // external — keep
    if (href === "../index.html") {
      a.setAttribute("href", "/");
      return;
    }
    // Absolute paths are already correct Next.js routes (e.g. /concepts/cdn).
    if (href.startsWith("/")) return;

    const slug = normalizeHrefToSlug(href);
    if (slug) {
      a.setAttribute("href", `/${slug}`);
    } else {
      audit.push(`${sourceFile}: could not resolve link "${href}"`);
    }
  });
}

function firstNonEmpty(...values) {
  for (const v of values) if (v && v.trim()) return v.trim();
  return "";
}

function findTitle(doc) {
  // Prefer explicit h1 inside hero. Prefer text without template markers.
  const h1 = doc.querySelector(".hero-title, .hero h1, h1");
  if (h1) {
    // e.g. "Design a <em>URL Shortener</em>" — prefer the emphasized text
    const em = h1.querySelector("em");
    if (em && em.textContent?.trim()) return em.textContent.trim();
    const t = h1.textContent?.replace(/\s+/g, " ").trim();
    if (t) return t;
  }
  const docTitle = doc.title || "";
  return docTitle
    .replace(/\s*[—-]\s*System Design(?:\s+Concept)?\s*$/i, "")
    .replace(/\s*[—-]\s*Concept\s*$/i, "")
    .trim() || "Untitled";
}

function findDifficulty(doc) {
  // "Intermediate", "Hard", etc., usually in a .badge or .topbar-tag.
  const el = doc.querySelector(".topbar-right .badge-muted, .topbar-right .topbar-tag, .topbar-right .badge:last-child");
  const txt = el?.textContent?.trim()?.toUpperCase();
  if (!txt) return null;
  if (/EASY/.test(txt))   return "EASY";
  if (/HARD/.test(txt))   return "HARD";
  if (/MEDIUM|INTERMED/.test(txt)) return "MEDIUM";
  return null;
}

function findHeroNumber(doc) {
  const el = doc.querySelector(".hero-number, .hero-kicker");
  const txt = el?.textContent?.trim() ?? "";
  const m = txt.match(/\b(\d{1,3})\b/);
  return m ? m[1] : null;
}

function findHeroDesc(doc) {
  const el = doc.querySelector(".hero-desc");
  return el ? el.innerHTML.trim() : "";
}

function findHeroTags(doc) {
  const els = doc.querySelectorAll(".hero-tags .hero-tag, .hero-tags .tag, .hero-tags span");
  return [...els].map((e) => e.textContent?.trim() ?? "").filter(Boolean);
}

function findRelatedFromSidebar(doc, audit, filename) {
  // Both variants: tpl uses .sidebar-related a; numbered uses links under "Related" label after the main list.
  // First try .sidebar-related a (template variant).
  let anchors = [...doc.querySelectorAll(".sidebar-related a[href]")];
  if (anchors.length === 0) {
    // Numbered variant: sidebar has "On this page" label, list of #anchor links, then "Related" label, then cross-file links.
    // Pick all .sidebar a[href] that start with "../" or ".html".
    anchors = [...doc.querySelectorAll(".sidebar a[href]")].filter((a) => {
      const h = a.getAttribute("href") || "";
      return !h.startsWith("#") && h !== "../index.html";
    });
  }
  const out = [];
  for (const a of anchors) {
    const slug = normalizeHrefToSlug(a.getAttribute("href"));
    const label = (a.textContent || "").replace(/^[→\s]+/, "").trim();
    if (!label) continue;
    if (slug) out.push({ slug, label });
    else audit.push(`${filename}: related-link unresolved "${a.getAttribute("href")}"`);
  }
  // Dedupe by slug.
  const seen = new Set();
  return out.filter((r) => (seen.has(r.slug) ? false : (seen.add(r.slug), true)));
}

function findSimilarCards(doc, audit, filename) {
  const cards = [...doc.querySelectorAll("#similar .similar-card, #similar a.similar-card, .similar-grid a, .similar a")];
  const out = [];
  for (const c of cards) {
    const href = c.getAttribute("href");
    const slug = normalizeHrefToSlug(href);
    const name = c.querySelector("h4, .similar-title")?.textContent?.trim()
              ?? c.querySelector("strong")?.textContent?.trim()
              ?? "";
    const why  = c.querySelector("p, .similar-why")?.textContent?.trim() ?? "";
    if (slug) out.push({ slug, name, why });
    else if (href) audit.push(`${filename}: similar-card unresolved "${href}"`);
  }
  return out;
}

function findFlowOwnerSection(doc) {
  const widget = doc.querySelector(".anim-wrap, .flow-stepper");
  if (!widget) return null;
  const sec = widget.closest(".section[id]");
  return sec?.id ?? null;
}

function findSections(doc, audit, filename) {
  // Tolerate <div.section>, <section.section>, also honour .hero[id=problem] as a synthetic "problem" section
  // (the numbered variant puts problem content inside .hero instead of a .section).
  const sections = [];
  const nodes = [...doc.querySelectorAll(".section[id], section.section[id], div.section[id]")];
  for (const node of nodes) {
    const id = node.id;
    if (!id || !isKnownSectionId(id)) continue;

    const label =
      firstNonEmpty(
        node.querySelector(".section-title")?.textContent,
        node.querySelector("h2")?.textContent,
        id
      );
    const numberText =
      node.querySelector(".section-n")?.textContent?.trim()
      ?? node.querySelector(".section-number")?.textContent?.trim()
      ?? undefined;

    const clone = node.cloneNode(true);

    // Strip only the flow-stepper — it's replaced by a React state machine.
    // KEEP architecture SVG in place; the original markup has a nicely-styled
    // `.diagram-wrap` / `.diagram-body` (numbered variant) or `.arch-diagram`
    // (template variant) that we want to preserve.
    // Strip the original flow widgets from any section — numbered variant
    // calls it `.anim-wrap`, template variant calls it `.flow-stepper`. Both
    // are replaced by the React <FlowStepper> client component.
    clone.querySelectorAll(".flow-stepper, .anim-wrap").forEach((n) => n.remove());

    // Leave mermaid blocks in place — the React <Mermaid> effect finds them
    // inside the section body and renders via mermaid.render() → innerHTML.

    // Rewire inline onclicks → data-* attrs; rewrite cross-links.
    sanitizeSvgNodeHandlers(clone);
    rewriteCrossLinks(clone, audit, filename);

    sections.push({
      id,
      label: label.replace(/\s+/g, " ").trim(),
      number: numberText,
      html: clone.innerHTML.trim(),
    });
  }
  return sections;
}

function extractArchSvg(doc) {
  // The architecture SVG, either inside .arch-diagram or directly as .arch-svg.
  const container =
    doc.querySelector("#architecture .arch-diagram") ??
    doc.querySelector(".arch-diagram") ??
    doc.querySelector("#architecture .arch-svg") ??
    doc.querySelector(".arch-svg");
  if (!container) return null;
  const svg = container.tagName.toLowerCase() === "svg" ? container : container.querySelector("svg");
  if (!svg) return null;
  // Rewire onclicks.
  sanitizeSvgNodeHandlers(svg);
  return svg.outerHTML;
}

function extractMermaid(doc, audit, filename) {
  const blocks = [];
  const nodes = [...doc.querySelectorAll(".mermaid")];
  nodes.forEach((node, i) => {
    // Find nearest ancestor .section[id] to key by.
    let sec = node.closest(".section[id]");
    const sectionId = sec?.id ?? "deep-dive";
    // Strip HTML comments that appear as example markup.
    const source = (node.textContent || "").replace(/<!--[\s\S]*?-->/g, "").trim();
    if (source) blocks.push({ sectionId, source, index: i });
  });
  return blocks;
}

// ── Main per-file extractor ──────────────────────────────────────────────

async function extractFile(filename, audit) {
  const slug = filename.replace(/\.html$/, "");
  const raw  = await fs.readFile(path.join(SRC_DIR, filename), "utf8");
  const { window } = new JSDOM(raw);
  const doc = window.document;

  const accent     = extractAccent(raw);
  const title      = findTitle(doc);
  const difficulty = findDifficulty(doc);
  const problemNumber = findHeroNumber(doc);
  const heroDescription = findHeroDesc(doc);
  const tags       = findHeroTags(doc);
  const sections   = findSections(doc, audit, filename);
  const archSvg    = extractArchSvg(doc);
  const mermaid    = extractMermaid(doc, audit, filename);
  const related    = findRelatedFromSidebar(doc, audit, filename);
  const similar    = findSimilarCards(doc, audit, filename);

  const scriptText = [...doc.querySelectorAll("script")].map((s) => s.textContent || "").join("\n");
  const flowArrays = extractFlowArrays(scriptText);
  const flowSection = findFlowOwnerSection(doc);
  const flow = flowArrays
    ? { ...flowArrays, sectionId: flowSection ?? "architecture" }
    : null;

  // Plain-text blurb (~180 chars) from hero-desc / #problem / #requirements / first paragraph
  const blurbSrc =
    doc.querySelector(".hero-desc")?.textContent
    ?? doc.querySelector("#problem p, #requirements p, #requirements li")?.textContent
    ?? "";
  const blurb = blurbSrc.replace(/\s+/g, " ").trim().slice(0, 220);

  const category = CATEGORY_OF[slug] ?? "Other";

  // Read-time estimate — 225 wpm over all visible text in sections + hero.
  const allText = [
    heroDescription,
    ...sections.map((s) => s.html),
  ].join(" ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = allText ? allText.split(" ").length : 0;
  const readMinutes = Math.max(1, Math.round(wordCount / 225));

  // Per-problem inline CSS — write to public/styles/[slug].css
  const css = extractInlineCSS(raw);
  if (css) {
    await fs.writeFile(path.join(STYLES_DIR, `${slug}.css`), css);
  }

  return {
    slug,
    title,
    problemNumber,
    difficulty,
    heroDescription,
    tags,
    accent,
    category,
    blurb,
    sections,
    archSvg,
    flow,
    mermaid,
    related,
    similar,
    readMinutes,
  };
}

async function main() {
  await fs.mkdir(CONTENT_DIR, { recursive: true });
  await fs.mkdir(STYLES_DIR, { recursive: true });

  let all;
  try {
    all = (await fs.readdir(SRC_DIR))
      .filter((f) => f.endsWith(".html") && !SKIP.has(f));
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log(`(source dir ${SRC_DIR} does not exist — nothing to extract)`);
      return;
    }
    throw err;
  }

  const audit = [];
  const index = [];

  for (const f of all) {
    process.stdout.write(`  · extracting ${f}\n`);
    try {
      const rec = await extractFile(f, audit);
      await fs.writeFile(
        path.join(CONTENT_DIR, `${rec.slug}.json`),
        JSON.stringify(rec, null, 2)
      );
      index.push({
        slug: rec.slug,
        title: rec.title,
        difficulty: rec.difficulty,
        accent: rec.accent,
        tags: rec.tags,
        category: rec.category,
        blurb: rec.blurb,
        problemNumber: rec.problemNumber,
        readMinutes: rec.readMinutes,
      });
    } catch (err) {
      audit.push(`${f}: EXCEPTION ${err.message}`);
      console.error(`  ! ${f}: ${err.message}`);
    }
  }

  // Sort index: by category then by number/title
  index.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.problemNumber && b.problemNumber) return a.problemNumber.localeCompare(b.problemNumber);
    if (a.problemNumber) return -1;
    if (b.problemNumber) return 1;
    return a.title.localeCompare(b.title);
  });

  await fs.writeFile(path.join(CONTENT_DIR, "_index.json"), JSON.stringify(index, null, 2));
  await fs.writeFile(
    path.join(CONTENT_DIR, "_categories.json"),
    JSON.stringify(CATEGORIES, null, 2)
  );
  await fs.writeFile(path.join(CONTENT_DIR, "_link-audit.txt"), audit.join("\n") + "\n");

  const noun =
    KIND === "concepts"    ? "concepts" :
    KIND === "postmortems" ? "post-mortems" :
    KIND === "exercises"   ? "exercises" :
    "problems";
  const relContent = path.relative(path.resolve(__dirname, ".."), CONTENT_DIR);
  const relStyles = path.relative(path.resolve(__dirname, ".."), STYLES_DIR);
  console.log(`\n✓ Extracted ${index.length} ${noun} → ${relContent}/`);
  console.log(`✓ Wrote per-item CSS → ${relStyles}/`);
  console.log(`✓ Link audit: ${audit.length} unresolved entries → ${relContent}/_link-audit.txt`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
