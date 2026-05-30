/**
 * Datos mock temporales para UI.
 * No representan contratos definitivos de backend.
 * Sustituir por datos reales definidos por Openclaw.
 */
import type { DashboardSummary } from "@/lib/types";

import { mockBudgetSummaries } from "./budget";
import { mockProjectCards } from "./project";

export const mockDashboardSummary: DashboardSummary = {
  activeProjectsCount: 4,
  delayedTasksCount: 7,
  blockedTasksCount: 2,
  pendingApprovalsCount: 5,
  projects: mockProjectCards,
  budgetsRequiringAction: mockBudgetSummaries,
};
