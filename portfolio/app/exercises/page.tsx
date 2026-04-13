import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import type { IndexEntry } from "@/types/content";

async function loadIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "exercises", "_index.json"),
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
      path.join(process.cwd(), "content", "exercises", "_categories.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const metadata = {
  title: "Exercises",
  description:
    "Whiteboard exercises with progressive hints and scoring rubrics. Try cold, then reveal the rubric to self-score.",
  alternates: { canonical: "/exercises" },
  openGraph: {
    title: "Exercises — System Design Portfolio",
    description: "Self-scored whiteboard practice for 15 core problems.",
    url: "/exercises",
    images: ["/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Exercises — System Design Portfolio",
    description: "Self-scored whiteboard practice for 15 core problems.",
    images: ["/og-default.svg"],
  },
};

export default async function ExercisesLandingPage() {
  const [index, categories] = await Promise.all([loadIndex(), loadCategories()]);
  const bySlug = new Map(index.map((e) => [e.slug, e]));
  const shipped = index.length;

  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        <header className="landing-hero">
          <div className="eyebrow">Exercises</div>
          <h1>Practice. <br />Self-score.</h1>
          <p>
            Whiteboard practice for 15 canonical system design problems. Each
            exercise is prompt-only at first — hints are collapsible, rubric
            and red-flags are gated behind a "reveal" button. The goal: try it
            cold, then measure yourself against the rubric.
          </p>
          <div className="stats">
            <span><b>{shipped}</b> exercises</span>
            <span>~10 points each</span>
            <span>press <b>⌘K</b> to search</span>
          </div>
        </header>

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
                    href={`/exercises/${e.slug}`}
                    className="problem-card"
                    style={{
                      ["--accent-h" as any]: String(e.accent.h),
                      ["--accent-s" as any]: `${e.accent.s}%`,
                      ["--accent-l" as any]: `${e.accent.l}%`,
                    }}
                    data-card-kind="exercise"
                    data-card-slug={e.slug}
                  >
                    <div className="pc-head">
                      <span className="pc-eyebrow">Exercise</span>
                      <span className="pc-mins">{e.readMinutes} min</span>
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
