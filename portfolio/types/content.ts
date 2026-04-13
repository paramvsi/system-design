export interface AccentHSL {
  h: number;
  s: number;
  l: number;
}

export interface ProblemSection {
  id: string;
  label: string;
  number?: string;
  html: string;
}

export interface MermaidBlock {
  sectionId: string;
  source: string;
  index: number;
}

export interface RelatedLink {
  slug: string;
  label: string;
}

export interface SimilarLink {
  slug: string;
  name: string;
  why: string;
}

export interface ProblemContent {
  slug: string;
  title: string;
  problemNumber: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  heroDescription: string;
  tags: string[];
  accent: AccentHSL;
  category: string;
  blurb: string;
  sections: ProblemSection[];
  archSvg: string | null;
  flow: { nodes: string[]; descs: string[]; sectionId: string } | null;
  mermaid: MermaidBlock[];
  related: RelatedLink[];
  similar: SimilarLink[];
  readMinutes: number;
}

export interface IndexEntry {
  slug: string;
  title: string;
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  accent: AccentHSL;
  tags: string[];
  category: string;
  blurb: string;
  problemNumber: string | null;
  readMinutes: number;
}
