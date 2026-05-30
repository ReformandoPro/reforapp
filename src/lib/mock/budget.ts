/**
 * Datos mock temporales para UI.
 * No representan contratos definitivos de backend.
 * Sustituir por datos reales definidos por Openclaw.
 */
import type { BudgetSummary } from "@/lib/types";

export const mockBudgetSummary: BudgetSummary = {
  id: "budget_obra_centro_v1",
  projectId: "Reforma integral — Calle Mayor 18",
  status: "sent",
  estimatedCost: 60000,
  salePrice: 85714.2857,
  targetMarginRate: 0.3,
  actualMarginRate: 0.3,
  pricePerSquareMeter: 952.38,
  costPerSquareMeter: 666.67,
  contingencyAmount: 3000,
  clientVisibleTotal: 85714.2857,
};
