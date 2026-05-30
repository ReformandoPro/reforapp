import { mockBudgetSummaries } from "@/lib/mock/budget";

import type { BudgetsRepository } from "./budgets-repository";

export class MockBudgetsRepository implements BudgetsRepository {
  getBudgetSummary(budgetId: string) {
    return mockBudgetSummaries.find((budget) => budget.id === budgetId);
  }

  getBudgetSummaries() {
    return mockBudgetSummaries;
  }
}
