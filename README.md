# System Design Portfolio

> Open-source, interview-grade system design reference — 43 canonical
> problems, 110 concept pages, 15 practice exercises, 80+ quiz questions,
> and 12 real-world post-mortems. Free, no signup, built to re-read.

**Live:** (deploy URL goes here once hosted)

---

## What's in here

| Type | Count | Path |
|------|-------|------|
| Problems (full system designs) | **43** | `./*.html` |
| Concepts (fundamental references) | **110** | `concepts/` |
| Exercises (with scoring rubric) | **15** | `exercises/` |
| Quiz clusters (80+ questions) | **11** | `portfolio/content/quiz/` |
| Post-mortems (real-world failures) | **12** | `postmortems/` |

Each problem page covers requirements, scale estimation, API design,
architecture SVG, deep-dive Mermaid sequences, tradeoffs, failure modes,
interview tips, anti-patterns, and a 5-stage evolution story.

---

## Repo layout

```
.
├── *.html                    # 43 problem source pages (Instagram, YouTube, Uber, …)
├── concepts/*.html           # 110 concept source pages (sharding, consensus, caching, …)
├── exercises/*.html          # 15 practice exercises with rubrics
├── postmortems/*.html        # 12 real-world incident analyses
├── portfolio/                # Next.js 15 app (static export)
│   ├── app/                  # Routes: /, /[slug], /concepts, /exercises, /quiz, /postmortems
│   ├── components/           # React components
│   ├── content/              # Extracted JSON (built from source HTMLs)
│   ├── public/styles/        # Per-page inline CSS (extracted)
│   ├── scripts/              # Extractor, content authoring scripts
│   └── DEPLOY.md             # Deploy instructions
└── system-design-project-context.md
```

Source HTML files are the **authoring format** — hand-written, each with
their own accent color, inline `<style>`, and section structure. The
Next.js extractor (`portfolio/scripts/extract.mjs`) walks them and emits
JSON + CSS artifacts that the site renders.

---

## Running locally

```bash
cd portfolio
npm install
npm run extract            # extract all 4 content kinds from source HTMLs
npm run build              # Next.js static export to out/
npx serve out              # preview at localhost:3000
```

Individual extraction:

```bash
npm run extract:problems
npm run extract:concepts
npm run extract:postmortems
npm run extract:exercises
```

---

## Authoring a new problem

1. Copy `TEMPLATE.html` to `new-problem.html`
2. Fill in sections following the template structure
3. Register the slug in `portfolio/scripts/extract.mjs` (`PROBLEM_CATEGORIES`)
4. `npm run extract:problems && npm run build`

Similar patterns for concepts, exercises, post-mortems — see their
respective source dirs for examples.

---

## Stack

- **Next.js 15** (App Router, static export via `output: "export"`)
- **React 19**
- **Pagefind** (static-site search — indexed at postbuild)
- **Mermaid** (sequence + flowchart diagrams, rendered client-side)
- **jsdom** (content extraction from source HTMLs)

Zero runtime server. Deploys as static files to Vercel, Cloudflare Pages,
Netlify, or any CDN.

---

## Design philosophy

- **Opinionated over neutral.** Every page picks a side on the
  tradeoffs instead of listing pros/cons vaguely.
- **Real numbers.** Production figures from Stripe, Cloudflare, Netflix,
  Twitter, Discord, not hand-waved estimates.
- **Interview-grade depth.** What a strong candidate would actually
  cover in a 45-minute whiteboard — no more, no less.
- **Additive, never breaking.** New features (post-mortems, exercises,
  quizzes) add sections/pages; no existing content is rewritten.

---

## License

Content: **CC-BY 4.0** — use freely with attribution.
Code: **MIT**.

---

## Acknowledgements

Built as a study project. Heavy inspiration from Grokking System Design,
Designing Data-Intensive Applications, and countless engineering
post-mortems from AWS, Cloudflare, GitHub, Meta, GitLab, Slack, Discord,
Roblox, and others linked in `postmortems/`.
