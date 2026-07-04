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
  getProject(organizationId: string, projectId: string): Promise<Project | null>;
};

function normalizeClientName(row: ProjectRow): string | null {
  const normalized = Array.isArray(row.client) ? row.client[0] : row.client;
  return normalized?.display_name ?? row.client_name ?? null;
}

function normalizeProjectStatus(status: string): ProjectLifecycleStatus {
  if (status === "on_hold") return "paused";

  const allowed: ProjectLifecycleStatus[] = [
    "lead",
    "budgeting",
    "approved",
    "scheduled",
    "in_progress",
    "paused",
    "completed",
    "delivered",
    "closed",
    "cancelled",
  ];

  if (allowed.includes(status as ProjectLifecycleStatus)) {
    return status as ProjectLifecycleStatus;
  }

  throw new Error(`Unknown project status from Supabase: ${status}`);
}

function normalizeProjectProgress(progress: number | null): number {
  if (typeof progress !== "number" || !Number.isFinite(progress)) {
    throw new Error("Project progress from Supabase is missing or invalid");
  }

  return progress;
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
    async getProject(organizationId, projectId) {
      return (
        mockProjects.find(
          (project) => project.organizationId === organizationId && project.id === projectId
        ) ?? null
      );
    },
  };
}

export function createSupabaseProjectsReader(supabase: SupabaseClient): ProjectsReader {
  return {
    async listProjects(organizationId) {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, organization_id, client_id, name, status, address, type, progress, client_name, created_at, updated_at"
        )
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false, nullsFirst: false });

      if (error) {
        throw new Error(`Unable to read projects from Supabase: ${error.message}`);
      }

      return ((data ?? []) as ProjectRow[]).map(mapProjectRow);
    },
    async getProject(organizationId, projectId) {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, organization_id, client_id, name, status, address, type, progress, client_name, created_at, updated_at"
        )
        .eq("organization_id", organizationId)
        .eq("id", projectId)
        .maybeSingle();

      if (error) {
        throw new Error(`Unable to read project from Supabase: ${error.message}`);
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
