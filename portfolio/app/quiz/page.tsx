import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";

type QuizSummary = {
  slug: string;
  cluster: string;
  blurb: string;
  accent: { h: number; s: number; l: number };
  count: number;
};

async function loadIndex(): Promise<QuizSummary[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "quiz", "_index.json"),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export const metadata = {
  title: "Quiz",
  description:
    "Test your system design knowledge across 11 topic clusters. Immediate feedback, self-scored, tracks personal best.",
  alternates: { canonical: "/quiz" },
  openGraph: {
    title: "Quiz — System Design Portfolio",
    description: "Self-test across 11 topic clusters. ~80 questions with explanations.",
    url: "/quiz",
    images: ["/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "Quiz — System Design Portfolio",
    description: "Self-test across 11 topic clusters. ~80 questions with explanations.",
    images: ["/og-default.svg"],
  },
};

export default async function QuizLandingPage() {
  const quizzes = await loadIndex();
  const totalQuestions = quizzes.reduce((n, q) => n + q.count, 0);

  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        <header className="landing-hero">
          <div className="eyebrow">Quiz</div>
          <h1>Test yourself.</h1>
          <p>
            Multiple-choice quizzes across {quizzes.length} topic clusters with
            instant feedback + explanations. ~80 questions total. Each cluster
            covers the concepts that come up in real system design interviews.
            Personal-best score tracked per cluster.
          </p>
          <div className="stats">
            <span><b>{quizzes.length}</b> clusters</span>
            <span><b>{totalQuestions}</b> questions</span>
            <span>press <b>⌘K</b> to search</span>
          </div>
        </header>

        <section className="category-block">
          <div className="category-header">
            <h2>Topics</h2>
            <span className="count">{quizzes.length} quizzes shipped</span>
          </div>
          <div className="problem-grid">
            {quizzes.map((q) => (
              <Link
                key={q.slug}
                href={`/quiz/${q.slug}`}
                className="problem-card"
                style={{
                  ["--accent-h" as any]: String(q.accent.h),
                  ["--accent-s" as any]: `${q.accent.s}%`,
                  ["--accent-l" as any]: `${q.accent.l}%`,
                }}
                data-card-kind="quiz"
                data-card-slug={q.slug}
              >
                <div className="pc-head">
                  <span className="pc-eyebrow">Quiz</span>
                  <span className="pc-mins">{q.count} questions</span>
                </div>
                <h3 className="pc-title">{q.cluster}</h3>
                <p className="pc-blurb">{q.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
