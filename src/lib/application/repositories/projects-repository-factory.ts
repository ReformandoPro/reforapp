import type { ProjectsApplicationContext } from "../context/projects-application-context";
import { MockProjectsRepository } from "../../repositories/mock-projects-repository";
import type { ProjectsRepository } from "../../repositories/projects-repository";

export type ProjectsRepositoryDataSource = "mock" | "supabase";

export type CreateProjectsRepositoryOptions = {
  context?: ProjectsApplicationContext;
  dataSource?: ProjectsRepositoryDataSource;
};

type CreateProjectsRepositoryInput =
  | ProjectsApplicationContext
  | CreateProjectsRepositoryOptions
  | undefined;

type NormalizedProjectsRepositoryFactoryInput = {
  context?: ProjectsApplicationContext;
  dataSource: ProjectsRepositoryDataSource;
};

function isCreateProjectsRepositoryOptions(
  input: CreateProjectsRepositoryInput
): input is CreateProjectsRepositoryOptions {
  return input !== undefined && "dataSource" in input;
}

function normalizeProjectsRepositoryFactoryInput(
  input: CreateProjectsRepositoryInput
): NormalizedProjectsRepositoryFactoryInput {
  if (isCreateProjectsRepositoryOptions(input)) {
    return {
      context: input.context,
      dataSource: input.dataSource ?? "mock",
    };
  }

  return {
    context: input,
    dataSource: "mock",
  };
}

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
 *
 * The `dataSource` option is also intentionally limited for now:
 * - `mock` is the only operational datasource;
 * - `supabase` fails explicitly until the application factory can build a real
 *   repository path without implying that Supabase is already active.
 */
export function createProjectsRepository(): ProjectsRepository;
export function createProjectsRepository(
  context: ProjectsApplicationContext
): ProjectsRepository;
export function createProjectsRepository(
  options: CreateProjectsRepositoryOptions
): ProjectsRepository;
export function createProjectsRepository(
  input?: CreateProjectsRepositoryInput
): ProjectsRepository {
  const { context, dataSource } = normalizeProjectsRepositoryFactoryInput(input);
  void context;

  if (dataSource === "supabase") {
    throw new Error(
      "SupabaseProjectsRepository is not available from the application factory yet"
    );
  }

  return new MockProjectsRepository();
}
