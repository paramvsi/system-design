import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer" data-pagefind-ignore>
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-logo">
            System <em>Design</em>
          </Link>
          <p className="footer-tag">
            Deep, opinionated reference for the system design interview.
            Free. No signup. Built to re-read.
          </p>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <div className="footer-head">Content</div>
            <ul>
              <li><Link href="/">Problems · 43</Link></li>
              <li><Link href="/concepts">Concepts · 110</Link></li>
              <li><Link href="/exercises">Exercises · 15</Link></li>
              <li><Link href="/quiz">Quiz · 11 clusters</Link></li>
              <li><Link href="/postmortems">Post-mortems · 12</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <div className="footer-head">Paths</div>
            <ul>
              <li><Link href="/exercises">Interview prep</Link></li>
              <li><Link href="/concepts">Learn fundamentals</Link></li>
              <li><Link href="/postmortems">Failure stories</Link></li>
              <li><Link href="/quiz">Test yourself</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <div className="footer-head">Ship</div>
            <ul>
              <li>43 problems · 110 concepts</li>
              <li>12 post-mortems · 15 exercises</li>
              <li>80+ quiz questions</li>
              <li>180 pages indexed</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>System Design Portfolio</span>
        <span>·</span>
        <span>Built with Next.js + Pagefind</span>
        <span>·</span>
        <span>All content CC-BY</span>
      </div>
    </footer>
  );
}
