"use client";
import { useEffect, useState } from "react";

const KEY = "depth:preference";
type Depth = "full" | "tldr";

export default function DepthToggle() {
  const [depth, setDepth] = useState<Depth>("full");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY) as Depth | null;
      if (stored === "tldr" || stored === "full") {
        setDepth(stored);
        document.body.classList.toggle("depth-tldr", stored === "tldr");
      }
    } catch {}
    setMounted(true);
  }, []);

  function apply(next: Depth) {
    setDepth(next);
    document.body.classList.toggle("depth-tldr", next === "tldr");
    try {
      localStorage.setItem(KEY, next);
    } catch {}
    window.dispatchEvent(new CustomEvent("depth:change", { detail: next }));
  }

  if (!mounted) return null;

  return (
    <div className="depth-toggle" role="group" aria-label="Content depth">
      <button
        type="button"
        className={depth === "full" ? "is-active" : ""}
        onClick={() => apply("full")}
        aria-pressed={depth === "full"}
      >
        Full
      </button>
      <button
        type="button"
        className={depth === "tldr" ? "is-active" : ""}
        onClick={() => apply("tldr")}
        aria-pressed={depth === "tldr"}
        title="Hide deep-dive + failures + evolution"
      >
        TL;DR
      </button>
    </div>
  );
}
