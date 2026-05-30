import { mockProjectCards } from "@/lib/mock/project";

import type { ProjectsRepository } from "./projects-repository";

export class MockProjectsRepository implements ProjectsRepository {
  getProjectCards() {
    return mockProjectCards;
  }

  getProjectOverview(projectId: string) {
    return mockProjectCards.find((project) => project.id === projectId);
  }
}
