#!/usr/bin/env node
// Bump small font-size values in inline <style> blocks of source HTML files
// so per-page CSS doesn't visually undercut the modern global scale.
// Idempotent via marker comment.
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOTS = [
  path.resolve(__dirname, "..", ".."),                 // problem HTMLs
  path.resolve(__dirname, "..", "..", "concepts"),     // concepts
  path.resolve(__dirname, "..", "..", "postmortems"),  // post-mortems
  path.resolve(__dirname, "..", "..", "exercises"),    // exercises
];

const MARKER = "/* ux-v2-bumped */";

// Order matters: do larger first so a bumped value isn't re-bumped.
// Patterns match `font-size:13px` or `font-size: 13px` inside a <style> block.
const BUMPS = [
  [/font-size:\s*14px\b/g,   "font-size: 16px"],
  [/font-size:\s*13\.5px\b/g,"font-size: 15.5px"],
  [/font-size:\s*13px\b/g,   "font-size: 15px"],
  [/font-size:\s*12\.5px\b/g,"font-size: 14.5px"],
  [/font-size:\s*12px\b/g,   "font-size: 13.5px"],
  [/font-size:\s*11\.5px\b/g,"font-size: 13px"],
  [/font-size:\s*11px\b/g,   "font-size: 12px"],
  [/font-size:\s*10\.5px\b/g,"font-size: 12px"],
  [/font-size:\s*10px\b/g,   "font-size: 11px"],
  [/font-size:\s*9px\b/g,    "font-size: 10.5px"],
];

function bumpStyles(raw) {
  if (raw.includes(MARKER)) return null;

  // Only edit inside <style>...</style>
  return raw.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi, (_, open, body, close) => {
    let next = body;
    for (const [re, repl] of BUMPS) {
      next = next.replace(re, repl);
    }
    return `${open}\n${MARKER}\n${next}${close}`;
  });
}

let total = 0;
for (const dir of ROOTS) {
  let files;
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith(".html"));
  } catch {
    continue;
  }
  for (const f of files) {
    const fp = path.join(dir, f);
    const raw = await fs.readFile(fp, "utf8");
    const next = bumpStyles(raw);
    if (next && next !== raw) {
      await fs.writeFile(fp, next);
      total++;
      console.log(`  ✓ ${path.relative(path.resolve(__dirname, "..", ".."), fp)}`);
    }
  }
}
console.log(`\n✓ Bumped ${total} file(s).`);
