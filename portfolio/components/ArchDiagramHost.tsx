"use client";

import { useEffect, useRef } from "react";

export default function ArchDiagramHost({ svgHtml }: { svgHtml: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    let active: HTMLElement | null = null;

    const onClick = (ev: MouseEvent) => {
      const target = (ev.target as HTMLElement | null)?.closest?.(
        "[data-hl-node]"
      ) as HTMLElement | null;
      if (!target || !root.contains(target)) return;

      if (active && active !== target) {
        active.classList.remove("node-highlight");
      }
      if (active === target) {
        target.classList.remove("node-highlight");
        active = null;
      } else {
        target.classList.add("node-highlight");
        active = target;
      }
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  return (
    <div
      ref={ref}
      className="arch-diagram"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
}
