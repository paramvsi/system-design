/**
 * Client-side read-state helpers backed by localStorage.
 * Keys: read:problem:<slug>, read:concept:<slug>
 */

export type ReadKind = "problem" | "concept";

export function storageKey(kind: ReadKind, slug: string): string {
  return `read:${kind}:${slug}`;
}

export function isRead(kind: ReadKind, slug: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(storageKey(kind, slug)) === "1";
  } catch {
    return false;
  }
}

export function setRead(kind: ReadKind, slug: string, value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    const key = storageKey(kind, slug);
    if (value) window.localStorage.setItem(key, "1");
    else window.localStorage.removeItem(key);
    window.dispatchEvent(
      new CustomEvent("progress:change", {
        detail: { kind, slug, read: value },
      })
    );
  } catch {
    /* ignore */
  }
}

export function listReadSlugs(kind: ReadKind): Set<string> {
  const out = new Set<string>();
  if (typeof window === "undefined") return out;
  try {
    const prefix = `read:${kind}:`;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix) && window.localStorage.getItem(k) === "1") {
        out.add(k.slice(prefix.length));
      }
    }
  } catch {
    /* ignore */
  }
  return out;
}
