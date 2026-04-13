"use client";

import { useEffect, useRef } from "react";
import type { AccentHSL } from "@/types/content";

export default function Mermaid({
  sources,
  accent,
}: {
  sources: string[];
  accent: AccentHSL;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");

        const h = accent.h;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          securityLevel: "loose",
          themeVariables: {
            primaryColor: `hsl(${h}, 80%, 94%)`,
            primaryBorderColor: `hsl(${h}, 60%, 80%)`,
            primaryTextColor: "#111110",
            lineColor: "#ccc9c4",
            secondaryColor: "#f7f7f5",
            tertiaryColor: "#ffffff",
            fontFamily: "Geist, system-ui, sans-serif",
            fontSize: "13px",
          },
          sequence: { useMaxWidth: true },
          flowchart: { useMaxWidth: true, htmlLabels: true },
        });

        if (cancelled || !ref.current) return;

        const wraps = ref.current.querySelectorAll<HTMLElement>(".mermaid");
        for (let i = 0; i < wraps.length; i++) {
          if (cancelled) return;
          const wrap = wraps[i];
          if (wrap.getAttribute("data-mermaid-rendered") === "1") continue;
          const src =
            wrap.getAttribute("data-mermaid-source") ??
            wrap.textContent ??
            "";
          wrap.setAttribute("data-mermaid-source", src);
          const id = `mrm-${Math.random().toString(36).slice(2, 10)}-${i}`;
          try {
            const { svg } = await mermaid.render(id, src);
            if (cancelled) return;
            wrap.innerHTML = svg;
            wrap.setAttribute("data-mermaid-rendered", "1");
          } catch (err) {
            console.warn("Mermaid render error:", err);
            const msg = err instanceof Error ? err.message : String(err);
            wrap.innerHTML = `<pre style="color:#c53030;font-size:12px;white-space:pre-wrap;margin:0 0 8px">Mermaid error: ${msg
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</pre><pre style="font-size:12px;overflow-x:auto;background:#f4f3f0;padding:12px;border-radius:6px;margin:0">${src
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")}</pre>`;
            wrap.setAttribute("data-mermaid-rendered", "1");
          }
        }
      } catch (err) {
        console.error("Mermaid import failed:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sources.join("\n---MERMAID_DELIM---\n"), accent.h]);

  if (sources.length === 0) return null;

  return (
    <div ref={ref}>
      {sources.map((src, i) => (
        <div key={`${i}-${src.length}`} className="mermaid-wrap">
          <div
            className="mermaid"
            suppressHydrationWarning
            dangerouslySetInnerHTML={{
              __html: src
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;"),
            }}
          />
        </div>
      ))}
    </div>
  );
}
