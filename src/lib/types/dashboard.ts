import type { BudgetSummary } from "./budget";
import type { ProjectCard } from "./project";

export type DashboardSummary = {
  activeProjectsCount: number;
  delayedTasksCount: number;
  blockedTasksCount: number;
  pendingApprovalsCount: number;
  projects: ProjectCard[];
  budgetsRequiringAction: BudgetSummary[];
};
