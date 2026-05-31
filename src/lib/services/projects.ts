import type { ProjectCard, ProjectOverview } from "@/lib/types";

import { MockProjectsRepository } from "@/lib/repositories";

/**
 * Application service boundary for project read models.
 * UI must consume this service, not mocks or Supabase clients directly.
 */
const projectsRepository = new MockProjectsRepository();

export function getProjectCards(): ProjectCard[] {
  return projectsRepository.getProjectCards();
}

export function getProjectOverview(
  projectId: string
): ProjectOverview | undefined {
  return projectsRepository.getProjectOverview(projectId);
}
