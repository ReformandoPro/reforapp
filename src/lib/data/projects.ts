import { createProjectsRepository } from "@/lib/application";
import { isProjectStatus } from "@/lib/domain/projects/status";
import { createOptionalSupabaseClient } from "@/lib/supabase/client";
import type { ProjectCard } from "@/lib/types";

const projectsRepository = createProjectsRepository({ dataSource: "mock" });

export type ProjectsPageCardsResult =
  | {
      ok: true;
      source: "supabase" | "mock";
      cards: ProjectCard[];
    }
  | {
      ok: false;
      source: "supabase";
      reason:
        | "missing_supabase_config"
        | "missing_organization_id"
        | "query_failed"
        | "invalid_status"
        | "mapping_failed"
        | "unexpected_error";
    };

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

function getMockProjectsPageCardsResult(): ProjectsPageCardsResult {
  return {
    ok: true,
    source: "mock",
    cards: getMockProjectCardsFallback(),
  };
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

export async function getProjectsPageCardsResult(): Promise<ProjectsPageCardsResult> {
  const client = createOptionalSupabaseClient();

  // If Supabase is not configured at all, mock mode is expected.
  if (!client) {
    return getMockProjectsPageCardsResult();
  }

  const organizationId = readProjectsOrganizationId();

  if (!organizationId) {
    warnProjectsFallback(`missing ${PROJECTS_ORGANIZATION_ENV}`);

    return {
      ok: false,
      source: "supabase",
      reason: "missing_organization_id",
    };
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
      warnProjectsFallback("query failed", error);

      return {
        ok: false,
        source: "supabase",
        reason: "query_failed",
      };
    }

    // No rows is a valid state. Do not fall back silently.
    if (!data) {
      return {
        ok: true,
        source: "supabase",
        cards: [],
      };
    }

    try {
      const cards = data.map((row) =>
        mapSupabaseProjectRowToProjectCard(
          row as unknown as SupabaseProjectCardQueryRow
        )
      );

      return {
        ok: true,
        source: "supabase",
        cards,
      };
    } catch (mappingError) {
      warnProjectsFallback("row mapping failed", mappingError);

      return {
        ok: false,
        source: "supabase",
        reason: "mapping_failed",
      };
    }
  } catch (error) {
    warnProjectsFallback("unexpected query error", error);

    return {
      ok: false,
      source: "supabase",
      reason: "unexpected_error",
    };
  }
}

export async function getProjectsPageCards(): Promise<ProjectCard[]> {
  const result = await getProjectsPageCardsResult();

  if (!result.ok) {
    // Caller should render an explicit error state.
    throw new Error(`ProjectsPageCardsError:${result.reason}`);
  }

  return result.cards;
}
