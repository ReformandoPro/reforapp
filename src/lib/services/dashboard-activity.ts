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

function projectCreatedActivity(project: Project): DashboardActivityItem | null {
  if (!project.createdAt) return null;

  return {
    id: `project-${project.id}`,
    occurredAt: project.createdAt,
    label: "Obra creada",
    description: project.name,
    href: `/app/projects/${project.id}`,
  };
}

function clientCreatedActivity(client: Client): DashboardActivityItem | null {
  if (!client.createdAt) return null;

  return {
    id: `client-${client.id}`,
    occurredAt: client.createdAt,
    label: "Cliente creado",
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
  if (!projects.ok && !clients.ok) {
    return { ok: false, message: "No se pudo cargar la actividad reciente." };
  }

  const items = [
    ...(projects.ok ? projects.data.map(projectCreatedActivity) : []),
    ...(clients.ok ? clients.data.map(clientCreatedActivity) : []),
  ]
    .filter((item): item is DashboardActivityItem => item !== null)
    .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
    .slice(0, limit);

  return { ok: true, items };
}
