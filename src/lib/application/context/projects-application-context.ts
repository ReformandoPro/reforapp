import type { EntityId } from "@/lib/types";

/**
 * Minimal future application context for project reads.
 *
 * This context must be resolved outside UI.
 * In a future real flow it may come from Auth, memberships and the active
 * organization selection. In local or demo mode it may also use a controlled
 * fixed value.
 *
 * It is intentionally not connected to runtime yet:
 * - `services/projects.ts` does not use it;
 * - `createProjectsRepository()` may accept it, but does not use it yet to
 *   select a real repository path;
 * - `SupabaseProjectsRepository` remains inactive.
 */
export interface ProjectsApplicationContext {
  organizationId: EntityId;
}

/**
 * Pure helper that builds the minimal projects application context shape.
 *
 * It performs no I/O, does not read environment variables and does not depend
 * on Supabase or Auth.
 */
export function createProjectsApplicationContext(input: {
  organizationId: EntityId;
}): ProjectsApplicationContext {
  return {
    organizationId: input.organizationId,
  };
}
