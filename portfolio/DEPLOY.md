# Deploying to Vercel

The portfolio is a static export — Vercel serves the built `out/` directory as a
plain static site with their global CDN in front. No serverless functions, no
runtime, nothing to scale.

## Pre-flight

Already configured for you:
- `next.config.mjs` has `output: 'export'` + `trailingSlash: true`.
- `vercel.json` sets the build command to `npm run extract && npm run build` so
  Vercel re-extracts content + runs the Pagefind post-build step on every deploy.
- `.gitignore` excludes `out/`, `.next/`, `node_modules/`, and `public/pagefind/`.

## One-time setup

### Option A — Vercel CLI (fastest)

```bash
# One time
npm install -g vercel
cd portfolio
vercel login

# First deploy — answers the prompts, creates a project
vercel

# Production deploy from here on
vercel --prod
```

That's it. Vercel prints the live URL.

### Option B — GitHub integration (auto-deploy on push)

1. Push this repo to GitHub (the parent directory with `portfolio/` inside, or
   just the `portfolio/` directory itself).
2. At <https://vercel.com/new>, "Import Project" and pick the GitHub repo.
3. In the framework preset picker, choose **Next.js**.
4. Set **Root Directory** to `portfolio` if you pushed the parent directory.
   (If you pushed `portfolio/` as the repo root, leave it blank.)
5. Build & Output settings are taken from `vercel.json` — no changes needed.
6. Click **Deploy**. Every push to `main` triggers a production deploy; every
   branch push gets a preview URL.

## Environment variables

None. The site has no secrets and no backend — nothing to configure.

## Custom domain

In the Vercel dashboard → project → Settings → Domains, add your domain.
Vercel handles the TLS cert via Let's Encrypt automatically.

## Verifying a deploy

After the first deploy, visit:

- `/` — landing with problem categories
- `/concepts/` — concept library
- `/001-url-shortener/` — a sample problem
- `/concepts/load-balancer/` — a sample concept
- `/pagefind/pagefind.js` — should return 200 (the search index)

Press ⌘K on the landing page and search for "consistent hashing" — results
should include both the concept and multiple problem pages.

## Regenerating content

Edit any HTML file in the parent `SystemDesign/` or `concepts/` directories,
commit, push. Vercel's build command re-runs `npm run extract` automatically,
so the content JSON is always in sync.

For local iteration:

```bash
npm run extract      # regenerate content/
npm run dev          # hot-reloading dev server (search is stubbed in dev)
npm run build        # full production build + Pagefind index
npm start            # serve ./out locally
```

## Troubleshooting

- **"Page missing generateStaticParams()"** — means `content/concepts/` or
  `content/` is empty. Run `npm run extract` first.
- **Search returns nothing** — Pagefind only builds post-`next build`. If you
  only ran `next dev`, you get the dev stub. Run `npm run build`.
- **Mermaid diagrams blank** — check the browser console. Usually a mermaid
  parse error on a specific source; the component shows the error inline.
