import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";
import ProblemCard from "@/components/ProblemCard";
import BrowseSection from "@/components/BrowseSection";
import ProgressStats from "@/components/ProgressStats";
import SRSTracker from "@/components/SRSTracker";
import ReadStateHydrator from "@/components/ReadStateHydrator";
import type { IndexEntry } from "@/types/content";

async function loadIndex(): Promise<IndexEntry[]> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "content", "_index.json"),
    "utf8"
  );
  return JSON.parse(raw);
}

async function loadCategories(): Promise<Record<string, string[]>> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "content", "_categories.json"),
    "utf8"
  );
  return JSON.parse(raw);
}

async function loadConceptCount(): Promise<number> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "concepts", "_index.json"),
      "utf8"
    );
    return JSON.parse(raw).length;
  } catch {
    return 110;
  }
}

async function loadPostmortemCount(): Promise<number> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "postmortems", "_index.json"),
      "utf8"
    );
    return JSON.parse(raw).length;
  } catch {
    return 12;
  }
}

async function loadExerciseCount(): Promise<number> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "exercises", "_index.json"),
      "utf8"
    );
    return JSON.parse(raw).length;
  } catch {
    return 15;
  }
}

async function loadQuizCount(): Promise<number> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "quiz", "_index.json"),
      "utf8"
    );
    return JSON.parse(raw).length;
  } catch {
    return 11;
  }
}

// Canonical interview-grade problems for the "Featured" showcase.
const FEATURED_SLUGS = [
  "instagram",
  "005-youtube-netflix",
  "uber-system-design",
  "stock-exchange",
  "search-engine",
  "004-whatsapp-system-design",
];

