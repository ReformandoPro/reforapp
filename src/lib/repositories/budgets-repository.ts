import type { BudgetSummary } from "@/lib/types";

export interface BudgetsRepository {
  getBudgetSummary(budgetId: string): BudgetSummary | undefined;
  getBudgetSummaries(): BudgetSummary[];
}
