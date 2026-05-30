import type { BudgetStatus } from "@/lib/domain/budgets/status";

export type BudgetAlertLevel = "info" | "warning" | "danger";

export type BudgetAlert = {
  id: string;
  level: BudgetAlertLevel;
  message: string;
};

export type BudgetInternalView = {
  estimatedCost: number;
  salePrice: number;
  targetMarginRate: number;
  actualMarginRate: number;
  contingencyAmount: number;
};

export type BudgetClientView = {
  clientVisibleTotal: number;
  statusLabel: string;
};

export type BudgetView = {
  id: string;
  projectId: string;
  title: string;
  status: BudgetStatus;
  internal: BudgetInternalView;
  client: BudgetClientView;
  alerts: BudgetAlert[];
};
