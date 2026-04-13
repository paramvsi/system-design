"use client";

import { useEffect, useState } from "react";

/**
 * Practice mode collapses every problem section except Requirements + Scale.
 * User drafts their own design mentally (or in a scratchpad), then clicks
 * "Reveal" to compare against the authored answer. Toggleable at the top.
 */
export default function PracticeMode() {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Which section ids we DO show even when practice mode is on.
  const ALWAYS_VISIBLE = new Set(["problem", "requirements", "scale"]);

  useEffect(() => {
    setMounted(true);
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get("practice") === "1") setActive(true);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const mainSections = document.querySelectorAll<HTMLElement>("main.main .section[id]");
    mainSections.forEach((sec) => {
      if (ALWAYS_VISIBLE.has(sec.id)) {
        sec.classList.remove("practice-collapsed");
        return;
      }
      sec.classList.toggle("practice-collapsed", active);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, mounted]);

  useEffect(() => {
    if (!mounted) return;
    // Wire per-section reveal buttons (delegated click).
    const root = document.querySelector<HTMLElement>("main.main");
    if (!root) return;

    const handler = (ev: Event) => {
      const target = (ev.target as HTMLElement | null)?.closest?.(
        "[data-practice-reveal]"
      ) as HTMLElement | null;
      if (!target) return;
      const sec = target.closest(".section[id]") as HTMLElement | null;
      if (sec) sec.classList.remove("practice-collapsed");
    };
    root.addEventListener("click", handler);
    return () => root.removeEventListener("click", handler);
  }, [mounted]);

  if (!mounted) return <div aria-hidden="true" />;

  return (
    <div className={`practice-bar ${active ? "is-on" : ""}`}>
      <div className="practice-bar-text">
        <strong>Practice mode</strong>
        {active
          ? " — deep sections hidden. Design it yourself, then reveal."
          : " — hide the answers, design it yourself first."}
      </div>
      <button
        type="button"
        className="practice-toggle"
        onClick={() => setActive((a) => !a)}
        aria-pressed={active}
      >
        {active ? "Exit practice" : "Enable practice"}
      </button>
    </div>
  );
}
