import { getBudgetById, getBudgets } from "@/lib/data";
import type { BudgetSummary, BudgetView } from "@/lib/types";

export function getBudgetSummary(budgetId: string): BudgetView | undefined {
  return getBudgetById(budgetId);
}

export function getBudgetSummaries(): BudgetSummary[] {
  return getBudgets();
}
