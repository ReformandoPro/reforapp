import { mockProjectCards } from "@/lib/mock/project";
import type { ProjectCard } from "@/lib/types";

export function getProjectCards(): ProjectCard[] {
  return mockProjectCards;
}

export function getProjectOverview(projectId: string): ProjectCard | undefined {
  return mockProjectCards.find((project) => project.id === projectId);
}
