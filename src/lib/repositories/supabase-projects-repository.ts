import type { ProjectCard, ProjectOverview } from "@/lib/types";

import type { ProjectsRepository } from "./projects-repository";
import {
  mapSupabaseProjectCardPartialRowToProjectCard,
  type SupabaseProjectCardPartialRow,
} from "./supabase-projects-mapper";

/**
 * Future repository context for Supabase-backed project reads.
 *
 * This is intentionally internal-only for now. The active UI/service flow must
 * not pass `organizationId` directly, and the current runtime keeps using the
 * mock repository.
 */
type SupabaseProjectsRepositoryContext = {
  organizationId: string;
};

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
 * The future `organizationId` scope must be resolved before this repository by
 * a factory, repository context, gateway or upper application layer. UI must
 * never know or pass that value directly.
 *
 * Until a second iteration introduces `tasks` and `approvals`, the counters
 * `delayedTasksCount`, `blockedTasksCount` and `pendingApprovalsCount` must
 * stay as controlled values inside the repository layer, never in UI.
 */
export class SupabaseProjectsRepository implements ProjectsRepository {
  /**
   * Placeholder for the future organization-scoped context.
   *
   * The first real implementation is expected to receive this from outside the
   * repository, not resolve it from Auth inside the repository itself.
   */
  private getProjectCardsContext(): SupabaseProjectsRepositoryContext {
    throw new Error("SupabaseProjectsRepository is not connected yet");
  }

  /**
   * Placeholder for the future partial query result.
   *
   * In the real implementation this method will execute a partial read over
   * `projects` + `clients`, filtered by `organization_id`, and return the
   * repository-internal row shape expected by the mapper.
   */
  private getProjectCardRows(
    context: SupabaseProjectsRepositoryContext
  ): SupabaseProjectCardPartialRow[] {
    void context;

    throw new Error("SupabaseProjectsRepository is not connected yet");
  }

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
    /**
     * Future flow, intentionally not connected yet:
     * 1. Resolve organization scope before repository runtime usage.
     * 2. Execute partial read over `projects` + `clients`.
     * 3. Receive `SupabaseProjectCardPartialRow[]`.
     * 4. Map rows to `ProjectCard[]` through the internal list helper.
     */
    void this.getProjectCardsContext;
    void this.getProjectCardRows;
    void this.mapProjectCardRows;

    throw new Error("SupabaseProjectsRepository is not connected yet");
  }

  getProjectOverview(projectId: string): ProjectOverview | undefined {
    void projectId;

    throw new Error("SupabaseProjectsRepository is not connected yet");
  }
}
