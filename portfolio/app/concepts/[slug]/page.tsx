import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ProblemSectionBody from "@/components/ProblemSectionBody";
import BackToTop from "@/components/BackToTop";
import WhatsNext, { type NextLink } from "@/components/WhatsNext";
import ReadToggle from "@/components/ReadToggle";
import type { ProblemContent, IndexEntry } from "@/types/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content", "concepts");
  try {
    const entries = await fs.readdir(dir);
    return entries
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .map((f) => ({ slug: f.replace(/\.json$/, "") }));
  } catch {
    return [];
  }
}

async function loadContent(slug: string): Promise<ProblemContent | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "concepts", `${slug}.json`),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function loadConceptCSS(slug: string): Promise<string> {
  try {
    return await fs.readFile(
      path.join(process.cwd(), "public", "styles", "concepts", `${slug}.css`),
      "utf8"
    );
  } catch {
    return "";
  }
}

async function loadConceptProblemLinks(): Promise<Record<string, string[]>> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "_concept-problem-links.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function loadConceptConceptLinks(): Promise<Record<string, string[]>> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "_concept-concept-links.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function loadConceptIndex(): Promise<Array<{ slug: string; title: string }>> {
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

async function loadProblemIndex(): Promise<IndexEntry[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "_index.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await loadContent(slug);
  if (!c) return {};
  const title = `${c.title} — Concept`;
  const description = c.blurb || `System design concept: ${c.title}`;
  const url = `/concepts/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: ["/og-default.svg"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.svg"],
    },
  };
}

export default async function ConceptPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [c, css, links, problemIndex, conceptConceptLinks, conceptIndex] = await Promise.all([
    loadContent(slug),
    loadConceptCSS(slug),
    loadConceptProblemLinks(),
    loadProblemIndex(),
    loadConceptConceptLinks(),
    loadConceptIndex(),
  ]);
  if (!c) notFound();

  const accentStyle = {
    ["--accent-h" as any]: String(c.accent.h),
    ["--accent-s" as any]: `${c.accent.s}%`,
    ["--accent-l" as any]: `${c.accent.l}%`,
  } as React.CSSProperties;

  // "Used in" — problems that reference this concept
  const usedInSlugs = links[slug] ?? [];
  const bySlug = new Map(problemIndex.map((e) => [e.slug, e]));
  const usedIn = usedInSlugs
    .map((s) => bySlug.get(s))
    .filter((e): e is IndexEntry => !!e)
    .map((e) => ({ slug: e.slug, label: e.title }));

  // Related concepts
  const conceptBySlug = new Map(conceptIndex.map((e) => [e.slug, e]));
  const relatedConcepts = (conceptConceptLinks[slug] ?? [])
    .map((s) => conceptBySlug.get(s))
    .filter((e): e is { slug: string; title: string } => !!e)
    .map((e) => ({ slug: e.slug, label: e.title }));

  // "Next up" — concept-concept first, then fall back to "used in" problems
  const nextUp: NextLink[] = [
    ...relatedConcepts.slice(0, 2).map((r) => ({
      slug: r.slug,
      title: r.label,
      kind: "concept" as const,
    })),
    ...usedIn.slice(0, 1).map((r) => ({
      slug: r.slug,
      title: r.label,
      kind: "problem" as const,
      reason: "Uses this concept in practice",
    })),
  ].slice(0, 3);

  const hasProblemSection = c.sections.some((s) => s.id === "problem");
  const sidebarSections = hasProblemSection
    ? c.sections.map((s) => ({ id: s.id, label: s.label, number: s.number }))
    : [
        { id: "problem", label: "Problem" },
        ...c.sections.map((s) => ({ id: s.id, label: s.label, number: s.number })),
      ];

  return (
    <>
      {css && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: css }}
        />
      )}

      <div className="layout" style={accentStyle}>
        <Topbar title={c.title} difficulty={c.difficulty} kind="concept" />
        <Sidebar
          sections={sidebarSections}
          related={c.related}
          usedIn={usedIn}
          relatedConcepts={relatedConcepts}
        />

        <main id="main" className="main">
          <div
            className="hero"
            id="problem"
            data-pagefind-body
            data-pagefind-meta={`title:${c.title}`}
            data-pagefind-filter={`category:${c.category}`}
          >
            <div className="hero-number hero-kicker">
              Concept · {c.category}
            </div>
            <h1 className="hero-title">{c.title}</h1>
            {c.heroDescription && (
              <p
                className="hero-desc"
                suppressHydrationWarning
                dangerouslySetInnerHTML={{ __html: c.heroDescription }}
              />
            )}
            {c.tags.length > 0 && (
              <div className="hero-tags">
                {c.tags.map((t, i) => (
                  <span className="hero-tag tag" key={i}>
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="hero-actions">
              <ReadToggle kind="concept" slug={slug} />
            </div>
          </div>

          {c.sections.map((sec) => (
            <ProblemSectionBody
              key={sec.id}
              section={sec}
              flow={c.flow && c.flow.sectionId === sec.id ? c.flow : null}
              accent={c.accent}
            />
          ))}
          <WhatsNext items={nextUp} />
        </main>
      </div>
      <BackToTop />
    </>
  );
}
