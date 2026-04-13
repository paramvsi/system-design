"use client";

import { useEffect, useRef } from "react";
import FlowStepper from "./FlowStepper";
import type { AccentHSL, ProblemSection } from "@/types/content";

let mermaidModulePromise: Promise<typeof import("mermaid").default> | null = null;

async function getMermaid(accentH: number) {
  if (!mermaidModulePromise) {
    mermaidModulePromise = import("mermaid").then((m) => m.default);
  }
  const mermaid = await mermaidModulePromise;
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    securityLevel: "loose",
    themeVariables: {
      primaryColor: `hsl(${accentH}, 80%, 94%)`,
      primaryBorderColor: `hsl(${accentH}, 60%, 80%)`,
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
  return mermaid;
}

export default function ProblemSectionBody({
  section,
  flow,
  accent,
}: {
  section: ProblemSection;
  flow: { nodes: string[]; descs: string[] } | null;
  accent: AccentHSL;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);

  // Click delegation for architecture SVG node highlighting
  // (extractor rewrote `onclick="hlNode('x')"` → `data-hl-node="x"`).
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    let active: HTMLElement | null = null;
    let tooltipEl: HTMLDivElement | null = null;

    const dismissTooltip = () => {
      if (tooltipEl) {
        tooltipEl.remove();
        tooltipEl = null;
      }
    };

    const showTooltip = (host: HTMLElement) => {
      dismissTooltip();
      const text = host.getAttribute("data-tooltip") || "";
      const conceptLink = host.getAttribute("data-concept-link") || "";
      if (!text) return;
      const tip = document.createElement("div");
      tip.className = "svg-tooltip";
      const body = document.createElement("div");
      body.className = "svg-tooltip-body";
      body.textContent = text;
      tip.appendChild(body);
      if (conceptLink) {
        const link = document.createElement("a");
        link.href = conceptLink;
        link.className = "svg-tooltip-link";
        link.textContent = "Related concept →";
        tip.appendChild(link);
      }
      const rect = host.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      tip.style.position = "absolute";
      tip.style.left = `${rect.left - rootRect.left + rect.width / 2}px`;
      tip.style.top = `${rect.bottom - rootRect.top + 8}px`;
      tip.style.transform = "translateX(-50%)";
      root.appendChild(tip);
      tooltipEl = tip;
    };

    const onClick = (ev: MouseEvent) => {
      const target = (ev.target as HTMLElement | null)?.closest?.(
        "[data-hl-node],[data-tooltip]"
      ) as HTMLElement | null;

      if (!target || !root.contains(target)) {
        dismissTooltip();
        return;
      }

      // Tooltip overrides simple highlight when data-tooltip is present
      if (target.hasAttribute("data-tooltip")) {
        if (active === target) {
          target.classList.remove("node-highlight");
          active = null;
          dismissTooltip();
        } else {
          if (active) active.classList.remove("node-highlight");
          target.classList.add("node-highlight");
          active = target;
          showTooltip(target);
        }
        ev.stopPropagation();
        return;
      }

      // Legacy highlight-only
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
      dismissTooltip();
    };

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        if (active) active.classList.remove("node-highlight");
        active = null;
        dismissTooltip();
      }
    };

    root.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      root.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      dismissTooltip();
    };
  }, [section.id]);

  // Render any <div class="mermaid"> blocks inside this section body in-place.
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;

    let cancelled = false;

    (async () => {
      const wraps = root.querySelectorAll<HTMLElement>(".mermaid");
      if (wraps.length === 0) return;

      let mermaid: Awaited<ReturnType<typeof getMermaid>>;
      try {
        mermaid = await getMermaid(accent.h);
      } catch (err) {
        console.error("Mermaid import failed:", err);
        return;
      }

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
    })();

    return () => {
      cancelled = true;
    };
  }, [section.id, accent.h, section.html]);

  return (
    <section className="section" id={section.id} data-pagefind-body>
      <button
        type="button"
        className="practice-reveal"
        data-practice-reveal
        aria-label={`Reveal ${section.label}`}
      >
        Reveal <span>{section.label}</span>
      </button>
      <div className="section-contents">
        <div
          ref={bodyRef}
          className="section-body"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: section.html }}
        />
        {flow && flow.nodes.length > 0 && (
          <FlowStepper nodes={flow.nodes} descs={flow.descs} />
        )}
      </div>
    </section>
  );
}
