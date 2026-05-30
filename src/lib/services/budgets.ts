import { mockBudgetSummaries } from "@/lib/mock/budget";
import type { BudgetSummary } from "@/lib/types";

export function getBudgetSummary(budgetId: string): BudgetSummary | undefined {
  return mockBudgetSummaries.find((budget) => budget.id === budgetId);
}

export function getBudgetSummaries(): BudgetSummary[] {
  return mockBudgetSummaries;
}
