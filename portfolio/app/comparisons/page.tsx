import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import type { IndexEntry } from "@/types/content";

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "comparisons", "_index.json"),
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
      path.join(process.cwd(), "content", "comparisons", "_categories.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const metadata = {
  title: "Comparisons",
  description:
    "Side-by-side comparisons of system design technologies — databases, message brokers, caching strategies, API protocols, and consistency models.",
  alternates: { canonical: "/comparisons" },
  openGraph: {
    title: "Comparisons — System Design Portfolio",
    description: "Side-by-side technology comparisons for system design interviews.",
    url: "/comparisons",
    images: ["/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Comparisons — System Design Portfolio",
    description: "Side-by-side technology comparisons for system design interviews.",
    images: ["/og-default.svg"],
  },
};

export default async function ComparisonsLandingPage() {
  const [index, categories] = await Promise.all([loadIndex(), loadCategories()]);
  const bySlug = new Map(index.map((e) => [e.slug, e]));
  const shipped = index.length;

  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        <header className="landing-hero">
          <div className="eyebrow">Comparisons</div>
          <h1>
            Side-by-side. <br />No hand-waving.
          </h1>
          <p>
            Head-to-head comparisons of the technologies you'll reference in
            every system design interview — databases, brokers, caching
            strategies, API protocols, and consistency models. Each includes a
            decision flowchart so you can justify your choice in 30 seconds.
          </p>
          <div className="stats">
            <span><b>{shipped}</b> comparisons</span>
            <span><b>{Object.keys(categories).length}</b> categories</span>
            <span>press <b>⌘K</b> to search</span>
          </div>
        </header>

        {shipped === 0 && (
          <div className="callout">
            <p>Comparisons are being authored — entries appear here as each is published.</p>
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
                    href={`/comparisons/${e.slug}`}
                    className="problem-card"
                    style={{
                      ["--accent-h" as any]: String(e.accent.h),
                      ["--accent-s" as any]: `${e.accent.s}%`,
                      ["--accent-l" as any]: `${e.accent.l}%`,
                    }}
                    data-card-kind="comparison"
                    data-card-slug={e.slug}
                  >
                    <div className="pc-head">
                      <span className="pc-eyebrow">Comparison</span>
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
