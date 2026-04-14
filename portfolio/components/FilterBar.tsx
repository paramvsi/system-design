"use client";
import { useState } from "react";

type Difficulty = "ALL" | "EASY" | "MEDIUM" | "HARD";
type SortBy = "category" | "difficulty" | "readtime" | "alpha";

type Entry = {
  slug: string;
  title: string;
  difficulty: string | null;
  readMinutes: number;
  category: string;
};

export default function FilterBar({
  entries,
  children,
}: {
  entries: Entry[];
  children: (filtered: Entry[]) => React.ReactNode;
}) {
  const [diff, setDiff] = useState<Difficulty>("ALL");
  const [sort, setSort] = useState<SortBy>("category");

  let filtered = entries;
  if (diff !== "ALL") {
    filtered = filtered.filter((e) => e.difficulty === diff);
  }

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "alpha") return a.title.localeCompare(b.title);
    if (sort === "readtime") return a.readMinutes - b.readMinutes;
    if (sort === "difficulty") {
      const order: Record<string, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
      return (order[a.difficulty || "MEDIUM"] ?? 1) - (order[b.difficulty || "MEDIUM"] ?? 1);
    }
    return a.category.localeCompare(b.category);
  });

  const diffs: Difficulty[] = ["ALL", "EASY", "MEDIUM", "HARD"];

  return (
    <>
      <div className="filter-bar">
        <div className="filter-pills" role="group" aria-label="Filter by difficulty">
          {diffs.map((d) => (
            <button
              key={d}
              type="button"
              className={`filter-pill ${diff === d ? "active" : ""}`}
              onClick={() => setDiff(d)}
              aria-pressed={diff === d}
            >
              {d === "ALL" ? "All" : d.charAt(0) + d.slice(1).toLowerCase()}
              {d !== "ALL" && (
                <span className="filter-count">
                  {entries.filter((e) => e.difficulty === d).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="filter-sort">
          <label htmlFor="sort-select">Sort:</label>
          <select
            id="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortBy)}
          >
            <option value="category">Category</option>
            <option value="difficulty">Difficulty</option>
            <option value="readtime">Read time</option>
            <option value="alpha">A → Z</option>
          </select>
        </div>
        <div className="filter-result-count">
          {sorted.length} of {entries.length} problems
        </div>
      </div>
      {children(sorted)}
    </>
  );
}
