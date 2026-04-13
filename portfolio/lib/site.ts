/**
 * Canonical site URL. Override at deploy time with:
 *   NEXT_PUBLIC_SITE_URL=https://my-portfolio.vercel.app npm run build
 * Default works locally at http://localhost:4173 if you haven't set it.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://system-design.example.com";

export const SITE_NAME = "System Design Portfolio";
export const SITE_TAGLINE =
  "31 system design problems + 50 interview-grade concept references with unified search.";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
