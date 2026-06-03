import { getProjectById, getProjects } from "@/lib/data";
import type { ProjectCard, ProjectOverview } from "@/lib/types";

/**
 * Application service boundary for project read models.
 * UI must consume this service, not mocks or Supabase clients directly.
 */
export function getProjectCards(): ProjectCard[] {
  return getProjects();
}

export function getProjectOverview(
  projectId: string
): ProjectOverview | undefined {
  return getProjectById(projectId);
}