export default async function LandingPage() {
  const [index, categories, conceptCount, postmortemCount, exerciseCount, quizCount] =
    await Promise.all([
      loadIndex(),
      loadCategories(),
      loadConceptCount(),
      loadPostmortemCount(),
      loadExerciseCount(),
      loadQuizCount(),
    ]);

  const bySlug = new Map(index.map((e) => [e.slug, e]));
  const seen = new Set<string>();
  const featured = FEATURED_SLUGS
    .map((s) => bySlug.get(s))
    .filter((e): e is IndexEntry => !!e);

  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <header className="home-hero">
          <div className="home-hero-inner">
            <div className="home-hero-content">
              <div className="home-hero-eyebrow">
                <span className="pulse-dot"></span>
                <span>System Design, done properly</span>
              </div>
              <h1 className="home-hero-title">
                Deep architecture.<br />
                Real tradeoffs.<br />
                <em>Production scale.</em>
              </h1>
              <p className="home-hero-subtitle">
                The open-source system design library engineers actually read
                before interviews. {index.length} canonical problems, {conceptCount} concept
                references, real post-mortems, practice exercises, and self-scored
                quizzes — all free, all opinionated, all in one place.
              </p>
              <div className="home-hero-actions">
                <Link href="#start-here" className="btn-primary">
                  Where to start →
                </Link>
                <Link href="/concepts" className="btn-secondary">
                  Browse concepts
                </Link>
                <button
                  type="button"
                  data-search-trigger
                  className="btn-ghost"
                  aria-label="Open search"
                >
                  <kbd>⌘K</kbd> to search
                </button>
              </div>
            </div>

            <div className="home-hero-stats" aria-label="Site contents">
              <Link href="/" className="stat-card">
                <div className="stat-num">{index.length}</div>
                <div className="stat-lbl">Problems</div>
                <div className="stat-sub">full system designs</div>
              </Link>
              <Link href="/concepts" className="stat-card">
                <div className="stat-num">{conceptCount}</div>
                <div className="stat-lbl">Concepts</div>
                <div className="stat-sub">fundamental references</div>
              </Link>
              <Link href="/exercises" className="stat-card">
                <div className="stat-num">{exerciseCount}</div>
                <div className="stat-lbl">Exercises</div>
                <div className="stat-sub">with scoring rubrics</div>
              </Link>
              <Link href="/quiz" className="stat-card">
                <div className="stat-num">{quizCount}</div>
                <div className="stat-lbl">Quizzes</div>
                <div className="stat-sub">80+ questions</div>
              </Link>
              <Link href="/postmortems" className="stat-card">
                <div className="stat-num">{postmortemCount}</div>
                <div className="stat-lbl">Post-mortems</div>
                <div className="stat-sub">real-world failures</div>
              </Link>
            </div>
          </div>
        </header>

        {/* ═══════════════════ PATHWAY PICKER ═══════════════════ */}
        <section className="pathway-section" id="start-here">
          <div className="section-lead">
            <div className="lead-eyebrow">Start here</div>
            <h2 className="lead-title">What brings you in?</h2>
            <p className="lead-desc">
              Three paths through the material. Pick the one that matches
              your goal right now.
            </p>
          </div>

          <div className="pathway-grid">
            <Link href="/exercises" className="pathway-card" style={{ ["--p-h" as any]: "12" }}>
              <div className="pathway-num">01</div>
              <div className="pathway-title">I have an interview this month</div>
              <p className="pathway-desc">
                Start with the 15 whiteboard exercises — each has
                progressive hints and a scoring rubric. Score yourself cold
                before reading the reference solution.
              </p>
              <div className="pathway-meta">
                <span>→ Exercises</span>
                <span className="pathway-count">15 drills</span>
              </div>
            </Link>

            <Link href="/concepts" className="pathway-card" style={{ ["--p-h" as any]: "205" }}>
              <div className="pathway-num">02</div>
              <div className="pathway-title">I want deep understanding</div>
              <p className="pathway-desc">
                110 concept references grouped into 15 categories —
                caching, databases, consensus, messaging, ML systems,
                architecture patterns. Each with code snippets + diagrams.
              </p>
              <div className="pathway-meta">
                <span>→ Concepts</span>
                <span className="pathway-count">110 refs</span>
              </div>
            </Link>

            <Link href="/postmortems" className="pathway-card" style={{ ["--p-h" as any]: "0" }}>
              <div className="pathway-num">03</div>
              <div className="pathway-title">I learn best from failures</div>
              <p className="pathway-desc">
                12 real-world outages — AWS S3 typo, Cloudflare regex,
                Facebook BGP, CrowdStrike kernel panic, Knight Capital's
                $440M glitch. What actually breaks at scale.
              </p>
              <div className="pathway-meta">
                <span>→ Post-mortems</span>
                <span className="pathway-count">12 stories</span>
              </div>
            </Link>
          </div>
        </section>

        {/* ═══════════════════ FEATURED ═══════════════════ */}
        {featured.length > 0 && (
          <section className="featured-section">
            <div className="section-lead">
              <div className="lead-eyebrow">Featured</div>
              <h2 className="lead-title">Six canonical systems</h2>
              <p className="lead-desc">
                If you can reason about these six, you can reason about most
                system design interviews. Start here.
              </p>
            </div>
            <div className="featured-grid">
              {featured.map((e, i) => (
                <Link
                  href={`/${e.slug}`}
                  key={e.slug}
                  className="featured-card"
                  style={{
                    ["--accent-h" as any]: String(e.accent.h),
                    ["--accent-s" as any]: `${e.accent.s}%`,
                    ["--accent-l" as any]: `${e.accent.l}%`,
                  }}
                >
                  <div className="featured-num">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="featured-title">{e.title}</h3>
                  <p className="featured-blurb">{e.blurb}</p>
                  <div className="featured-tags">
                    {e.tags.slice(0, 3).map((t, idx) => (
                      <span className="featured-tag" key={idx}>{t}</span>
                    ))}
                  </div>
                  <div className="featured-cta">
                    Read deep-dive →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ═══════════════════ ALL CONTENT TYPES ═══════════════════ */}
        <section className="types-section">
          <div className="section-lead">
            <div className="lead-eyebrow">Everything here</div>
            <h2 className="lead-title">Five ways to learn</h2>
          </div>

          <div className="types-grid">
            <Link href="/" className="type-card">
              <div className="type-icon">📐</div>
              <div className="type-label">Problems</div>
              <div className="type-count">{index.length}</div>
              <p>
                Full system designs — requirements, scale, API, architecture
                SVG, deep-dive, tradeoffs, failure modes, interview tips.
              </p>
            </Link>
            <Link href="/concepts" className="type-card">
              <div className="type-icon">📚</div>
              <div className="type-label">Concepts</div>
              <div className="type-count">{conceptCount}</div>
              <p>
                Fundamental references — sharding, consensus, caching,
                messaging. With code snippets, diagrams, real numbers.
              </p>
            </Link>
            <Link href="/exercises" className="type-card">
              <div className="type-icon">✏️</div>
              <div className="type-label">Exercises</div>
              <div className="type-count">{exerciseCount}</div>
              <p>
                Practice prompts with progressive hints and a scoring
                rubric. Reveal-gated to force you to try first.
              </p>
            </Link>
            <Link href="/quiz" className="type-card">
              <div className="type-icon">🎯</div>
              <div className="type-label">Quiz</div>
              <div className="type-count">{quizCount}</div>
              <p>
                Multi-choice quizzes across 11 clusters with instant
                feedback + explanations. Personal-best tracked.
              </p>
            </Link>
            <Link href="/postmortems" className="type-card">
              <div className="type-icon">🔥</div>
              <div className="type-label">Post-mortems</div>
              <div className="type-count">{postmortemCount}</div>
              <p>
                Real outages — AWS, Cloudflare, Meta, GitHub, GitLab,
                CrowdStrike, Knight Capital. Root cause + lessons.
              </p>
            </Link>
          </div>
        </section>

        {/* ═══════════════════ PROGRESS ═══════════════════ */}
        <section className="progress-section">
          <div className="section-lead">
            <div className="lead-eyebrow">Your progress</div>
            <h2 className="lead-title">Track what you've read</h2>
            <p className="lead-desc">
              Toggle "mark as read" on any page. State saved locally — no
              account needed.
            </p>
          </div>
          <ProgressStats
            kind="problem"
            total={index.length}
            categories={categories}
          />
          <SRSTracker />
        </section>

        {/* ═══════════════════ BROWSE BY CATEGORY ═══════════════════ */}
        <section className="browse-section">
          <div className="section-lead">
            <div className="lead-eyebrow">All problems</div>
            <h2 className="lead-title">Browse by category</h2>
          </div>

          <BrowseSection index={index} categories={categories} />

          {(() => {
            const other = index.filter((e) => !seen.has(e.slug));
            if (other.length === 0) return null;
            return (
              <section className="category-block">
                <div className="category-header">
                  <h2>Other</h2>
                  <span className="count">{other.length} problems</span>
                </div>
                <div className="problem-grid">
                  {other.map((e) => (
                    <ProblemCard key={e.slug} entry={e} />
                  ))}
                </div>
              </section>
            );
          })()}
        </section>
      </div>

      <Footer />
      <ReadStateHydrator />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__problemSlugs = ${JSON.stringify(index.map((e) => e.slug))};`,
        }}
      />
    </>
  );
}
