import { createProjectsRepository } from "@/lib/application";
import { isProjectStatus } from "@/lib/domain/projects/status";
import { createOptionalSupabaseClient } from "@/lib/supabase/client";
import type { ProjectCard } from "@/lib/types";

const projectsRepository = createProjectsRepository({ dataSource: "mock" });

const PROJECTS_ORGANIZATION_ENV = "NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID";
const PROJECTS_DEBUG_ENV = "NEXT_PUBLIC_SUPABASE_DEBUG";
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

function readProjectsOrganizationId(): string | null {
  const value = process.env[PROJECTS_ORGANIZATION_ENV]?.trim();

  return value && value.length > 0 ? value : null;
}

function shouldLogProjectsFallback(): boolean {
  return process.env[PROJECTS_DEBUG_ENV] === "1";
}

function warnProjectsFallback(reason: string, error?: unknown) {
  if (!shouldLogProjectsFallback()) {
    return;
  }

  const message = `${SUPABASE_PROJECTS_LOG_PREFIX} ${reason}`;

  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
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
  const client = createOptionalSupabaseClient();

  if (!client) {
    return getMockProjectCardsFallback();
  }

  const organizationId = readProjectsOrganizationId();

  if (!organizationId) {
    warnProjectsFallback(
      `missing ${PROJECTS_ORGANIZATION_ENV}; using mock fallback`
    );
    return getMockProjectCardsFallback();
  }

  try {
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
      .eq("organization_id", organizationId)
      .order("updated_at", { ascending: false });

    if (error) {
      warnProjectsFallback("query failed; using mock fallback", error);
      return getMockProjectCardsFallback();
    }

    if (!data || data.length === 0) {
      warnProjectsFallback("query returned no rows; using mock fallback");
      return getMockProjectCardsFallback();
    }

    return data.map((row) =>
      mapSupabaseProjectRowToProjectCard(row as unknown as SupabaseProjectCardQueryRow)
    );
  } catch (error) {
    warnProjectsFallback("unexpected query error; using mock fallback", error);
    return getMockProjectCardsFallback();
  }
}
