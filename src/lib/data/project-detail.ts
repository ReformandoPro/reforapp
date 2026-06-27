import { isProjectStatus } from "@/lib/domain/projects/status";
import { createOptionalSupabaseClient } from "@/lib/supabase/client";
import type { ProjectDetail } from "@/lib/types";

const PROJECTS_ORGANIZATION_ENV = "NEXT_PUBLIC_SUPABASE_ORGANIZATION_ID";
const PROJECTS_DEBUG_ENV = "NEXT_PUBLIC_SUPABASE_DEBUG";
const SUPABASE_PROJECTS_LOG_PREFIX = "[supabase-projects-first-read]";

export type ProjectDetailResult =
  | {
      ok: true;
      source: "supabase";
      project: ProjectDetail;
    }
  | {
      ok: true;
      source: "supabase";
      project: null;
    }
  | {
      ok: false;
      source: "supabase";
      reason:
        | "missing_supabase_config"
        | "missing_organization_id"
        | "query_failed"
        | "mapping_failed";
    };

type SupabaseProjectDetailQueryRow = {
  id: string;
  name: string;
  status: string;
  address: string | null;
  type: string | null;
  progress: number | null;
  updated_at: string | null;
  client:
    | {
        display_name: string;
      }
    | { display_name: string }[]
    | null;
};

function readProjectsOrganizationId(): string | null {
  const value = process.env[PROJECTS_ORGANIZATION_ENV]?.trim();

  return value && value.length > 0 ? value : null;
}

function shouldLog(): boolean {
  return process.env[PROJECTS_DEBUG_ENV] === "1";
}

function warn(reason: string, error?: unknown) {
  if (!shouldLog()) {
    return;
  }

  const message = `${SUPABASE_PROJECTS_LOG_PREFIX} ${reason}`;

  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
}

function normalizeJoinedClient(
  client: SupabaseProjectDetailQueryRow["client"]
): { display_name: string } | null {
  if (Array.isArray(client)) {
    return client[0] ?? null;
  }

  return client;
}

export async function getProjectDetailResult(
  projectId: string
): Promise<ProjectDetailResult> {
  const client = createOptionalSupabaseClient();

  if (!client) {
    return {
      ok: false,
      source: "supabase",
      reason: "missing_supabase_config",
    };
  }

  const organizationId = readProjectsOrganizationId();

  if (!organizationId) {
    warn(`missing ${PROJECTS_ORGANIZATION_ENV}`);

    return {
      ok: false,
      source: "supabase",
      reason: "missing_organization_id",
    };
  }

  const { data, error } = await client
    .from("projects")
    .select(
      `
        id,
        name,
        status,
        address,
        type,
        progress,
        updated_at,
        client:clients (
          display_name
        )
      `
    )
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    warn("detail query failed", error);
    return { ok: false, source: "supabase", reason: "query_failed" };
  }

  if (!data) {
    return { ok: true, source: "supabase", project: null };
  }

  try {
    const joinedClient = normalizeJoinedClient(
      (data as unknown as SupabaseProjectDetailQueryRow).client
    );

    if (!joinedClient?.display_name) {
      throw new Error("Missing client display_name");
    }

    const row = data as unknown as SupabaseProjectDetailQueryRow;

    if (!isProjectStatus(row.status)) {
      throw new Error(`Invalid project status: ${row.status}`);
    }

    return {
      ok: true,
      source: "supabase",
      project: {
        id: row.id,
        name: row.name,
        clientName: joinedClient.display_name,
        status: row.status,
        address: row.address,
        type: row.type,
        progress: row.progress,
        updatedAt: row.updated_at,
      },
    };
  } catch (mappingError) {
    warn("detail mapping failed", mappingError);
    return { ok: false, source: "supabase", reason: "mapping_failed" };
  }
}

