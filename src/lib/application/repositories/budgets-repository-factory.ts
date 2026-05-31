import { MockBudgetsRepository } from "../../repositories/mock-budgets-repository";
import type { BudgetsRepository } from "../../repositories/budgets-repository";

export type BudgetsRepositoryDataSource = "mock" | "supabase";

export type CreateBudgetsRepositoryOptions = {
  dataSource?: BudgetsRepositoryDataSource;
};

function normalizeBudgetsRepositoryFactoryInput(
  input?: CreateBudgetsRepositoryOptions
): Required<CreateBudgetsRepositoryOptions> {
  return {
    dataSource: input?.dataSource ?? "mock",
  };
}

/**
 * Minimal application-layer composition point for budgets repositories.
 *
 * UI must keep consuming `services` and must not use this factory directly.
 * Only the mock datasource is operational for now.
 */
export function createBudgetsRepository(): BudgetsRepository;
export function createBudgetsRepository(
  options: CreateBudgetsRepositoryOptions
): BudgetsRepository;
export function createBudgetsRepository(
  input?: CreateBudgetsRepositoryOptions
): BudgetsRepository {
  const { dataSource } = normalizeBudgetsRepositoryFactoryInput(input);

  if (dataSource === "supabase") {
    throw new Error(
      "SupabaseBudgetsRepository is not available from the application factory yet"
    );
  }

  return new MockBudgetsRepository();
}
