import { createProjectsRepository } from "@/lib/application";
import { isProjectStatus, type ProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
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
  startDate: string;
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
      .select("id, name, status, address, start_date, type, client:clients (display_name)")
      .eq("id", projectId)
      .eq("organization_id", context.organizationId)
      .maybeSingle();

    if (error) {
      logProjectsReadFailure("project detail query failed");
      throw new Error("Unable to load project detail from Supabase");
    }
    if (!data) return null;

    const clientRow = Array.isArray(data.client) ? data.client[0] : data.client;
    if (!clientRow?.display_name || !isProjectStatus(data.status)) {
      throw new Error("Unable to load project detail from Supabase");
    }

    return {
      id: data.id,
      name: data.name,
      clientName: clientRow.display_name,
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
