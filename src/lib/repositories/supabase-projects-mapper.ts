import { isProjectStatus } from "../domain/projects/status";
import type { ProjectCard } from "../types";

/**
 * Internal partial row shape expected by the future SupabaseProjectsRepository
 * for the first `getProjectCards()` read.
 *
 * This type is repository-internal and must not leak to UI.
 */
export type SupabaseProjectCardPartialRow = {
  id: string;
  name: string;
  status: string;
  client_id: string;
  client: {
    id: string;
    display_name: string;
  };
};

/**
 * Maps the future partial Supabase row (`projects` + `clients`) into the stable
 * `ProjectCard` UI contract.
 *
 * Counters remain controlled values until a second iteration introduces real
 * reads from `tasks` and `approvals`.
 */
export function mapSupabaseProjectCardPartialRowToProjectCard(
  row: SupabaseProjectCardPartialRow
): ProjectCard {
  if (!isProjectStatus(row.status)) {
    throw new Error(`Invalid project status: ${row.status}`);
  }

  return {
    id: row.id,
    name: row.name,
    clientName: row.client.display_name,
    status: row.status,
    delayedTasksCount: 0,
    blockedTasksCount: 0,
    pendingApprovalsCount: 0,
  };
}
