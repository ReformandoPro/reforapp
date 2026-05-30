import type { ProjectCard, ProjectOverview } from "@/lib/types";

/**
 * Boundary for project read models.
 * Today this is implemented by mocks; a future SupabaseProjectsRepository
 * must map database rows into UI read contracts instead of exposing tables.
 */
export interface ProjectsRepository {
  getProjectCards(): ProjectCard[];
  getProjectOverview(projectId: string): ProjectOverview | undefined;
}
