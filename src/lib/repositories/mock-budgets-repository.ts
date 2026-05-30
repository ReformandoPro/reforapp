import { mockBudgetSummaries, mockBudgetView } from "@/lib/mock/budget";

import type { BudgetsRepository } from "./budgets-repository";

export class MockBudgetsRepository implements BudgetsRepository {
  getBudgetSummary(budgetId: string) {
    return budgetId === mockBudgetView.id ? mockBudgetView : undefined;
  }

  getBudgetSummaries() {
    return mockBudgetSummaries;
  }
}
