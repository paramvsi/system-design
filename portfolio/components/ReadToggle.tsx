"use client";

import { useEffect, useState } from "react";
import { isRead, setRead, type ReadKind } from "@/lib/progress";

export default function ReadToggle({
  kind,
  slug,
}: {
  kind: ReadKind;
  slug: string;
}) {
  const [read, setReadState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setReadState(isRead(kind, slug));
    setMounted(true);
  }, [kind, slug]);

  if (!mounted) {
    // Render a stable placeholder so SSR+hydration don't mismatch.
    return <div className="read-toggle" aria-hidden="true" />;
  }

  const toggle = () => {
    const next = !read;
    setReadState(next);
    setRead(kind, slug, next);
  };

  return (
    <button
      type="button"
      className={`read-toggle ${read ? "is-read" : ""}`}
      onClick={toggle}
      aria-pressed={read}
      title={read ? "Marked as read — click to unmark" : "Mark as read"}
    >
      <span className="read-toggle-check" aria-hidden="true">
        {read ? "✓" : ""}
      </span>
      {read ? "Read" : "Mark as read"}
    </button>
  );
}
