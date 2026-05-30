/**
 * Datos mock temporales para UI.
 * No representan contratos definitivos de backend.
 * Sustituir por datos reales definidos por Openclaw.
 */
import type { BudgetSummary, BudgetView } from "@/lib/types";

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

export const mockBudgetSummaries: BudgetSummary[] = [mockBudgetSummary];

export const mockBudgetView: BudgetView = {
  id: "budget_obra_centro_v1",
  projectId: "project_obra_centro",
  title: "Presupuesto base — Reforma integral Calle Mayor 18",
  status: "sent",
  internal: {
    estimatedCost: 60000,
    salePrice: 85714.2857,
    targetMarginRate: 0.3,
    actualMarginRate: 0.3,
    contingencyAmount: 3000,
  },
  client: {
    clientVisibleTotal: 85714.2857,
    statusLabel: "Enviado al cliente",
  },
  alerts: [
    {
      id: "budget-alert-margin-review",
      level: "warning",
      message: "Margen sujeto a revisión si suben materiales de acabado.",
    },
  ],
};
