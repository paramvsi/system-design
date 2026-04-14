#!/usr/bin/env node
/**
 * generate-exercises.mjs
 *
 * Reads each problem JSON from portfolio/content/{slug}.json,
 * skips if exercises/exercise-{exerciseSlug}.html already exists,
 * and generates exercise HTML files following the exercise-instagram.html pattern.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const CONTENT_DIR = join(ROOT, 'portfolio', 'content');
const EXERCISES_DIR = join(ROOT, 'exercises');

/* ---------- slug mapping ---------- */
// Maps problem slug (from _index.json) -> exercise slug (file name without exercise- prefix)
// The exercise file will be exercise-{exerciseSlug}.html
const SLUG_TO_EXERCISE = {
  // Communication
  '004-whatsapp-system-design': 'whatsapp',
  'notification-system': 'notification-system',
  'video-conferencing': 'video-conferencing',
  'collaborative-whiteboard': 'collaborative-whiteboard',
  'gmail': 'gmail',
  'google-calendar': 'google-calendar',
  'reminder-alert': 'reminder-alert',
  'slack-discord': 'slack-discord',

  // Financial & Trading
  'bidding-platform': 'bidding-platform',
  'payment-gateway': 'payment-gateway',
  'crypto-exchange': 'crypto-exchange',
  'google-ads': 'google-ads',
  'stock-exchange': 'stock-exchange',
  'fraud-detection': 'fraud-detection',
  'stock-trading-platform': 'stock-trading-platform',

  // Gaming
  'pubg-system-design': 'pubg',

  // Infrastructure
  'distributed-queue': 'distributed-queue',
  'count-active-users': 'count-active-users',
  'distributed-job-scheduler': 'distributed-job-scheduler',
  'distributed-locking': 'distributed-locking',
  'design-cdn': 'design-cdn',
  'design-chatgpt': 'design-chatgpt',
  'code-deployment': 'code-deployment',
  'distributed-cache': 'distributed-cache',
  'leetcode-judge': 'leetcode-judge',
  'metrics-monitoring': 'metrics-monitoring',
  '007-rate-limiter': 'rate-limiter',
  'unique-id-generator': 'unique-id-generator',

  // Marketplace & Booking
  'ticketmaster-system-design': 'ticketmaster',
  'uber-system-design': 'uber',
  'ecommerce-system-design': 'ecommerce',
  'airbnb': 'airbnb',
  'doordash-uber-eats': 'doordash',
  'flash-sale': 'flash-sale',
  'shopping-cart': 'shopping-cart',
  '001-url-shortener': 'url-shortener',

  // Media & Streaming
  '005-youtube-netflix': 'youtube-netflix',
  'live-streaming': 'live-streaming',

  // Search & Discovery
  'google-maps': 'google-maps',
  'google-news': 'google-news',
  '006-typeahead-suggestions': 'typeahead-suggestions',
  'search-engine': 'search-engine',
  '008-web-crawler': 'web-crawler',
  '009-yelp-google-places': 'yelp-google-places',

  // Social & Feed
  'leaderboard': 'leaderboard',
  'reddit-comments': 'reddit-comments',
  'mutual-connections': 'mutual-connections',
  'recommendation-algorithm': 'recommendation-algorithm',
  'ad-click-aggregator': 'ad-click-aggregator',
  'instagram': 'instagram',
  '002-news-feed': 'news-feed',
  'reddit-full': 'reddit-full',
  'twitter-trending': 'twitter-trending',
  'youtube-likes-counter': 'youtube-likes-counter',

  // Storage & Data
  'google-docs': 'google-docs',
  's3-object-storage': 's3-object-storage',
  'distributed-logging': 'distributed-logging',
  'dropbox-sync': 'dropbox-sync',
  '003-google-drive': 'google-drive',
  'key-value-store': 'key-value-store',
};

/* ---------- helpers ---------- */

function stripHtmlTags(html) {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Extract <li> text items from an HTML string */
function extractListItems(html) {
  const items = [];
  const re = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = stripHtmlTags(m[1]).replace(/\s+/g, ' ').trim();
    if (text) items.push(text);
  }
  return items;
}

