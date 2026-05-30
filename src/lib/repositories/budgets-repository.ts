import type { BudgetSummary, BudgetView } from "@/lib/types";

export interface BudgetsRepository {
  getBudgetSummary(budgetId: string): BudgetView | undefined;
  getBudgetSummaries(): BudgetSummary[];
}
