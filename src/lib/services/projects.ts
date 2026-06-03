import {
  getProjectById,
  getProjects,
  getProjectsPageCardsFromSupabaseOrMock,
} from "@/lib/data";
import type { ProjectCard, ProjectOverview } from "@/lib/types";

/**
 * Application service boundary for project read models.
 * UI must consume this service, not mocks or Supabase clients directly.
 */
export function getProjectCards(): ProjectCard[] {
  return getProjects();
}

export async function getProjectCardsForProjectsPage(): Promise<ProjectCard[]> {
  return getProjectsPageCardsFromSupabaseOrMock();
}

export function getProjectOverview(
  projectId: string
): ProjectOverview | undefined {
  return getProjectById(projectId);
}
