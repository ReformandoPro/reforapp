import { mockProjects } from "@/lib/mock/reformando";
import type { DetailState, ListState, Project } from "@/lib/types/reformando";

type ProjectRow = {
  id: string;
  organization_id: string;
  client_id: string | null;
  name: string;
  status: Project["status"];
  address: string | null;
  type: string | null;
  progress: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  client?: { display_name: string } | { display_name: string }[] | null;
};

export type ProjectsReader = {
  listProjects(organizationId: string): Promise<Project[]>;
  getProject(organizationId: string, projectId: string): Promise<Project | null>;
};

function normalizeClientName(client: ProjectRow["client"]): string | null {
  const normalized = Array.isArray(client) ? client[0] : client;
  return normalized?.display_name ?? null;
}

export function mapProjectRow(row: ProjectRow): Project {
  return {
    id: row.id,
    organizationId: row.organization_id,
    clientId: row.client_id,
    name: row.name,
    status: row.status,
    address: row.address,
    type: row.type,
    progress: row.progress ?? 0,
    clientName: normalizeClientName(row.client),
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

export async function toProjectsListState(items: Project[]): Promise<ListState<Project>> {
  if (items.length === 0) return { status: "empty", items: [] };
  return { status: "ready", items };
}

export async function toProjectDetailState(item: Project | null): Promise<DetailState<Project>> {
  if (!item) return { status: "not_found" };
  return { status: "ready", item };
}
