import type { Client, Project } from "@/lib/types/reformando";

import type { DashboardDataResult } from "./dashboard-metrics";

export type DashboardActivityItem = {
  id: string;
  occurredAt: string;
  label: string;
  description: string;
  href: string;
};

export type DashboardActivityResult =
  | { ok: true; items: DashboardActivityItem[] }
  | { ok: false; message: string };

function getActivityTimestamp(item: { updatedAt?: string | null; createdAt?: string | null }): string | null {
  return item.updatedAt ?? item.createdAt ?? null;
}

function getActivityVerb(item: { updatedAt?: string | null; createdAt?: string | null }): string {
  if (item.updatedAt && item.createdAt && item.updatedAt !== item.createdAt) {
    return "actualizada";
  }

  return "creada";
}

function projectActivity(project: Project): DashboardActivityItem | null {
  const occurredAt = getActivityTimestamp(project);
  if (!occurredAt) return null;

  return {
    id: `project-${project.id}`,
    occurredAt,
    label: `Obra ${getActivityVerb(project)}`,
    description: project.name,
    href: `/app/projects/${project.id}`,
  };
}

function clientActivity(client: Client): DashboardActivityItem | null {
  const occurredAt = getActivityTimestamp(client);
  if (!occurredAt) return null;

  return {
    id: `client-${client.id}`,
    occurredAt,
    label: `Cliente ${getActivityVerb(client)}`,
    description: client.displayName,
    href: `/app/clients/${client.id}`,
  };
}

export function buildDashboardActivity({
  projects,
  clients,
  limit = 5,
}: {
  projects: DashboardDataResult<Project[]>;
  clients: DashboardDataResult<Client[]>;
  limit?: number;
}): DashboardActivityResult {
  if (!projects.ok || !clients.ok) {
    return { ok: false, message: "Error leyendo actividad reciente" };
  }

  const items = [
    ...projects.data.map(projectActivity),
    ...clients.data.map(clientActivity),
  ]
    .filter((item): item is DashboardActivityItem => item !== null)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);

  return { ok: true, items };
}
