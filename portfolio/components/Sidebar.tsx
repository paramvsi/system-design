"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RelatedLink } from "@/types/content";

type Section = { id: string; label: string; number?: string };

export default function Sidebar({
  sections,
  related,
  conceptsUsed,
  usedIn,
  relatedConcepts,
}: {
  sections: Section[];
  related: RelatedLink[];
  conceptsUsed?: { slug: string; label: string }[];
  usedIn?: { slug: string; label: string }[];
  relatedConcepts?: { slug: string; label: string }[];
}) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const ids = sections.map((s) => s.id);
    const observed: HTMLElement[] = [];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observed.push(el);
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActive((visible[0].target as HTMLElement).id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0, 0.1, 0.5, 1],
      }
    );

    observed.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [sections]);

  // Expose toggle globally so Topbar can open the drawer without prop drilling.
  useEffect(() => {
    const handler = () => setOpen((o) => !o);
    const closeHandler = () => setOpen(false);
    window.addEventListener("sidebar:toggle", handler);
    window.addEventListener("sidebar:close", closeHandler);
    return () => {
      window.removeEventListener("sidebar:toggle", handler);
      window.removeEventListener("sidebar:close", closeHandler);
    };
  }, []);

  const closeOnClick = () => {
    if (window.innerWidth < 900) setOpen(false);
  };

  return (
    <>
      <div
        className={`sidebar-scrim ${open ? "open" : ""}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`sidebar ${open ? "open" : ""}`} data-pagefind-ignore>
        <div className="sidebar-label">On this page</div>
        <ul className="sidebar-nav">
          {sections.map((s, i) => {
            const num = s.number ?? String(i + 1).padStart(2, "0");
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={active === s.id ? "active" : ""}
                  onClick={closeOnClick}
                >
                  <span className="sidebar-n">{num}</span>
                  {s.label}
                </a>
              </li>
            );
          })}
        </ul>

        {conceptsUsed && conceptsUsed.length > 0 && (
          <>
            <div className="sidebar-label">Concepts Used</div>
            <ul className="sidebar-related">
              {conceptsUsed.map((c) => (
                <li key={c.slug}>
                  <Link href={`/concepts/${c.slug}`} onClick={closeOnClick}>
                    <span className="sidebar-n">→</span>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {usedIn && usedIn.length > 0 && (
          <>
            <div className="sidebar-label">Used In Problems</div>
            <ul className="sidebar-related">
              {usedIn.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${r.slug}`} onClick={closeOnClick}>
                    <span className="sidebar-n">→</span>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {relatedConcepts && relatedConcepts.length > 0 && (
          <>
            <div className="sidebar-label">Related Concepts</div>
            <ul className="sidebar-related">
              {relatedConcepts.map((r) => (
                <li key={r.slug}>
                  <Link href={`/concepts/${r.slug}`} onClick={closeOnClick}>
                    <span className="sidebar-n">→</span>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {related.length > 0 && (
          <>
            <div className="sidebar-label">Related</div>
            <ul className="sidebar-related">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/${r.slug}`} onClick={closeOnClick}>
                    <span className="sidebar-n">→</span>
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </aside>
    </>
  );
}
