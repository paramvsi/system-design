import fs from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import ProblemSectionBody from "@/components/ProblemSectionBody";
import BackToTop from "@/components/BackToTop";
import type { ProblemContent } from "@/types/content";

export const dynamicParams = false;

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content", "mocks");
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
      path.join(process.cwd(), "content", "mocks", `${slug}.json`),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function loadCSS(slug: string): Promise<string> {
  try {
    return await fs.readFile(
      path.join(process.cwd(), "public", "styles", "mocks", `${slug}.css`),
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
  const title = `${c.title} — Mock Interview`;
  const description = c.blurb || `Mock Interview: ${c.title}`;
  const url = `/mocks/${slug}`;
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

export default async function MockPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [c, css] = await Promise.all([loadContent(slug), loadCSS(slug)]);
  if (!c) notFound();

  const accentStyle = {
    ["--accent-h" as any]: String(c.accent.h),
    ["--accent-s" as any]: `${c.accent.s}%`,
    ["--accent-l" as any]: `${c.accent.l}%`,
  } as React.CSSProperties;

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
        <Topbar title={c.title} difficulty={c.difficulty} kind="mock" />
        <Sidebar sections={sidebarSections} related={[]} usedIn={[]} relatedConcepts={[]} />

        <main id="main" className="main">
          <div
            className="hero"
            id="problem"
            data-pagefind-body
            data-pagefind-meta={`title:${c.title}`}
            data-pagefind-filter={`category:${c.category}`}
          >
            <div className="hero-number hero-kicker">
              Mock Interview · {c.category}
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
          </div>

          {c.sections.map((sec) => (
            <ProblemSectionBody
              key={sec.id}
              section={sec}
              flow={null}
              accent={c.accent}
            />
          ))}
        </main>
      </div>
      <BackToTop />
    </>
  );
}
