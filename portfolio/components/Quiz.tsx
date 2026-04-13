"use client";
import { useEffect, useState } from "react";

type Question = {
  q: string;
  choices: string[];
  correct: number;
  explanation: string;
};

type QuizData = {
  slug: string;
  cluster: string;
  blurb: string;
  accent: { h: number; s: number; l: number };
  questions: Question[];
};

export default function Quiz({ data }: { data: QuizData }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);

  const bestKey = `quiz:${data.slug}:best_score`;
  const attemptsKey = `quiz:${data.slug}:attempts`;

  useEffect(() => {
    try {
      const b = localStorage.getItem(bestKey);
      const a = localStorage.getItem(attemptsKey);
      if (b) setBest(Number(b));
      if (a) setAttempts(Number(a));
    } catch {}
  }, [data.slug]);

  const q = data.questions[idx];
  const total = data.questions.length;

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    if (i === q.correct) setScore((s) => s + 1);
  }

  function next() {
    if (idx + 1 < total) {
      setIdx(idx + 1);
      setSelected(null);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      const finalScore = score + (selected === q.correct ? 0 : 0); // already counted
      if (best === null || finalScore > best) {
        setBest(finalScore);
        try { localStorage.setItem(bestKey, String(finalScore)); } catch {}
      }
      try { localStorage.setItem(attemptsKey, String(newAttempts)); } catch {}
      setFinished(true);
    }
  }

  function restart() {
    setIdx(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const verdict =
      pct >= 85 ? "🎓 Interview-ready" :
      pct >= 70 ? "✅ Solid foundation — gaps to review" :
      pct >= 50 ? "📚 Cover this cluster more before interview" :
                  "🧭 Treat this as a learning list";
    return (
      <div className="quiz-result">
        <div className="quiz-score-big">{score}<span>/{total}</span></div>
        <div className="quiz-pct">{pct}%</div>
        <div className="quiz-verdict">{verdict}</div>
        {best !== null && best > 0 && (
          <div className="quiz-meta">Best: {best}/{total} · Attempts: {attempts}</div>
        )}
        <div className="quiz-actions">
          <button type="button" className="quiz-btn" onClick={restart}>
            Retry quiz →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-header">
        <div className="quiz-progress">
          Question {idx + 1} / {total}
          {best !== null && <span className="quiz-best">· best {best}/{total}</span>}
        </div>
        <div className="quiz-bar">
          <div className="quiz-bar-fill" style={{ width: `${((idx + 1) / total) * 100}%` }} />
        </div>
      </div>

      <div className="quiz-question">{q.q}</div>

      <div className="quiz-choices">
        {q.choices.map((choice, i) => {
          const isSel = selected === i;
          const isCorrect = selected !== null && i === q.correct;
          const isWrong = isSel && i !== q.correct;
          return (
            <button
              key={i}
              type="button"
              className={
                "quiz-choice" +
                (isCorrect ? " correct" : "") +
                (isWrong ? " wrong" : "") +
                (selected === null ? " active" : " locked")
              }
              disabled={selected !== null}
              onClick={() => pick(i)}
            >
              <span className="quiz-choice-letter">{String.fromCharCode(65 + i)}</span>
              <span>{choice}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className={"quiz-explanation " + (selected === q.correct ? "correct" : "wrong")}>
          <div className="quiz-verdict-inline">
            {selected === q.correct ? "✓ Correct" : "✗ Incorrect"}
          </div>
          <p>{q.explanation}</p>
          <button type="button" className="quiz-btn" onClick={next}>
            {idx + 1 < total ? "Next question →" : "See final score →"}
          </button>
        </div>
      )}
    </div>
  );
}
