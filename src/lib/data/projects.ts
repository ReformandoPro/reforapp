import { createProjectsRepository } from "@/lib/application";
import { isProjectStatus } from "@/lib/domain/projects/status";
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
