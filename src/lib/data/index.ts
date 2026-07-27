import {
  createBudgetsRepository,
  createDashboardRepository,
  createProjectsRepository,
  createTasksRepository,
} from "@/lib/application";
import type { TaskStatus } from "@/lib/domain/tasks/status";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  BudgetSummary,
  BudgetView,
  DashboardSummary,
  ProjectCard,
  ProjectOverview,
  ProjectTaskListItem,
} from "@/lib/types";
import { getProjectsPageCards } from "./projects";
export { getProjectDetail } from "./projects";
export { getProjectPhasesForRequest } from "./projects";
export {
  getProjectTasksForRequest,
  groupProjectTasksByPhase,
  groupProjectTasksByStatus,
} from "./projects";

export type DataAdapterMode =
  | "mock"
  | "supabase-configured-mock-fallback";

const dashboardRepository = createDashboardRepository({ dataSource: "mock" });
const projectsRepository = createProjectsRepository({ dataSource: "mock" });
const budgetsRepository = createBudgetsRepository({ dataSource: "mock" });
const tasksRepository = createTasksRepository({ dataSource: "mock" });

export function getDataAdapterMode(): DataAdapterMode {
  return isSupabaseConfigured() ? "supabase-configured-mock-fallback" : "mock";
}

export function getDashboardSummary(): DashboardSummary {
  return dashboardRepository.getDashboardSummary();
}

export function getProjects(): ProjectCard[] {
  return projectsRepository.getProjectCards();
}

export async function getProjectsPageCardsFromSupabaseOrMock(): Promise<
  ProjectCard[]
> {
  return getProjectsPageCards();
}

export function getProjectById(projectId: string): ProjectOverview | undefined {
  return projectsRepository.getProjectOverview(projectId);
}

export function getProjectTasks(projectId: string): ProjectTaskListItem[] {
  return tasksRepository.getProjectTasks(projectId);
}

export function updateProjectTaskStatus(
  taskId: string,
  status: TaskStatus
): ProjectTaskListItem | null {
  return tasksRepository.updateTaskStatus(taskId, status);
}

export function getBudgets(): BudgetSummary[] {
  return budgetsRepository.getBudgetSummaries();
}

export function getBudgetById(budgetId: string): BudgetView | undefined {
  return budgetsRepository.getBudgetSummary(budgetId);
}
