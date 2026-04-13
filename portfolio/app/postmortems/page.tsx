import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import type { IndexEntry } from "@/types/content";

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "postmortems", "_index.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function loadCategories(): Promise<Record<string, string[]>> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "postmortems", "_categories.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const metadata = {
  title: "Post-mortems",
  description:
    "Real-world system failures — what happened, root cause, lessons — with cross-links to the concepts each exercised.",
  alternates: { canonical: "/postmortems" },
  openGraph: {
    title: "Post-mortems — System Design Portfolio",
    description: "Real-world outages with root cause + lessons.",
    url: "/postmortems",
    images: ["/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Post-mortems — System Design Portfolio",
    description: "Real-world outages with root cause + lessons.",
    images: ["/og-default.svg"],
  },
};

export default async function PostmortemsLandingPage() {
  const [index, categories] = await Promise.all([loadIndex(), loadCategories()]);
  const bySlug = new Map(index.map((e) => [e.slug, e]));
  const shipped = index.length;

  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        <header className="landing-hero">
          <div className="eyebrow">Post-mortems</div>
          <h1>
            Real failures. <br />Real root causes.
          </h1>
          <p>
            Real-world outages from AWS, Cloudflare, GitHub, GitLab, Meta,
            Slack, Roblox, Reddit, Datadog and others — each a canonical
            teaching case for a specific failure mode. Read before system
            design interviews to calibrate what actually goes wrong at scale.
          </p>
          <div className="stats">
            <span><b>{shipped}</b> post-mortems</span>
            <span><b>{Object.keys(categories).length}</b> failure-mode clusters</span>
            <span>press <b>⌘K</b> to search</span>
          </div>
        </header>

        {shipped === 0 && (
          <div className="callout">
            <p>Post-mortems are being authored — entries appear here as each is published.</p>
          </div>
        )}

        {Object.entries(categories).map(([cat, slugs]) => {
          const entries = slugs
            .map((s) => bySlug.get(s))
            .filter((e): e is IndexEntry => !!e);
          if (entries.length === 0) return null;
          return (
            <section className="category-block" key={cat}>
              <div className="category-header">
                <h2>{cat}</h2>
                <span className="count">{entries.length} shipped</span>
              </div>
              <div className="problem-grid">
                {entries.map((e) => (
                  <Link
                    key={e.slug}
                    href={`/postmortems/${e.slug}`}
                    className="problem-card"
                    style={{
                      ["--accent-h" as any]: String(e.accent.h),
                      ["--accent-s" as any]: `${e.accent.s}%`,
                      ["--accent-l" as any]: `${e.accent.l}%`,
                    }}
                    data-card-kind="postmortem"
                    data-card-slug={e.slug}
                  >
                    <div className="pc-head">
                      <span className="pc-eyebrow">Post-mortem</span>
                      <span className="pc-mins">{e.readMinutes} min read</span>
                    </div>
                    <h3 className="pc-title">{e.title}</h3>
                    <p className="pc-blurb">{e.blurb}</p>
                    <div className="pc-tags">
                      {e.tags.slice(0, 3).map((t, i) => (
                        <span className="tag" key={i}>{t}</span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <Footer />
    </>
  );
}
