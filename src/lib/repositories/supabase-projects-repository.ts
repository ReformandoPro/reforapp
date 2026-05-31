import type { ProjectCard, ProjectOverview } from "@/lib/types";

import type { ProjectsRepository } from "./projects-repository";

/**
 * Future Supabase-backed implementation for project read models.
 *
 * This is only a safe skeleton. It is not connected in runtime and must not be
 * used by services yet.
 *
 * First real iteration for `getProjectCards()` should read only the partial
 * model backed by `projects` + `clients` and map it into the `ProjectCard`
 * UI contract without exposing database details to the UI.
 *
 * That mapping is prepared in the internal `supabase-projects-mapper` module.
 *
 * Until a second iteration introduces `tasks` and `approvals`, the counters
 * `delayedTasksCount`, `blockedTasksCount` and `pendingApprovalsCount` must
 * stay as controlled values inside the repository layer, never in UI.
 */
export class SupabaseProjectsRepository implements ProjectsRepository {
  getProjectCards(): ProjectCard[] {
    throw new Error("SupabaseProjectsRepository is not connected yet");
  }

  getProjectOverview(projectId: string): ProjectOverview | undefined {
    void projectId;

    throw new Error("SupabaseProjectsRepository is not connected yet");
  }
}
