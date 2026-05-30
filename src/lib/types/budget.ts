import type { BudgetStatus } from "@/lib/domain/budgets/status";

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
