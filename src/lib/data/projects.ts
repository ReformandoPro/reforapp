import { createProjectsRepository } from "@/lib/application";
import { isProjectStatus, type ProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import {
  isProjectTaskPriority,
  isProjectTaskStatus,
  type ProjectTaskPriority,
  type ProjectTaskStatus,
} from "@/lib/services/project-tasks";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";
import { isSupabaseConfigured } from "@/lib/env";
import type { ProjectCard } from "@/lib/types";

const projectsRepository = createProjectsRepository({ dataSource: "mock" });

const SUPABASE_PROJECTS_LOG_PREFIX = "[supabase-projects-first-read]";

type SupabaseProjectCardQueryRow = {
  id: string;
  name: string;
  status: string;
  client_id: string;
  client:
    | {
        id: string;
        display_name: string;
      }
    | {
        id: string;
        display_name: string;
      }[]
    | null;
};

export type ProjectDetail = {
  id: string;
  name: string;
  clientName: string;
  status: ProjectStatus;
  address: string;
  startDate: string | null;
  type: string;
};

export type ProjectPhase = {
  id: string;
  title: string;
  description: string | null;
  status: "planned" | "in_progress" | "done" | "blocked" | "cancelled";
  startDate: string | null;
  endDate: string | null;
  sortOrder: number;
};

type SupabaseProjectTaskPhaseQueryRow = {
  id: string;
  organization_id: string;
  project_id: string;
  title: string;
};

type SupabaseProjectTaskQueryRow = {
  id: string;
  organization_id: string;
  project_id: string;
  phase_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  phase:
    | SupabaseProjectTaskPhaseQueryRow
    | SupabaseProjectTaskPhaseQueryRow[]
    | null;
};

export type ProjectTask = {
  id: string;
  phaseId: string | null;
  phaseTitle: string | null;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  dueDate: string | null;
};

export type ProjectTaskGroups = Map<string | null, ProjectTask[]>;

export type ProjectTaskBoardColumn = {
  status: ProjectTaskStatus;
  tasks: ProjectTask[];
};

const PROJECT_TASK_BOARD_STATUS_ORDER: readonly ProjectTaskStatus[] = [
  "pending",
  "in_progress",
  "blocked",
  "done",
];

function normalizeJoinedClient(
  client: SupabaseProjectCardQueryRow["client"]
): { id: string; display_name: string } | null {
  if (Array.isArray(client)) {
    return client[0] ?? null;
  }

  return client;
}

function getMockProjectCardsFallback(): ProjectCard[] {
  return projectsRepository.getProjectCards();
}

function logProjectsReadFailure(reason: string): void {
  console.error(SUPABASE_PROJECTS_LOG_PREFIX, { reason });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isIsoDateTime(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function normalizeJoinedTaskPhase(
  phase: SupabaseProjectTaskQueryRow["phase"]
): SupabaseProjectTaskPhaseQueryRow | null {
  if (Array.isArray(phase)) return phase[0] ?? null;
  return phase;
}

function mapSupabaseProjectTaskRow(
  row: SupabaseProjectTaskQueryRow,
  projectId: string,
  organizationId: string
): ProjectTask {
  const title = typeof row.title === "string" ? row.title.trim() : "";

  if (
    !isNonEmptyString(row.id) ||
    !title ||
    row.project_id !== projectId ||
    row.organization_id !== organizationId ||
    (row.description !== null && typeof row.description !== "string") ||
    (row.phase_id !== null && !isNonEmptyString(row.phase_id)) ||
    (row.due_date !== null &&
      (typeof row.due_date !== "string" || !isIsoDate(row.due_date))) ||
    !isNonEmptyString(row.created_at) ||
    !isIsoDateTime(row.created_at) ||
    !isProjectTaskStatus(row.status) ||
    !isProjectTaskPriority(row.priority)
  ) {
    throw new Error("Invalid project task row");
  }

  const phase = normalizeJoinedTaskPhase(row.phase);
  if (
    row.phase_id !== null &&
    (!phase ||
      phase.id !== row.phase_id ||
      phase.project_id !== projectId ||
      phase.organization_id !== organizationId ||
      !isNonEmptyString(phase.title))
  ) {
    throw new Error("Invalid project task phase relationship");
  }

  if (row.phase_id === null && phase !== null) {
    throw new Error("Invalid unphased project task row");
  }

  return {
    id: row.id,
    phaseId: row.phase_id,
    phaseTitle: phase?.title.trim() ?? null,
    title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
  };
}

export function groupProjectTasksByPhase(
  tasks: ProjectTask[]
): ProjectTaskGroups {
  const groups: ProjectTaskGroups = new Map();

  for (const task of tasks) {
    const group = groups.get(task.phaseId);
    if (group) group.push(task);
    else groups.set(task.phaseId, [task]);
  }

  return groups;
}

export function groupProjectTasksByStatus(
  tasks: ProjectTask[]
): ProjectTaskBoardColumn[] {
  const tasksByStatus = new Map<ProjectTaskStatus, ProjectTask[]>(
    PROJECT_TASK_BOARD_STATUS_ORDER.map((status) => [status, []])
  );

  for (const task of tasks) {
    tasksByStatus.get(task.status)?.push(task);
  }

  return PROJECT_TASK_BOARD_STATUS_ORDER.map((status) => ({
    status,
    tasks: tasksByStatus.get(status) ?? [],
  }));
}

export function mapSupabaseProjectRowToProjectCard(
  row: SupabaseProjectCardQueryRow
): ProjectCard {
  const client = normalizeJoinedClient(row.client);

  if (!client?.display_name) {
    throw new Error(`Missing client display name for project ${row.id}`);
  }

  if (!isProjectStatus(row.status)) {
    throw new Error(`Invalid project status: ${row.status}`);
  }

  return {
    id: row.id,
    name: row.name,
    clientName: client.display_name,
    status: row.status,
    delayedTasksCount: 0,
    blockedTasksCount: 0,
    pendingApprovalsCount: 0,
  };
}

export async function getProjectsPageCards(): Promise<ProjectCard[]> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      logProjectsReadFailure("Supabase is not configured in production");
      throw new Error("Unable to load projects from Supabase");
    }

    return getMockProjectCardsFallback();
  }

  const context = await getOrganizationContextForRequest();

  if (!context.ok) {
    logProjectsReadFailure(`organization context unavailable: ${context.reason}`);
    throw new Error("Unable to load projects for the active organization");
  }

  try {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("projects")
      .select(
        `
          id,
          name,
          status,
          client_id,
          client:clients (
            id,
            display_name
          )
        `
      )
      .eq("organization_id", context.organizationId)
      .order("updated_at", { ascending: false });

    if (error) {
      logProjectsReadFailure("query failed");
      throw new Error("Unable to load projects from Supabase");
    }

    return (data ?? []).map((row) =>
      mapSupabaseProjectRowToProjectCard(row as unknown as SupabaseProjectCardQueryRow)
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unable to load projects from Supabase") {
      throw error;
    }

    logProjectsReadFailure("query or mapping failed");
    throw new Error("Unable to load projects from Supabase");
  }
}

