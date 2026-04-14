"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type ReviewItem = {
  slug: string;
  kind: "problem" | "concept";
  title: string;
  lastRead: number;
  daysSince: number;
  interval: string;
};

const INTERVALS = [1, 3, 7, 14, 30];

function getReviewItems(): ReviewItem[] {
  const items: ReviewItem[] = [];
  const now = Date.now();

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    const match = key.match(/^read:(problem|concept):(.+)$/);
    if (!match) continue;

    const kind = match[1] as "problem" | "concept";
    const slug = match[2];
    const val = localStorage.getItem(key);
    if (val !== "1") continue;

    const tsKey = `read_ts:${kind}:${slug}`;
    let ts = Number(localStorage.getItem(tsKey) || "0");
    if (!ts) {
      ts = now - 7 * 86400000;
      localStorage.setItem(tsKey, String(ts));
    }

    const daysSince = Math.floor((now - ts) / 86400000);

    const needsReview = INTERVALS.some((d) => daysSince >= d && daysSince < d + 2);
    if (!needsReview && daysSince < 1) continue;

    const nextInterval = INTERVALS.find((d) => daysSince < d) || 30;
    const interval = daysSince >= 30 ? "30d+ (refresh)" :
      daysSince >= 14 ? "Review (14d)" :
      daysSince >= 7  ? "Review (7d)" :
      daysSince >= 3  ? "Review (3d)" :
      daysSince >= 1  ? "Review (1d)" : "New";

    if (needsReview) {
      const title = slug.replace(/^\d+-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      items.push({ slug, kind, title, lastRead: ts, daysSince, interval });
    }
  }

  items.sort((a, b) => a.daysSince - b.daysSince);
  return items.slice(0, 8);
}

export default function SRSTracker() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setItems(getReviewItems());

    const onStorage = () => setItems(getReviewItems());
    window.addEventListener("storage", onStorage);
    window.addEventListener("progress:change", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("progress:change", onStorage);
    };
  }, []);

  if (!mounted || items.length === 0) return null;

  return (
    <div className="srs-tracker">
      <div className="srs-header">
        <div className="srs-icon">🔄</div>
        <div>
          <div className="srs-title">Spaced review</div>
          <div className="srs-subtitle">Pages due for revisit based on when you last read them</div>
        </div>
      </div>
      <div className="srs-items">
        {items.map((item) => (
          <Link
            key={`${item.kind}:${item.slug}`}
            href={item.kind === "concept" ? `/concepts/${item.slug}` : `/${item.slug}`}
            className="srs-item"
          >
            <span className="srs-item-title">{item.title}</span>
            <span className="srs-item-badge" data-urgency={
              item.daysSince >= 14 ? "high" : item.daysSince >= 7 ? "med" : "low"
            }>
              {item.interval}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
