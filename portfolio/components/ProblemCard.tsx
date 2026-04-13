import Link from "next/link";
import type { IndexEntry } from "@/types/content";

export default function ProblemCard({ entry }: { entry: IndexEntry }) {
  const accentStyle = {
    ["--accent-h" as any]: String(entry.accent.h),
    ["--accent-s" as any]: `${entry.accent.s}%`,
    ["--accent-l" as any]: `${entry.accent.l}%`,
  } as React.CSSProperties;

  return (
    <Link
      href={`/${entry.slug}`}
      className="problem-card"
      style={accentStyle}
      data-pagefind-ignore
      data-card-kind="problem"
      data-card-slug={entry.slug}
    >
      <span className="accent-stripe" />
      <div className="pc-meta">
        {entry.problemNumber && (
          <span className="pc-number">#{entry.problemNumber}</span>
        )}
        {entry.difficulty && (
          <span className="pc-difficulty">{entry.difficulty}</span>
        )}
        {entry.readMinutes > 0 && (
          <span className="pc-read">~{entry.readMinutes} min</span>
        )}
      </div>
      <h3>{entry.title}</h3>
      {entry.blurb && <p>{entry.blurb}</p>}
      {entry.tags.length > 0 && (
        <div className="pc-tags">
          {entry.tags.slice(0, 4).map((t, i) => (
            <span className="pc-tag" key={i}>
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
