import type { BudgetSummary } from "@/lib/types";

import { MockBudgetsRepository } from "@/lib/repositories";

const budgetsRepository = new MockBudgetsRepository();

export function getBudgetSummary(budgetId: string): BudgetSummary | undefined {
  return budgetsRepository.getBudgetSummary(budgetId);
}

export function getBudgetSummaries(): BudgetSummary[] {
  return budgetsRepository.getBudgetSummaries();
}
