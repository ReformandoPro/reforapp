import { MockDashboardRepository } from "../../repositories/mock-dashboard-repository";
import type { DashboardRepository } from "../../repositories/dashboard-repository";

export type DashboardRepositoryDataSource = "mock" | "supabase";

export type CreateDashboardRepositoryOptions = {
  dataSource?: DashboardRepositoryDataSource;
};

function normalizeDashboardRepositoryFactoryInput(
  input?: CreateDashboardRepositoryOptions
): Required<CreateDashboardRepositoryOptions> {
  return {
    dataSource: input?.dataSource ?? "mock",
  };
}

/**
 * Minimal application-layer composition point for dashboard repositories.
 *
 * UI must keep consuming `services` and must not use this factory directly.
 * Only the mock datasource is operational for now.
 */
export function createDashboardRepository(): DashboardRepository;
export function createDashboardRepository(
  options: CreateDashboardRepositoryOptions
): DashboardRepository;
export function createDashboardRepository(
  input?: CreateDashboardRepositoryOptions
): DashboardRepository {
  const { dataSource } = normalizeDashboardRepositoryFactoryInput(input);

  if (dataSource === "supabase") {
    throw new Error(
      "SupabaseDashboardRepository is not available from the application factory yet"
    );
  }

  return new MockDashboardRepository();
}
