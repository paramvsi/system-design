"use client";
import { useEffect, useState } from "react";

type Props = {
  slug: string;
  sectionId: string;
  label: string;
};

export default function RevealGate({ slug, sectionId, label }: Props) {
  const [revealed, setRevealed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const key = `exercise:${slug}:revealed:${sectionId}`;

  useEffect(() => {
    setMounted(true);
    try {
      if (localStorage.getItem(key) === "1") {
        setRevealed(true);
        unhideSection();
      } else {
        hideSection();
      }
    } catch {}
  }, []);

  function hideSection() {
    const el = document.getElementById(sectionId);
    if (el) el.classList.add("gated-hidden");
  }

  function unhideSection() {
    const el = document.getElementById(sectionId);
    if (el) el.classList.remove("gated-hidden");
  }

  function reveal() {
    setRevealed(true);
    unhideSection();
    try {
      localStorage.setItem(key, "1");
    } catch {}
  }

  function hide() {
    setRevealed(false);
    hideSection();
    try {
      localStorage.removeItem(key);
    } catch {}
  }

  if (!mounted) return null;
  if (revealed) {
    return (
      <button type="button" className="reveal-btn reveal-btn-hide" onClick={hide}>
        ← Hide {label} again
      </button>
    );
  }
  return (
    <div className="reveal-gate">
      <p>Try the problem first, then click below to reveal the {label}.</p>
      <button type="button" className="reveal-btn" onClick={reveal}>
        Reveal {label} →
      </button>
    </div>
  );
}
