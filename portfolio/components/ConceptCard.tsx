import Link from "next/link";
import type { IndexEntry } from "@/types/content";

export default function ConceptCard({ entry }: { entry: IndexEntry }) {
  const accentStyle = {
    ["--accent-h" as any]: String(entry.accent.h),
    ["--accent-s" as any]: `${entry.accent.s}%`,
    ["--accent-l" as any]: `${entry.accent.l}%`,
  } as React.CSSProperties;

  return (
    <Link
      href={`/concepts/${entry.slug}`}
      className="problem-card"
      style={accentStyle}
      data-pagefind-ignore
      data-card-kind="concept"
      data-card-slug={entry.slug}
    >
      <span className="accent-stripe" />
      <div className="pc-meta">
        <span className="pc-difficulty">CONCEPT</span>
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
