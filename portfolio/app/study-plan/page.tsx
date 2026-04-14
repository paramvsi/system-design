import Link from "next/link";
import Topbar from "@/components/Topbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "30-Day Study Plan",
  description:
    "A structured 30-day system design interview preparation plan — concepts, problems, exercises, post-mortems, and quizzes with daily targets.",
  alternates: { canonical: "/study-plan" },
  openGraph: {
    title: "30-Day Study Plan — System Design Portfolio",
    description: "Structured 30-day prep plan for system design interviews.",
    url: "/study-plan",
    images: ["/og-default.svg"],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: "30-Day Study Plan — System Design Portfolio",
    description: "Structured 30-day prep plan for system design interviews.",
    images: ["/og-default.svg"],
  },
};

/* ── Phase definitions with real slugs ─────────────────────────────────── */

interface DayPlan {
  day: number;
  label: string;
  links: { href: string; text: string }[];
}

const phase1: DayPlan[] = [
  {
    day: 1, label: "Foundations I",
    links: [
      { href: "/concepts/interview-framework", text: "Interview Framework" },
      { href: "/concepts/back-of-envelope-estimation", text: "Back-of-Envelope Estimation" },
      { href: "/concepts/latency-numbers", text: "Latency Numbers" },
      { href: "/concepts/availability-nines", text: "Availability Nines" },
      { href: "/concepts/slos-slis-slas", text: "SLOs, SLIs, SLAs" },
      { href: "/concepts/horizontal-vs-vertical-scaling", text: "Horizontal vs Vertical Scaling" },
      { href: "/concepts/load-balancer", text: "Load Balancer" },
      { href: "/concepts/stateless-services", text: "Stateless Services" },
      { href: "/concepts/dns", text: "DNS" },
      { href: "/concepts/cdn", text: "CDN" },
    ],
  },
  {
    day: 2, label: "Foundations II — Networking",
    links: [
      { href: "/concepts/tcp-vs-udp", text: "TCP vs UDP" },
      { href: "/concepts/http-1-vs-2-vs-3", text: "HTTP/1 vs 2 vs 3" },
      { href: "/concepts/tls-https", text: "TLS / HTTPS" },
      { href: "/concepts/proxy-vs-reverse-proxy", text: "Proxy vs Reverse Proxy" },
      { href: "/concepts/websockets-sse-polling", text: "WebSockets, SSE, Polling" },
      { href: "/concepts/api-protocols-rest-graphql-grpc", text: "API Protocols" },
      { href: "/concepts/api-gateway", text: "API Gateway" },
      { href: "/concepts/api-versioning", text: "API Versioning" },
      { href: "/concepts/webhooks", text: "Webhooks" },
      { href: "/concepts/service-mesh", text: "Service Mesh" },
    ],
  },
  {
    day: 3, label: "Foundations III — Databases",
    links: [
      { href: "/concepts/sql-vs-nosql", text: "SQL vs NoSQL" },
      { href: "/concepts/acid-vs-base", text: "ACID vs BASE" },
      { href: "/concepts/cap-theorem", text: "CAP Theorem" },
      { href: "/concepts/pacelc-theorem", text: "PACELC" },
      { href: "/concepts/replication", text: "Replication" },
      { href: "/concepts/sharding", text: "Sharding" },
      { href: "/concepts/indexing", text: "Indexing" },
      { href: "/concepts/normalization-vs-denormalization", text: "Normalization vs Denormalization" },
      { href: "/concepts/database-types", text: "Database Types" },
      { href: "/concepts/transactions-distributed", text: "Distributed Transactions" },
    ],
  },
  {
    day: 4, label: "Foundations IV — Caching & Messaging",
    links: [
      { href: "/concepts/cache-strategies", text: "Cache Strategies" },
      { href: "/concepts/cache-eviction", text: "Cache Eviction" },
      { href: "/concepts/cache-stampede", text: "Cache Stampede" },
      { href: "/concepts/cdn-vs-application-cache", text: "CDN vs App Cache" },
      { href: "/concepts/message-queue-vs-pubsub", text: "Message Queue vs Pub/Sub" },
      { href: "/concepts/delivery-guarantees", text: "Delivery Guarantees" },
      { href: "/concepts/event-sourcing-cqrs", text: "Event Sourcing / CQRS" },
      { href: "/concepts/kafka-internals", text: "Kafka Internals" },
      { href: "/concepts/batch-vs-stream-processing", text: "Batch vs Stream Processing" },
      { href: "/concepts/consistent-hashing", text: "Consistent Hashing" },
    ],
  },
  {
    day: 5, label: "Foundations V — Distributed Systems & Reliability",
    links: [
      { href: "/concepts/consensus-paxos-raft", text: "Consensus (Paxos/Raft)" },
      { href: "/concepts/leader-election", text: "Leader Election" },
      { href: "/concepts/circuit-breaker", text: "Circuit Breaker" },
      { href: "/concepts/retry-backoff-jitter", text: "Retry + Backoff + Jitter" },
      { href: "/concepts/rate-limiting-algorithms", text: "Rate Limiting Algorithms" },
      { href: "/concepts/idempotency", text: "Idempotency" },
      { href: "/concepts/bloom-filter", text: "Bloom Filter" },
      { href: "/concepts/observability-triad", text: "Observability Triad" },
      { href: "/concepts/microservices-vs-monolith", text: "Microservices vs Monolith" },
      { href: "/concepts/auth-oauth-jwt", text: "Auth / OAuth / JWT" },
    ],
  },
];

