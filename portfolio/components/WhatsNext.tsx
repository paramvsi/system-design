import Link from "next/link";

export interface NextLink {
  slug: string;
  title: string;
  blurb?: string;
  reason?: string;
  kind: "concept" | "problem";
}

export default function WhatsNext({ items }: { items: NextLink[] }) {
  if (items.length === 0) return null;
  return (
    <section className="whats-next" data-pagefind-ignore>
      <div className="whats-next-label">Next up</div>
      <div className="whats-next-grid">
        {items.slice(0, 3).map((n) => {
          const href = n.kind === "concept" ? `/concepts/${n.slug}` : `/${n.slug}`;
          return (
            <Link href={href} key={n.slug} className="whats-next-card">
              <div className="whats-next-kind">
                {n.kind === "concept" ? "CONCEPT" : "PROBLEM"}
              </div>
              <h4>{n.title}</h4>
              {n.reason && <p className="wn-reason">{n.reason}</p>}
              {!n.reason && n.blurb && <p className="wn-blurb">{n.blurb}</p>}
              <span className="whats-next-arrow">Read →</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
