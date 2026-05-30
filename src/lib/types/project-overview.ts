import type { ProjectStatus } from "@/lib/domain/projects/status";

export type ProjectOverviewSectionKey =
  | "tasks"
  | "incidents"
  | "materials"
  | "budget"
  | "documents";

export type ProjectOverviewSection = {
  key: ProjectOverviewSectionKey;
  label: string;
  enabled: boolean;
};

export type ProjectOverview = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  nextActions: string[];
  availableSections: ProjectOverviewSection[];
  delayedTasksCount: number;
  blockedTasksCount: number;
  pendingApprovalsCount: number;
  openIncidentsCount: number;
  pendingMaterialRequestsCount: number;
};
