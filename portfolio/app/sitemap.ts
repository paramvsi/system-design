import fs from "node:fs/promises";
import path from "node:path";
import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

async function listSlugs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir);
    return entries
      .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
      .map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const contentDir = path.join(process.cwd(), "content");
  const [problems, concepts] = await Promise.all([
    listSlugs(contentDir),
    listSlugs(path.join(contentDir, "concepts")),
  ]);

  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/concepts/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  for (const slug of problems) {
    pages.push({
      url: `${SITE_URL}/${slug}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    });
  }
  for (const slug of concepts) {
    pages.push({
      url: `${SITE_URL}/concepts/${slug}/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return pages;
}
