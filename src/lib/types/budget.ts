export type BudgetStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "change_requested"
  | "approved"
  | "rejected"
  | "expired"
  | "archived";

export type BudgetSummary = {
  id: string;
  projectId: string;
  status: BudgetStatus;
  estimatedCost: number;
  salePrice: number;
  targetMarginRate: number;
  actualMarginRate: number;
  pricePerSquareMeter: number;
  costPerSquareMeter: number;
  contingencyAmount: number;
  clientVisibleTotal: number;
};
