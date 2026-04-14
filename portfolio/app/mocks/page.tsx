import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import type { IndexEntry } from "@/types/content";

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "mocks", "_index.json"),
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
      path.join(process.cwd(), "content", "mocks", "_categories.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const metadata = {
  title: "Mock Interviews",
  description:
    "Annotated mock interview transcripts — see how strong candidates tackle system design problems, with inline coaching notes.",
  alternates: { canonical: "/mocks" },
  openGraph: {
    title: "Mock Interviews — System Design Portfolio",
    description: "Annotated mock interview transcripts with inline coaching.",
    url: "/mocks",
    images: ["/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Mock Interviews — System Design Portfolio",
    description: "Annotated mock interview transcripts with inline coaching.",
    images: ["/og-default.svg"],
  },
};

export default async function MocksLandingPage() {
  const [index, categories] = await Promise.all([loadIndex(), loadCategories()]);
  const bySlug = new Map(index.map((e) => [e.slug, e]));
  const shipped = index.length;

  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        <header className="landing-hero">
          <div className="eyebrow">Mock Interviews</div>
          <h1>
            Watch the interview. <br />Learn the patterns.
          </h1>
          <p>
            Annotated mock interview transcripts for system design — each a
            45-minute simulation with inline coaching annotations that highlight
            what earns points and what falls flat. Study the dialog patterns
            before your next interview.
          </p>
          <div className="stats">
            <span><b>{shipped}</b> mock transcripts</span>
            <span><b>{Object.keys(categories).length}</b> topic clusters</span>
            <span>press <b>⌘K</b> to search</span>
          </div>
        </header>

        {shipped === 0 && (
          <div className="callout">
            <p>Mock transcripts are being authored — entries appear here as each is published.</p>
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
                    href={`/mocks/${e.slug}`}
                    className="problem-card"
                    style={{
                      ["--accent-h" as any]: String(e.accent.h),
                      ["--accent-s" as any]: `${e.accent.s}%`,
                      ["--accent-l" as any]: `${e.accent.l}%`,
                    }}
                    data-card-kind="mock"
                    data-card-slug={e.slug}
                  >
                    <div className="pc-head">
                      <span className="pc-eyebrow">Mock Interview</span>
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
