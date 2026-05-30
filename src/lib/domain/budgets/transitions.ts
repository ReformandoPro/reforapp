import type { BudgetStatus } from "./status";

export const BUDGET_STATUS_TRANSITIONS: Record<BudgetStatus, BudgetStatus[]> = {
  draft: ["sent", "archived"],
  sent: ["viewed", "change_requested", "approved", "rejected", "expired", "archived"],
  viewed: ["change_requested", "approved", "rejected", "expired", "archived"],
  change_requested: ["draft", "sent", "archived"],
  approved: ["archived"],
  rejected: ["archived"],
  expired: ["draft", "archived"],
  archived: [],
};

export function canTransitionBudgetStatus(
  from: BudgetStatus,
  to: BudgetStatus
): boolean {
  return BUDGET_STATUS_TRANSITIONS[from].includes(to);
}