const phase2: DayPlan[] = [
  { day: 6, label: "Easy Problems I",
    links: [
      { href: "/001-url-shortener", text: "URL Shortener" },
      { href: "/007-rate-limiter", text: "Rate Limiter" },
      { href: "/unique-id-generator", text: "Unique ID Generator" },
    ],
  },
  { day: 7, label: "Easy Problems II",
    links: [
      { href: "/key-value-store", text: "Key-Value Store" },
      { href: "/notification-system", text: "Notification System" },
      { href: "/leaderboard", text: "Leaderboard" },
    ],
  },
  { day: 8, label: "Medium Problems I",
    links: [
      { href: "/002-news-feed", text: "News Feed" },
      { href: "/004-whatsapp-system-design", text: "WhatsApp" },
      { href: "/006-typeahead-suggestions", text: "Typeahead Suggestions" },
    ],
  },
  { day: 9, label: "Medium Problems II",
    links: [
      { href: "/005-youtube-netflix", text: "YouTube / Netflix" },
      { href: "/008-web-crawler", text: "Web Crawler" },
      { href: "/009-yelp-google-places", text: "Yelp / Google Places" },
    ],
  },
  { day: 10, label: "Medium Problems III",
    links: [
      { href: "/003-google-drive", text: "Google Drive" },
      { href: "/distributed-logging", text: "Distributed Logging" },
      { href: "/distributed-cache", text: "Distributed Cache" },
    ],
  },
  { day: 11, label: "Medium-Hard I",
    links: [
      { href: "/uber-system-design", text: "Uber" },
      { href: "/ticketmaster-system-design", text: "Ticketmaster" },
      { href: "/ecommerce-system-design", text: "E-Commerce" },
    ],
  },
  { day: 12, label: "Medium-Hard II",
    links: [
      { href: "/google-docs", text: "Google Docs" },
      { href: "/slack-discord", text: "Slack / Discord" },
      { href: "/video-conferencing", text: "Video Conferencing" },
    ],
  },
  { day: 13, label: "Hard I",
    links: [
      { href: "/stock-trading-platform", text: "Stock Trading Platform" },
      { href: "/payment-gateway", text: "Payment Gateway" },
      { href: "/distributed-job-scheduler", text: "Distributed Job Scheduler" },
    ],
  },
  { day: 14, label: "Hard II",
    links: [
      { href: "/search-engine", text: "Search Engine" },
      { href: "/google-maps", text: "Google Maps" },
      { href: "/design-chatgpt", text: "Design ChatGPT" },
    ],
  },
  { day: 15, label: "Hard III",
    links: [
      { href: "/pubg-system-design", text: "PUBG" },
      { href: "/live-streaming", text: "Live Streaming" },
      { href: "/ad-click-aggregator", text: "Ad Click Aggregator" },
    ],
  },
];

