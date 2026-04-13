"use client";

import { useEffect, useState } from "react";
import { listReadSlugs, type ReadKind } from "@/lib/progress";

export default function ProgressStats({
  kind,
  total,
  categories,
}: {
  kind: ReadKind;
  total: number;
  categories: Record<string, string[]>;
}) {
  const [readSet, setReadSet] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const refresh = () => setReadSet(listReadSlugs(kind));
    refresh();
    setMounted(true);
    const listener = (e: Event) => {
      const ev = e as CustomEvent<{ kind: ReadKind }>;
      if (!ev.detail || ev.detail.kind === kind) refresh();
    };
    window.addEventListener("progress:change", listener);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("progress:change", listener);
      window.removeEventListener("storage", refresh);
    };
  }, [kind]);

  if (!mounted) {
    return <div className="progress-stats progress-stats-placeholder" aria-hidden="true" />;
  }

  const totalRead = [...readSet].filter((s) =>
    Object.values(categories).some((slugs) => slugs.includes(s))
  ).length;

  const perCategory = Object.entries(categories).map(([cat, slugs]) => {
    const done = slugs.filter((s) => readSet.has(s)).length;
    return { cat, done, total: slugs.length };
  });

  const reset = () => {
    if (!confirm("Clear your progress for all " + kind + "s?")) return;
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(`read:${kind}:`)) keys.push(k);
      }
      keys.forEach((k) => localStorage.removeItem(k));
      window.dispatchEvent(new CustomEvent("progress:change", { detail: { kind } }));
    } catch {}
  };

  return (
    <div className="progress-stats">
      <div className="progress-stats-row">
        <div className="progress-stats-count">
          <b>{totalRead}</b> / {total} {kind}s read
        </div>
        {totalRead > 0 && (
          <button type="button" className="progress-reset" onClick={reset}>
            Reset progress
          </button>
        )}
      </div>
      <div className="progress-bars">
        {perCategory.map((p) => (
          <div className="progress-bar-row" key={p.cat}>
            <div className="progress-bar-label">
              {p.cat}
              <span className="progress-bar-count">
                {p.done}/{p.total}
              </span>
            </div>
            <div className="progress-bar-track">
              <div
                className="progress-bar-fill"
                style={{ width: `${p.total === 0 ? 0 : (p.done / p.total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
