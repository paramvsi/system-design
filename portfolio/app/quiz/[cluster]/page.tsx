import fs from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import Topbar from "@/components/Topbar";
import Quiz from "@/components/Quiz";

export const dynamicParams = false;

type QuizData = {
  slug: string;
  cluster: string;
  blurb: string;
  accent: { h: number; s: number; l: number };
  questions: Array<{
    q: string;
    choices: string[];
    correct: number;
    explanation: string;
  }>;
};

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content", "quiz");
  try {
    const entries = await fs.readdir(dir);
    return entries
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .map((f) => ({ cluster: f.replace(/\.json$/, "") }));
  } catch {
    return [];
  }
}

async function loadQuiz(slug: string): Promise<QuizData | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "content", "quiz", `${slug}.json`),
      "utf8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ cluster: string }>;
}) {
  const { cluster } = await params;
  const q = await loadQuiz(cluster);
  if (!q) return {};
  return {
    title: `${q.cluster} Quiz`,
    description: q.blurb,
    alternates: { canonical: `/quiz/${cluster}` },
  };
}

export default async function QuizClusterPage({
  params,
}: {
  params: Promise<{ cluster: string }>;
}) {
  const { cluster } = await params;
  const data = await loadQuiz(cluster);
  if (!data) notFound();

  const accentStyle = {
    ["--accent-h" as any]: String(data.accent.h),
    ["--accent-s" as any]: `${data.accent.s}%`,
    ["--accent-l" as any]: `${data.accent.l}%`,
  } as React.CSSProperties;

  return (
    <div style={accentStyle}>
      <Topbar />
      <main id="main" className="quiz-layout">
        <div className="quiz-nav">
          <Link href="/quiz">← All quizzes</Link>
        </div>
        <header className="quiz-title-block">
          <div className="eyebrow">Quiz · {data.questions.length} questions</div>
          <h1>{data.cluster}</h1>
          <p>{data.blurb}</p>
        </header>
        <Quiz data={data} />
      </main>
    </div>
  );
}