const phase3: DayPlan[] = [
  { day: 16, label: "Hard Problems + Exercises I",
    links: [
      { href: "/crypto-exchange", text: "Crypto Exchange" },
      { href: "/fraud-detection", text: "Fraud Detection" },
      { href: "/exercises/exercise-url-shortener", text: "Exercise: URL Shortener" },
      { href: "/exercises/exercise-rate-limiter", text: "Exercise: Rate Limiter" },
    ],
  },
  { day: 17, label: "Hard Problems + Exercises II",
    links: [
      { href: "/s3-object-storage", text: "S3 Object Storage" },
      { href: "/distributed-locking", text: "Distributed Locking" },
      { href: "/exercises/exercise-news-feed", text: "Exercise: News Feed" },
      { href: "/exercises/exercise-whatsapp", text: "Exercise: WhatsApp" },
    ],
  },
  { day: 18, label: "Exercises Sprint I",
    links: [
      { href: "/exercises/exercise-uber", text: "Exercise: Uber" },
      { href: "/exercises/exercise-ticketmaster", text: "Exercise: Ticketmaster" },
      { href: "/exercises/exercise-youtube-netflix", text: "Exercise: YouTube/Netflix" },
      { href: "/exercises/exercise-google-drive", text: "Exercise: Google Drive" },
    ],
  },
  { day: 19, label: "Exercises Sprint II",
    links: [
      { href: "/exercises/exercise-payment-gateway", text: "Exercise: Payment Gateway" },
      { href: "/exercises/exercise-distributed-cache", text: "Exercise: Distributed Cache" },
      { href: "/exercises/exercise-google-docs", text: "Exercise: Google Docs" },
      { href: "/exercises/exercise-notification-system", text: "Exercise: Notification System" },
    ],
  },
  { day: 20, label: "Exercises Sprint III",
    links: [
      { href: "/exercises/exercise-stock-exchange", text: "Exercise: Stock Exchange" },
      { href: "/exercises/exercise-search-engine", text: "Exercise: Search Engine" },
      { href: "/exercises/exercise-distributed-job-scheduler", text: "Exercise: Job Scheduler" },
      { href: "/exercises/exercise-design-chatgpt", text: "Exercise: ChatGPT" },
    ],
  },
];

const phase4: DayPlan[] = [
  { day: 21, label: "Post-mortems + Quiz I",
    links: [
      { href: "/postmortems/aws-s3-2017-typo", text: "PM: AWS S3 Typo (2017)" },
      { href: "/postmortems/knight-capital-2012", text: "PM: Knight Capital (2012)" },
      { href: "/quiz", text: "Quiz: Foundations cluster" },
      { href: "/quiz", text: "Quiz: Databases cluster" },
    ],
  },
  { day: 22, label: "Post-mortems + Quiz II",
    links: [
      { href: "/postmortems/github-2018-network-partition", text: "PM: GitHub Partition (2018)" },
      { href: "/postmortems/facebook-2021-bgp", text: "PM: Facebook BGP (2021)" },
      { href: "/quiz", text: "Quiz: Caching cluster" },
      { href: "/quiz", text: "Quiz: Messaging cluster" },
    ],
  },
  { day: 23, label: "Post-mortems + Quiz III",
    links: [
      { href: "/postmortems/roblox-2021-consul", text: "PM: Roblox Consul (2021)" },
      { href: "/postmortems/cloudflare-2019-regex", text: "PM: Cloudflare Regex (2019)" },
      { href: "/quiz", text: "Quiz: Distributed systems cluster" },
      { href: "/quiz", text: "Quiz: Reliability cluster" },
    ],
  },
  { day: 24, label: "Post-mortems + Quiz IV",
    links: [
      { href: "/postmortems/gitlab-2017-db-delete", text: "PM: GitLab DB Delete (2017)" },
      { href: "/postmortems/crowdstrike-2024-kernel-driver", text: "PM: CrowdStrike (2024)" },
      { href: "/quiz", text: "Quiz: Scaling cluster" },
      { href: "/quiz", text: "Quiz: Security cluster" },
    ],
  },
  { day: 25, label: "Post-mortems + Quiz V",
    links: [
      { href: "/postmortems/slack-2021-jan-aws", text: "PM: Slack AWS (2021)" },
      { href: "/postmortems/reddit-2023-k8s-upgrade", text: "PM: Reddit K8s (2023)" },
      { href: "/quiz", text: "Quiz: Architecture patterns cluster" },
      { href: "/quiz", text: "Quiz: Data structures cluster" },
    ],
  },
];

