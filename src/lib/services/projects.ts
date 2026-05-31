import { createProjectsRepository } from "@/lib/application";
import type { ProjectCard, ProjectOverview } from "@/lib/types";

/**
 * Application service boundary for project read models.
 * UI must consume this service, not mocks or Supabase clients directly.
 */
const projectsRepository = createProjectsRepository({ dataSource: "mock" });

export function getProjectCards(): ProjectCard[] {
  return projectsRepository.getProjectCards();
}

export function getProjectOverview(
  projectId: string
): ProjectOverview | undefined {
  return projectsRepository.getProjectOverview(projectId);
}
