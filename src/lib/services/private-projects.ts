import type { SupabaseClient } from "@supabase/supabase-js";

import { mockProjects } from "@/lib/mock/reformando";
import type { DetailState, ListState, Project, ProjectLifecycleStatus } from "@/lib/types/reformando";

type ProjectRow = {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  status: string;
  address: string | null;
  type: string | null;
  progress: number | null;
  client_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  client?: { display_name: string } | { display_name: string }[] | null;
};

export type ProjectsReader = {
  listProjects(organizationId: string): Promise<Project[]>;
  listProjectsByClient(organizationId: string, clientId: string): Promise<Project[]>;
  getProject(organizationId: string, projectId: string): Promise<Project | null>;
};

function normalizeClientName(row: ProjectRow): string | null {
  const normalized = Array.isArray(row.client) ? row.client[0] : row.client;
  return normalized?.display_name ?? row.client_name ?? null;
}

const projectStatusMap: Record<string, ProjectLifecycleStatus> = {
  lead: "lead",
  draft: "lead",
  pending: "budgeting",
  budgeting: "budgeting",
  approved: "approved",
  scheduled: "scheduled",
  active: "in_progress",
  open: "in_progress",
  in_progress: "in_progress",
  on_hold: "paused",
  paused: "paused",
  completed: "completed",
  delivered: "delivered",
  closed: "closed",
  cancelled: "cancelled",
};

export function normalizeProjectStatus(status: string | null): ProjectLifecycleStatus {
  if (!status) return "lead";

  return projectStatusMap[status] ?? "lead";
}

export function normalizeProjectProgress(progress: number | null): number {
  if (typeof progress !== "number" || !Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    name: row.name,
    status: normalizeProjectStatus(row.status),
    address: row.address,
    type: row.type,
    progress: normalizeProjectProgress(row.progress),
    clientName: normalizeClientName(row),
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
}

export function createMockProjectsReader(): ProjectsReader {
  // TODO: replace mock adapter with Supabase query when staging data is ready.
  return {
    async listProjects(organizationId) {
      return mockProjects.filter((project) => project.organizationId === organizationId);
    },
    async listProjectsByClient(organizationId, clientId) {
      return mockProjects.filter(
        (project) => project.organizationId === organizationId && project.clientId === clientId
      );
    },
    async getProject(organizationId, projectId) {
      return (
        mockProjects.find(
          (project) => project.organizationId === organizationId && project.id === projectId
        ) ?? null
      );
    },
  };
}

const PRIVATE_PROJECTS_LOG_PREFIX = "[private-projects]";

const projectSelect =
  "id, organization_id, client_id, name, status, address, type, progress, client_name, updated_at";

function logProjectsReadFailure(operation: "list" | "list_by_client" | "detail", code?: string): void {
  console.error(PRIVATE_PROJECTS_LOG_PREFIX, {
    operation,
    code: code ?? "unknown",
  });
}

export function createSupabaseProjectsReader(supabase: SupabaseClient): ProjectsReader {
  return {
    async listProjects(organizationId) {
      const { data, error } = await supabase
        .from("projects")
        .select(projectSelect)
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });

      if (error) {
        logProjectsReadFailure("list", error.code);
        throw new Error("Unable to read projects from Supabase");
      }

      return ((data ?? []) as ProjectRow[]).map(mapProjectRow);
    },
    async listProjectsByClient(organizationId, clientId) {
      const { data, error } = await supabase
        .from("projects")
        .select(projectSelect)
        .eq("organization_id", organizationId)
        .eq("client_id", clientId)
        .order("updated_at", { ascending: false });

      if (error) {
        logProjectsReadFailure("list_by_client", error.code);
        throw new Error("Unable to read client projects from Supabase");
      }

      return ((data ?? []) as ProjectRow[]).map(mapProjectRow);
    },
    async getProject(organizationId, projectId) {
      const { data, error } = await supabase
        .from("projects")
        .select(projectSelect)
        .eq("organization_id", organizationId)
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        logProjectsReadFailure("detail", error.code);
        throw new Error("Unable to read project from Supabase");
      }

      if (!data) {
        return null;
      }

      return mapProjectRow(data as ProjectRow);
    },
  };
}

export async function toProjectsListState(items: Project[]): Promise<ListState<Project>> {
  if (items.length === 0) return { status: "empty", items: [] };
  return { status: "ready", items };
}

export async function toProjectDetailState(item: Project | null): Promise<DetailState<Project>> {
  if (!item) return { status: "not_found" };
  return { status: "ready", item };
}