export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      logProjectsReadFailure("Supabase is not configured in production");
      throw new Error("Unable to load project detail from Supabase");
    }

    const project = projectsRepository.getProjectOverview(projectId);
    return project
      ? {
          id: project.id,
          name: project.name,
          clientName: project.clientName,
          status: project.status,
          address: "",
          startDate: "",
          type: "",
        }
      : null;
  }

  const context = await getOrganizationContextForRequest();
  if (!context.ok) {
    logProjectsReadFailure(`organization context unavailable: ${context.reason}`);
    throw new Error("Unable to load project detail for the active organization");
  }

  try {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("projects")
      .select("id, name, status, address, start_date, type, client_name, client:clients (display_name)")
      .eq("id", projectId)
      .eq("organization_id", context.organizationId)
      .maybeSingle();

    if (error) {
      logProjectsReadFailure("project detail query failed");
      throw new Error("Unable to load project detail from Supabase");
    }
    if (!data) return null;

    const clientRow = Array.isArray(data.client) ? data.client[0] : data.client;
    if (!isProjectStatus(data.status)) {
      throw new Error("Unable to load project detail from Supabase");
    }

    return {
      id: data.id,
      name: data.name,
      clientName: clientRow?.display_name ?? data.client_name ?? "Sin cliente",
      status: data.status,
      address: data.address,
      startDate: data.start_date,
      type: data.type,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "Unable to load project detail from Supabase") throw error;
    logProjectsReadFailure("project detail mapping failed");
    throw new Error("Unable to load project detail from Supabase");
  }
}

export async function getProjectPhasesForRequest(projectId: string): Promise<ProjectPhase[]> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      logProjectsReadFailure("Supabase is not configured in production");
      throw new Error("Unable to load project phases from Supabase");
    }

    return [];
  }

  const context = await getOrganizationContextForRequest();
  if (!context.ok) {
    logProjectsReadFailure(`organization context unavailable: ${context.reason}`);
    throw new Error("Unable to load project phases for the active organization");
  }

  try {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("project_phases")
      .select("id, title, description, status, start_date, end_date, sort_order")
      .eq("project_id", projectId)
      .eq("organization_id", context.organizationId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      logProjectsReadFailure("project phases query failed");
      throw new Error("Unable to load project phases from Supabase");
    }

    return (data ?? []).map((phase) => {
      if (
        !phase.id ||
        !phase.title ||
        !["planned", "in_progress", "done", "blocked", "cancelled"].includes(phase.status) ||
        typeof phase.sort_order !== "number"
      ) {
        throw new Error("Unable to load project phases from Supabase");
      }

      return {
        id: phase.id,
        title: phase.title,
        description: phase.description ?? null,
        status: phase.status,
        startDate: phase.start_date ?? null,
        endDate: phase.end_date ?? null,
        sortOrder: phase.sort_order,
      };
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unable to load project phases from Supabase") {
      throw error;
    }

    logProjectsReadFailure("project phases mapping failed");
    throw new Error("Unable to load project phases from Supabase");
  }
}

export async function getProjectTasksForRequest(projectId: string): Promise<ProjectTask[]> {
  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      logProjectsReadFailure("Supabase is not configured in production");
      throw new Error("Unable to load project tasks from Supabase");
    }

    return [];
  }

  const context = await getOrganizationContextForRequest();
  if (!context.ok) {
    logProjectsReadFailure(`organization context unavailable: ${context.reason}`);
    throw new Error("Unable to load project tasks for the active organization");
  }

  try {
    const client = await createServerSupabaseClient();
    const { data, error } = await client
      .from("project_tasks")
      .select(
        "id, organization_id, project_id, phase_id, title, description, status, priority, due_date, created_at, phase:project_phases(id, organization_id, project_id, title)"
      )
      .eq("project_id", projectId)
      .eq("organization_id", context.organizationId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      logProjectsReadFailure("project tasks query failed");
      throw new Error("Unable to load project tasks from Supabase");
    }

    return (data ?? []).map((task) =>
      mapSupabaseProjectTaskRow(
        task as unknown as SupabaseProjectTaskQueryRow,
        projectId,
        context.organizationId
      )
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Unable to load project tasks from Supabase"
    ) {
      throw error;
    }

    logProjectsReadFailure("project tasks mapping failed");
    throw new Error("Unable to load project tasks from Supabase");
  }
}
