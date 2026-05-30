import type { BudgetSummary } from "./budget";
import type { ProjectCard } from "./project";

export type OperationalAlertLevel = "info" | "warning" | "danger";

export type OperationalAlert = {
  id: string;
  level: OperationalAlertLevel;
  title: string;
  description: string;
  relatedProjectId?: string;
};

export type DashboardSummary = {
  activeProjectsCount: number;
  delayedTasksCount: number;
  blockedTasksCount: number;
  pendingApprovalsCount: number;
  pendingBudgetsCount: number;
  openIncidentsCount: number;
  activeProjects: ProjectCard[];
  pendingBudgets: BudgetSummary[];
  operationalAlerts: OperationalAlert[];
};
