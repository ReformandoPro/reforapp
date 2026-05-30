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
  pendingBudgetsCount: 2,
  openIncidentsCount: 3,
  activeProjects: mockProjectCards,
  pendingBudgets: mockBudgetSummaries,
  operationalAlerts: [
    {
      id: "alert-blocked-plumbing",
      level: "warning",
      title: "Bloqueo crítico en fontanería",
      description: "La obra de Calle Mayor 18 necesita validación técnica hoy.",
      relatedProjectId: "project_obra_centro",
    },
    {
      id: "alert-client-approval",
      level: "info",
      title: "Aprobación pendiente del cliente",
      description: "Hay un extra de carpintería esperando confirmación.",
      relatedProjectId: "project_obra_centro",
    },
  ],
};
