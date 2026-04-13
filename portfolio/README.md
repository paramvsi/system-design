# System Design Portfolio

Unified Next.js 15 + Vercel site that turns 31 self-contained HTML system
design pages (at `../*.html`) into one searchable portfolio.

## Commands

```bash
npm install          # one time
npm run extract      # parse ../*.html → content/*.json + public/styles/*.css
npm run build        # next build (static export to out/) + pagefind postbuild
npm start            # serve ./out locally via `npx serve`
```

For local dev: `npm run dev` (hot-reload). Search UI is stubbed during dev
because Pagefind runs after the static export; run `npm run build` to enable
real search.

## Architecture

- `scripts/extract.mjs` — jsdom-based parser. Reads each `../*.html`, splits
  out sections, SVG architecture diagram, Mermaid sources, flow stepper nodes
  / descriptions, related + similar links. Rewires `onclick="hlNode('x')"` to
  `data-hl-node="x"`. Rewrites cross-page links (`../foo/index.html` → `/foo`)
  using a slug-normalization table. Each file's inline `<style>` block is
  written to `public/styles/<slug>.css` with `:root{…}` stripped so the per-
  problem accent vars injected by React still win.
- `content/<slug>.json` — the structured content each Next.js page renders.
- `app/[slug]/page.tsx` — dynamic problem page (`generateStaticParams` enumerates
  `content/`). Injects accent CSS vars on `.layout`, renders hero + sidebar
  scroll-spy + each section via `<ProblemSectionBody>`.
- `components/` — Sidebar, FlowStepper, Mermaid, ArchDiagramHost, Topbar,
  SearchUI (Pagefind), ProblemCard, ProblemSectionBody.
- `app/globals.css` — lifted design system + additions for the landing grid +
  Pagefind UI theming.

## Deploying to Vercel

1. Push this `portfolio/` folder as the project root.
2. Build Command: `npm run build` (Pagefind runs via `postbuild`).
3. Output Directory: `out`.

## Regenerating content

Edit any `../*.html` file, then:

```bash
npm run extract && npm run build
```

Content JSON + per-problem CSS regenerate from the HTML sources.

## Search

- Pagefind scans the static `out/` directory and writes `out/pagefind/` with
  an index + UI JS. Opens on ⌘/Ctrl-K.
- Only `<main>` body content is indexed — topbar/sidebar have
  `data-pagefind-ignore` so boilerplate does not pollute results.
- Per-problem categories exposed as a filter via `data-pagefind-filter`.
