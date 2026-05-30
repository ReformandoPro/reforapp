import type { ProjectCard, ProjectOverview } from "@/lib/types";

import { MockProjectsRepository } from "@/lib/repositories";

const projectsRepository = new MockProjectsRepository();

export function getProjectCards(): ProjectCard[] {
  return projectsRepository.getProjectCards();
}

export function getProjectOverview(
  projectId: string
): ProjectOverview | undefined {
  return projectsRepository.getProjectOverview(projectId);
}
