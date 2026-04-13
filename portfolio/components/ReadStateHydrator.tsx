"use client";

import { useEffect } from "react";
import { listReadSlugs, type ReadKind } from "@/lib/progress";

/**
 * After hydration, walks cards with `data-card-kind` + `data-card-slug` attrs
 * and toggles an `is-read` class. Keeps cards server-rendered while still
 * showing read-state without per-card JS.
 */
export default function ReadStateHydrator() {
  useEffect(() => {
    const apply = () => {
      const problems = listReadSlugs("problem");
      const concepts = listReadSlugs("concept");
      document.querySelectorAll<HTMLElement>("[data-card-kind]").forEach((el) => {
        const kind = el.dataset.cardKind as ReadKind;
        const slug = el.dataset.cardSlug;
        if (!slug) return;
        const set = kind === "concept" ? concepts : problems;
        el.classList.toggle("is-read", set.has(slug));
      });
    };
    apply();
    const listener = () => apply();
    window.addEventListener("progress:change", listener);
    window.addEventListener("storage", listener);
    return () => {
      window.removeEventListener("progress:change", listener);
      window.removeEventListener("storage", listener);
    };
  }, []);
  return null;
}
