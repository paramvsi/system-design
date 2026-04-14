"use client";
import FilterBar from "./FilterBar";
import ProblemCard from "./ProblemCard";
import type { IndexEntry } from "@/types/content";

export default function BrowseSection({
  index,
  categories,
}: {
  index: IndexEntry[];
  categories: Record<string, string[]>;
}) {
  const bySlug = new Map(index.map((e) => [e.slug, e]));

  return (
    <FilterBar
      entries={index.map((e) => ({
        slug: e.slug,
        title: e.title,
        difficulty: e.difficulty,
        readMinutes: e.readMinutes,
        category: e.category,
      }))}
    >
      {(filtered) => {
        const filteredSlugs = new Set(filtered.map((f) => f.slug));
        return (
          <>
            {Object.entries(categories).map(([cat, slugs]) => {
              const entries = slugs
                .map((s) => bySlug.get(s))
                .filter((e): e is IndexEntry => !!e)
                .filter((e) => filteredSlugs.has(e.slug));
              if (entries.length === 0) return null;
              return (
                <section className="category-block" key={cat}>
                  <div className="category-header">
                    <h2>{cat}</h2>
                    <span className="count">{entries.length} problems</span>
                  </div>
                  <div className="problem-grid">
                    {entries.map((e) => (
                      <ProblemCard key={e.slug} entry={e} />
                    ))}
                  </div>
                </section>
              );
            })}
          </>
        );
      }}
    </FilterBar>
  );
}