/** Extract "bad" texts from antipatterns section */
function extractAntipatternBads(html) {
  const bads = [];
  const re = /<div class="bad">([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = stripHtmlTags(m[1]).replace(/\s+/g, ' ').trim();
    if (text) bads.push(text);
  }
  return bads;
}

/** Generate 3 generic red flags based on the problem title */
function genericRedFlags(title) {
  return [
    `No back-of-envelope estimation — jumps straight into components without quantifying scale for ${title}`,
    `Single point of failure — no replication, failover, or redundancy discussed`,
    `Ignores data model and storage choices — hand-waves the database layer`,
  ];
}

/** Distribute points across N rubric items summing to 10 */
function distributePoints(n) {
  if (n <= 0) return [];
  const base = Math.floor(10 / n);
  let remainder = 10 - base * n;
  const pts = [];
  for (let i = 0; i < n; i++) {
    if (remainder > 0) {
      pts.push(base + 1);
      remainder--;
    } else {
      pts.push(base);
    }
  }
  return pts;
}

/** Escape HTML special chars for safe embedding */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- main ---------- */

const index = JSON.parse(readFileSync(join(CONTENT_DIR, '_index.json'), 'utf-8'));

let generated = 0;
let skipped = 0;
let errors = 0;

for (const entry of index) {
  const problemSlug = entry.slug;
  const exerciseSlug = SLUG_TO_EXERCISE[problemSlug];

  if (!exerciseSlug) {
    console.error(`[WARN] No exercise slug mapping for problem: ${problemSlug}`);
    errors++;
    continue;
  }

  const exerciseFile = join(EXERCISES_DIR, `exercise-${exerciseSlug}.html`);

  // Skip if exercise already exists
  if (existsSync(exerciseFile)) {
    console.log(`[SKIP] exercise-${exerciseSlug}.html already exists`);
    skipped++;
    continue;
  }

  // Read problem JSON
  const problemFile = join(CONTENT_DIR, `${problemSlug}.json`);
  if (!existsSync(problemFile)) {
    console.error(`[ERR] Problem JSON not found: ${problemFile}`);
    errors++;
    continue;
  }

  const problem = JSON.parse(readFileSync(problemFile, 'utf-8'));
  const { accent, title, heroDescription, sections } = problem;

  // Find interview-tips section
  const tipsSection = (sections || []).find(s => s.id === 'interview-tips');
  const tipsHtml = tipsSection ? tipsSection.html : '';
  const tipItems = extractListItems(tipsHtml);

  // Find antipatterns section
  const antiSection = (sections || []).find(s => s.id === 'antipatterns');
  const antiHtml = antiSection ? antiSection.html : '';
  const antiBads = extractAntipatternBads(antiHtml);

  // Build hints (first 3 tip items)
  const hintItems = tipItems.slice(0, 3);
  const hintsHtml = hintItems.map((text, i) =>
    `      <details class="exercise-hint">
        <summary>Hint ${i + 1}</summary>
        <p>${escapeHtml(text)}</p>
      </details>`
  ).join('\n');

  // Fallback hints if no tips found
  const finalHintsHtml = hintsHtml || `      <details class="exercise-hint">
        <summary>Hint 1</summary>
        <p>Start with requirements: functional vs non-functional. Clarify the scale (users, QPS, storage).</p>
      </details>
      <details class="exercise-hint">
        <summary>Hint 2</summary>
        <p>Think about the data model first. What entities exist? What are the access patterns?</p>
      </details>
      <details class="exercise-hint">
        <summary>Hint 3</summary>
        <p>Identify the hardest sub-problem and deep-dive into it. Show you can go beyond boxes and arrows.</p>
      </details>`;

  // Build rubric (up to 8 items from tips)
  const rubricItems = tipItems.slice(0, 8);
  const points = distributePoints(rubricItems.length || 5);

  let rubricListHtml;
  if (rubricItems.length > 0) {
    rubricListHtml = rubricItems.map((text, i) =>
      `      <li><span class="rubric-points">+${points[i]}</span> ${escapeHtml(text)}</li>`
    ).join('\n');
  } else {
    // Generate generic rubric items
    const genericRubric = [
      'Back-of-envelope estimation with concrete numbers',
      'Clear API design with key endpoints',
      'Sensible data model and storage choices',
      'Addresses scalability (sharding, caching, CDN)',
      'Discusses failure modes and mitigations',
    ];
    const gp = distributePoints(genericRubric.length);
    rubricListHtml = genericRubric.map((text, i) =>
      `      <li><span class="rubric-points">+${gp[i]}</span> ${text}</li>`
    ).join('\n');
  }

  // Build red flags
  let redFlagItems;
  if (antiBads.length >= 3) {
    redFlagItems = antiBads.slice(0, 5);
  } else {
    redFlagItems = genericRedFlags(title);
  }
  const redFlagsHtml = redFlagItems.map(text =>
    `        <li>${escapeHtml(text)}</li>`
  ).join('\n');

  // Build prompt text from heroDescription
  let promptText = '';
  if (heroDescription) {
    // heroDescription may contain HTML spans; strip them for the exercise prompt
    promptText = stripHtmlTags(heroDescription).replace(/\s+/g, ' ').trim();
  } else {
    promptText = entry.blurb || `Design ${title} at scale.`;
  }

  // Determine time budget based on readMinutes
  const timeBudget = (entry.readMinutes && entry.readMinutes >= 15) ? '60 min' : '45 min';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(title)} — Exercise</title>
  <style>
/* ux-v2-bumped */
:root { --accent-h: ${accent.h}; --accent-s: ${accent.s}%; --accent-l: ${accent.l}%; }
    .exercise-hint { background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; margin-bottom: 8px; }
    .exercise-hint summary { cursor: pointer; font-family: var(--font-mono); font-size: 13.5px; color: var(--accent-text); letter-spacing: 0.04em; text-transform: uppercase; font-weight: 500; }
    .exercise-hint p { margin: 8px 0 0; font-size: 15px; color: var(--text-secondary); }
    .rubric-list { padding-left: 0; list-style: none; }
    .rubric-list li { padding: 8px 12px; background: var(--bg-subtle); border-left: 3px solid var(--accent-border); border-radius: 4px; margin-bottom: 6px; font-size: 15px; }
    .rubric-points { display: inline-block; min-width: 28px; background: var(--accent-light); color: var(--accent-text); font-family: var(--font-mono); font-size: 12px; font-weight: 600; padding: 2px 6px; border-radius: 3px; margin-right: 8px; }
    .redflag-list { list-style: "\\1F6AB "; padding-left: 28px; }
    .redflag-list li { font-size: 15px; color: var(--text-secondary); margin-bottom: 6px; }
    .reveal-gate { text-align: center; padding: 20px; background: var(--bg-subtle); border: 1px dashed var(--border); border-radius: 8px; color: var(--text-muted); font-size: 15px; }
  </style>
</head>
<body>

<main>

  <div class="hero" id="problem">
    <div class="hero-kicker">Exercise · ${timeBudget} whiteboard</div>
    <h1 class="hero-title">${escapeHtml(title)}</h1>
    <p class="hero-desc">Whiteboard exercise. Try the problem cold, then reveal the rubric to self-score.</p>
    <div class="hero-tags">
      <span class="tag accent">Out of 10 points</span>
      <span class="tag">${timeBudget} whiteboard</span>
      <span class="tag"><a href="/${problemSlug}">Reference solution →</a></span>
    </div>
  </div>

  <section class="section" id="prompt">
    <div class="section-head"><span class="section-n">01</span><h2 class="section-title">Prompt</h2></div>
    <div class="prose">
      <p>${escapeHtml(promptText)}</p>
      <p><strong>Time budget:</strong> ${timeBudget} whiteboard. Draw architecture, estimate numbers, discuss tradeoffs.</p>
    </div>
  </section>

  <section class="section" id="hints">
    <div class="section-head"><span class="section-n">02</span><h2 class="section-title">Hints (progressive — click to reveal)</h2></div>
    <div class="prose">

${finalHintsHtml}
    </div>
  </section>

  <section class="section" id="rubric" data-reveal-gate="rubric">
    <div class="section-head"><span class="section-n">03</span><h2 class="section-title">Rubric — 10 points</h2></div>
    <div class="prose">
      <ul class="rubric-list">
${rubricListHtml}
      </ul>
      <p><strong>Self-score:</strong> tally the points you would have mentioned unprompted. 7+ is interview-ready on this problem.</p>
    </div>
  </section>

  <section class="section" id="redflags" data-reveal-gate="redflags">
    <div class="section-head"><span class="section-n">04</span><h2 class="section-title">Red flags (things that tank the interview)</h2></div>
    <div class="prose">
      <ul class="redflag-list">
${redFlagsHtml}
      </ul>
    </div>
  </section>

</main>
</body>
</html>
`;

  writeFileSync(exerciseFile, html, 'utf-8');
  console.log(`[GEN] exercise-${exerciseSlug}.html`);
  generated++;
}

console.log(`\nDone. Generated: ${generated}, Skipped: ${skipped}, Errors: ${errors}`);
console.log(`Total exercises: ${generated + skipped}`);
