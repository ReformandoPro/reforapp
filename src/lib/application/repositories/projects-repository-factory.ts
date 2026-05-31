import type { ProjectsApplicationContext } from "../context/projects-application-context";
import { MockProjectsRepository } from "../../repositories/mock-projects-repository";
import type { ProjectsRepository } from "../../repositories/projects-repository";

/**
 * Minimal application-layer composition point for project repositories.
 *
 * UI must keep consuming `services` and must not use this factory directly.
 * The active runtime remains mock-backed until a later iteration wires services
 * through the application layer.
 *
 * Future responsibilities of this factory/gateway:
 * - receive or resolve application context outside UI;
 * - include organization scope (`organizationId`) resolved before repository use;
 * - select mock vs Supabase implementation;
 * - construct a `SupabaseProjectsRepository` only when that runtime path is
 *   explicitly enabled.
 *
 * The optional `context` parameter is accepted now only to stabilize the future
 * composition signature. It is intentionally not used yet because runtime must
 * remain mock-backed until a later iteration wires real repository selection.
 */
export function createProjectsRepository(
  context?: ProjectsApplicationContext
): ProjectsRepository {
  void context;

  return new MockProjectsRepository();
}
