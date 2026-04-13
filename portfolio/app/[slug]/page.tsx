import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ProblemSectionBody from "@/components/ProblemSectionBody";
import BackToTop from "@/components/BackToTop";
import WhatsNext, { type NextLink } from "@/components/WhatsNext";
import ReadToggle from "@/components/ReadToggle";
import PracticeMode from "@/components/PracticeMode";
import type { ProblemContent } from "@/types/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content");
  const entries = await fs.readdir(dir);
  return entries
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .map((f) => ({ slug: f.replace(/\.json$/, "") }));
}

async function loadContent(slug: string): Promise<ProblemContent | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", `${slug}.json`),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
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

async function loadProblemCSS(slug: string): Promise<string> {
  try {
    return await fs.readFile(
      path.join(process.cwd(), "public", "styles", `${slug}.css`),
      "utf8"
    );
  } catch {
    return "";
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
  const title = `${c.title} — System Design`;
  const description = c.blurb || `System design reference for ${c.title}`;
  const url = `/${slug}`;
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

export default async function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [c, css, links, conceptIndex] = await Promise.all([
    loadContent(slug),
    loadProblemCSS(slug),
    loadConceptProblemLinks(),
    loadConceptIndex(),
  ]);
  if (!c) notFound();

  // Invert the concept→problems map to find concepts that list THIS problem.
  const conceptTitleBySlug = new Map(
    conceptIndex.map((e) => [e.slug, e.title])
  );
  const conceptsUsed: Array<{ slug: string; label: string }> = [];
  for (const [conceptSlug, probSlugs] of Object.entries(links)) {
    if (probSlugs.includes(slug) && conceptTitleBySlug.has(conceptSlug)) {
      conceptsUsed.push({
        slug: conceptSlug,
        label: conceptTitleBySlug.get(conceptSlug)!,
      });
    }
  }

  // "Next up" — first similar problems, then top concepts-used
  const nextUp: NextLink[] = [
    ...c.similar.slice(0, 2).map((s) => ({
      slug: s.slug,
      title: s.name,
      kind: "problem" as const,
      reason: s.why,
    })),
    ...conceptsUsed.slice(0, 1).map((cu) => ({
      slug: cu.slug,
      title: cu.label,
      kind: "concept" as const,
      reason: "Foundational concept used here",
    })),
  ].slice(0, 3);

  const accentStyle = {
    ["--accent-h" as any]: String(c.accent.h),
    ["--accent-s" as any]: `${c.accent.s}%`,
    ["--accent-l" as any]: `${c.accent.l}%`,
  } as React.CSSProperties;

  // Ensure sidebar includes "Problem Statement" even when the source puts
  // problem content inside .hero instead of a #problem section.
  const hasProblemSection = c.sections.some((s) => s.id === "problem");
  const sidebarSections = hasProblemSection
    ? c.sections.map((s) => ({ id: s.id, label: s.label, number: s.number }))
    : [
        { id: "problem", label: "Problem Statement" },
        ...c.sections.map((s) => ({ id: s.id, label: s.label, number: s.number })),
      ];

  return (
    <>
      {/* Per-problem CSS — loaded after globals.css so problem-specific rules win. */}
      {css && (
        <style
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: css }}
        />
      )}

      <div className="layout" style={accentStyle}>
        <Topbar title={c.title} difficulty={c.difficulty} />
        <Sidebar
          sections={sidebarSections}
          related={c.related}
          conceptsUsed={conceptsUsed}
        />

        <main id="main" className="main">
          <PracticeMode />
          <div
            className="hero"
            id="problem"
            data-pagefind-body
            data-pagefind-meta={`title:${c.title}`}
            data-pagefind-filter={`category:${c.category}`}
          >
            {c.problemNumber && (
              <div className="hero-number hero-kicker">
                System Design — {c.problemNumber}
              </div>
            )}
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
              <ReadToggle kind="problem" slug={slug} />
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
