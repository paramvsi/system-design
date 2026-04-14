#!/usr/bin/env node
/**
 * Upgrade all #references sections from iframe embeds to
 * high-res thumbnail cards with click-to-play.
 * Also strips existing references so we can re-inject cleanly.
 */
import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");

// Strip existing references sections from all HTML files in a dir
async function stripRefs(dir) {
  let files;
  try {
    files = (await fs.readdir(dir)).filter(f => f.endsWith(".html"));
  } catch { return 0; }

  let count = 0;
  for (const f of files) {
    const fp = path.join(dir, f);
    let raw = await fs.readFile(fp, "utf8");
    // Remove <section ... id="references"> ... </section>
    const re = /\n?\s*<section\s[^>]*id="references"[^>]*>[\s\S]*?<\/section>\s*\n?/g;
    const next = raw.replace(re, "\n");
    if (next !== raw) {
      await fs.writeFile(fp, next);
      count++;
    }
  }
  return count;
}

// Strip from both problems and concepts
const s1 = await stripRefs(ROOT);
const s2 = await stripRefs(path.join(ROOT, "concepts"));
console.log(`Stripped references from ${s1} problem + ${s2} concept files.`);
