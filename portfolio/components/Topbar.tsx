import Link from "next/link";
import SearchUI from "./SearchUI";
import SidebarToggle from "./SidebarToggle";
import DepthToggle from "./DepthToggle";

export default function Topbar({
  title,
  difficulty,
  kind = "problem",
}: {
  title?: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | null;
  kind?: "problem" | "concept" | "postmortem" | "exercise";
}) {
  if (title) {
    const backHref =
      kind === "concept"    ? "/concepts" :
      kind === "postmortem" ? "/postmortems" :
      kind === "exercise"   ? "/exercises" : "/";
    const backLabel =
      kind === "concept"    ? "All Concepts" :
      kind === "postmortem" ? "All Post-mortems" :
      kind === "exercise"   ? "All Exercises" : "All Problems";
    const tagLabel =
      kind === "concept"    ? "Concept" :
      kind === "postmortem" ? "Post-mortem" :
      kind === "exercise"   ? "Exercise" : "System Design";
    return (
      <nav className="topbar" data-pagefind-ignore>
        <div className="topbar-left">
          <SidebarToggle />
          <Link href={backHref}>← {backLabel}</Link>
          <span className="topbar-sep">/</span>
          <span className="topbar-problem">{title}</span>
        </div>
        <div className="topbar-right">
          <DepthToggle />
          <SearchUI />
          <span className="topbar-tag">{tagLabel}</span>
          {difficulty && (
            <span className="topbar-tag" style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
              {difficulty}
            </span>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="landing-topbar" data-pagefind-ignore>
      <Link href="/" className="brand">
        System <em>Design</em>
      </Link>
      <div className="landing-nav">
        <Link href="/" className="landing-nav-link">Problems</Link>
        <Link href="/concepts" className="landing-nav-link">Concepts</Link>
        <Link href="/exercises" className="landing-nav-link">Exercises</Link>
        <Link href="/quiz" className="landing-nav-link">Quiz</Link>
        <Link href="/postmortems" className="landing-nav-link">Post-mortems</Link>
      </div>
      <div className="topbar-right">
        <SearchUI />
      </div>
    </nav>
  );
}
