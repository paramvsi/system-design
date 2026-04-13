"use client";

import { useEffect, useState } from "react";

export default function PracticeButton() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    // We inline the slug list via a global injected by the landing page.
    const data = (window as any).__problemSlugs;
    if (Array.isArray(data)) setSlugs(data);
  }, []);

  const go = () => {
    if (slugs.length === 0) return;
    const pick = slugs[Math.floor(Math.random() * slugs.length)];
    window.location.href = `/${pick}?practice=1`;
  };

  return (
    <button
      type="button"
      className="practice-btn"
      onClick={go}
      disabled={slugs.length === 0}
    >
      <span aria-hidden="true">🎯</span>
      Practice: random problem
    </button>
  );
}
