export const BUDGET_STATUSES = [
  "draft",
  "sent",
  "viewed",
  "change_requested",
  "approved",
  "rejected",
  "expired",
  "archived",
] as const;

export type BudgetStatus = (typeof BUDGET_STATUSES)[number];

export function isBudgetStatus(value: string): value is BudgetStatus {
  return BUDGET_STATUSES.includes(value as BudgetStatus);
}
