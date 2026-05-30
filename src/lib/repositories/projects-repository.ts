import type { ProjectCard, ProjectOverview } from "@/lib/types";

export interface ProjectsRepository {
  getProjectCards(): ProjectCard[];
  getProjectOverview(projectId: string): ProjectOverview | undefined;
}
