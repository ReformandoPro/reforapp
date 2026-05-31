import { createBudgetsRepository } from "@/lib/application";
import type { BudgetSummary, BudgetView } from "@/lib/types";

const budgetsRepository = createBudgetsRepository({ dataSource: "mock" });

export function getBudgetSummary(budgetId: string): BudgetView | undefined {
  return budgetsRepository.getBudgetSummary(budgetId);
}

export function getBudgetSummaries(): BudgetSummary[] {
  return budgetsRepository.getBudgetSummaries();
}