const phase5: DayPlan[] = [
  { day: 26, label: "Mock: Easy + Medium",
    links: [
      { href: "/exercises/exercise-url-shortener", text: "Timed: URL Shortener (35 min)" },
      { href: "/exercises/exercise-news-feed", text: "Timed: News Feed (40 min)" },
    ],
  },
  { day: 27, label: "Mock: Medium",
    links: [
      { href: "/exercises/exercise-whatsapp", text: "Timed: WhatsApp (40 min)" },
      { href: "/exercises/exercise-youtube-netflix", text: "Timed: YouTube/Netflix (40 min)" },
    ],
  },
  { day: 28, label: "Mock: Medium-Hard",
    links: [
      { href: "/exercises/exercise-uber", text: "Timed: Uber (45 min)" },
      { href: "/exercises/exercise-google-docs", text: "Timed: Google Docs (45 min)" },
    ],
  },
  { day: 29, label: "Mock: Hard",
    links: [
      { href: "/exercises/exercise-stock-exchange", text: "Timed: Stock Exchange (45 min)" },
      { href: "/exercises/exercise-distributed-job-scheduler", text: "Timed: Job Scheduler (45 min)" },
    ],
  },
  { day: 30, label: "Mock: Full Simulation",
    links: [
      { href: "/exercises/exercise-design-chatgpt", text: "Timed: ChatGPT (45 min)" },
      { href: "/exercises/exercise-payment-gateway", text: "Timed: Payment Gateway (45 min)" },
    ],
  },
];

const phases = [
  { name: "Phase 1 — Foundations", subtitle: "Days 1-5: 10 concepts/day", days: phase1 },
  { name: "Phase 2 — Core Problems", subtitle: "Days 6-15: 3 problems/day, easy to hard", days: phase2 },
  { name: "Phase 3 — Advanced + Exercises", subtitle: "Days 16-20: hard problems + exercise drills", days: phase3 },
  { name: "Phase 4 — Post-mortems + Quiz", subtitle: "Days 21-25: 2 post-mortems/day + 2 quiz clusters/day", days: phase4 },
  { name: "Phase 5 — Mock Practice", subtitle: "Days 26-30: timed exercises only, self-score", days: phase5 },
];

export default function StudyPlanPage() {
  return (
    <>
      <Topbar />
      <div id="main" className="landing-layout">
        <header className="landing-hero">
          <div className="eyebrow">Study Plan</div>
          <h1>
            30-Day System Design <br />Interview Prep
          </h1>
          <p>
            A structured schedule that takes you from foundations through hard
            problems to timed mock interviews. Each day links to the actual
            content — concepts, problems, exercises, post-mortems, and quizzes.
          </p>
          <div className="stats">
            <span><b>30</b> days</span>
            <span><b>5</b> phases</span>
            <span><b>50+</b> concepts &middot; <b>30+</b> problems &middot; <b>20+</b> exercises</span>
          </div>
        </header>

        {phases.map((phase, pi) => (
          <section className="category-block" key={pi}>
            <div className="category-header">
              <h2>{phase.name}</h2>
              <span className="count">{phase.subtitle}</span>
            </div>
            <div className="problem-grid">
              {phase.days.map((d) => (
                <div
                  key={d.day}
                  className="problem-card"
                  style={{
                    ["--accent-h" as string]: String(200 + pi * 30),
                    ["--accent-s" as string]: "60%",
                    ["--accent-l" as string]: "48%",
                  }}
                >
                  <div className="pc-head">
                    <span className="pc-eyebrow">Day {d.day}</span>
                  </div>
                  <h3 className="pc-title">{d.label}</h3>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0 0" }}>
                    {d.links.map((lnk, li) => (
                      <li key={li} style={{ marginBottom: "0.25rem" }}>
                        <Link
                          href={lnk.href}
                          style={{ color: "hsl(var(--accent-h) var(--accent-s) var(--accent-l))", textDecoration: "none", fontSize: "0.85rem" }}
                        >
                          {lnk.text}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <Footer />
    </>
  );
}
