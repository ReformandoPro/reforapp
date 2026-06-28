import type { ShowcaseProject } from "./types";

import { showcaseProjects } from "./data/projects";

export function getShowcaseProjectBySlug(slug: string): ShowcaseProject | null {
  const clean = String(slug ?? "").trim().toLowerCase();
  if (!clean) return null;
  return showcaseProjects.find((p) => p.slug === clean) ?? null;
}

