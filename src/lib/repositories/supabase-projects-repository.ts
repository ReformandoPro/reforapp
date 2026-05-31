import type { ProjectCard, ProjectOverview } from "@/lib/types";

import type { ProjectsRepository } from "./projects-repository";
import {
  mapSupabaseProjectCardPartialRowToProjectCard,
  type SupabaseProjectCardPartialRow,
} from "./supabase-projects-mapper";

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
 * This repository now also contains the internal list-mapping step that will
 * compose those row mappings once the real query exists.
 *
 * Until a second iteration introduces `tasks` and `approvals`, the counters
 * `delayedTasksCount`, `blockedTasksCount` and `pendingApprovalsCount` must
 * stay as controlled values inside the repository layer, never in UI.
 */
export class SupabaseProjectsRepository implements ProjectsRepository {
  /**
   * Internal helper for the future partial Supabase read flow.
   *
   * It transforms repository-internal partial rows into `ProjectCard[]` using
   * the mapper module, but it does not execute queries and is not used by UI.
   */
  private mapProjectCardRows(
    rows: SupabaseProjectCardPartialRow[]
  ): ProjectCard[] {
    return rows.map(mapSupabaseProjectCardPartialRowToProjectCard);
  }

  getProjectCards(): ProjectCard[] {
    void this.mapProjectCardRows;

    throw new Error("SupabaseProjectsRepository is not connected yet");
  }

  getProjectOverview(projectId: string): ProjectOverview | undefined {
    void projectId;

    throw new Error("SupabaseProjectsRepository is not connected yet");
  }
}
