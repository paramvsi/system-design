import fs from "node:fs/promises";
import path from "node:path";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import ConceptCard from "@/components/ConceptCard";
import ProgressStats from "@/components/ProgressStats";
import ReadStateHydrator from "@/components/ReadStateHydrator";
import type { IndexEntry } from "@/types/content";

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "concepts", "_index.json"),
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
      path.join(process.cwd(), "content", "concepts", "_categories.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const metadata = {
  title: "Concepts",
  description:
    "Deep references for system design fundamentals — scaling, databases, caching, distributed systems, and more.",
  alternates: { canonical: "/concepts" },
  openGraph: {
    title: "Concepts — System Design Portfolio",
    description:
      "Deep references for system design fundamentals — 50 concepts across 10 categories.",
    url: "/concepts",
    images: ["/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Concepts — System Design Portfolio",
    description:
      "Deep references for system design fundamentals — 50 concepts across 10 categories.",
    images: ["/og-default.svg"],
  },
};

export default async function ConceptsLandingPage() {
  const [index, categories] = await Promise.all([loadIndex(), loadCategories()]);

  const bySlug = new Map(index.map((e) => [e.slug, e]));
  const shipped = index.length;
  const planned = Object.values(categories).reduce((n, arr) => n + arr.length, 0);

  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        <header className="landing-hero">
          <div className="eyebrow">Concepts</div>
          <h1>
            The vocabulary of <br />
            system design.
          </h1>
          <p>
            Deep, interview-grade references for the concepts that show up in every
            system design discussion. Each concept explains the intuition first,
            then the mechanics, then the tradeoffs, then the deep dive. Cross-linked
            to the problem pages that use them.
          </p>
          <div className="stats">
            <span>
              <b>{shipped}</b> / {planned} concepts shipped
            </span>
            <span>
              <b>{Object.keys(categories).length}</b> categories
            </span>
            <span>
              press <b>⌘K</b> to search
            </span>
          </div>
        </header>

        {shipped > 0 && (
          <ProgressStats
            kind="concept"
            total={shipped}
            categories={categories}
          />
        )}

        {shipped === 0 && (
          <div className="callout">
            <p>
              Concepts are being authored in batches. The taxonomy is planned and
              routes are live — entries appear here as each concept ships.
            </p>
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
                <span className="count">
                  {entries.length} / {slugs.length} shipped
                </span>
              </div>
              <div className="problem-grid">
                {entries.map((e) => (
                  <ConceptCard key={e.slug} entry={e} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <ReadStateHydrator />
      <Footer />
    </>
  );
}
