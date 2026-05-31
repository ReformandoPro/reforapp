import type { ProjectCard, ProjectOverview } from "@/lib/types";

/**
 * Boundary for project read models consumed by application services.
 *
 * `ProjectCard` is the public UI read contract.
 * A future `SupabaseProjectsRepository` must keep this same interface and map
 * database rows into that contract without exposing Supabase table shapes to UI.
 *
 * For the first real Supabase read of `getProjectCards()`, the repository should
 * read only the partial model backed by `projects` + `clients`. The counters
 * `delayedTasksCount`, `blockedTasksCount` and `pendingApprovalsCount` stay as
 * mock or controlled values until a second iteration introduces `tasks` and
 * `approvals`.
 */
export interface ProjectsRepository {
  getProjectCards(): ProjectCard[];
  getProjectOverview(projectId: string): ProjectOverview | undefined;
}
