import type { ProjectCard } from "@/lib/types";

export interface ProjectsRepository {
  getProjectCards(): ProjectCard[];
  getProjectOverview(projectId: string): ProjectCard | undefined;
}
