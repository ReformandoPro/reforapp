import type { Client, Project } from "@/lib/types/reformando";

export type DashboardDataResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type DashboardMetric =
  | { ok: true; value: number; helper: string }
  | { ok: false; value: "—"; helper: string };

export type DashboardMetrics = {
  activeProjectsCount: DashboardMetric;
  budgetingProjectsCount: DashboardMetric;
  clientsCount: DashboardMetric;
  averageProgress: DashboardMetric;
};

const activeProjectStatuses = new Set(["approved", "scheduled", "in_progress", "paused"]);

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function metricError(helper: string): DashboardMetric {
  return { ok: false, value: "—", helper };
}

export function calculateDashboardMetrics({
  projects,
  clients,
}: {
  projects: DashboardDataResult<Project[]>;
  clients: DashboardDataResult<Client[]>;
}): DashboardMetrics {
  const projectMetrics = projects.ok
    ? {
        activeProjectsCount: {
          ok: true as const,
          value: projects.data.filter((project) => activeProjectStatuses.has(project.status)).length,
          helper: "En producción o planificación",
        },
        budgetingProjectsCount: {
          ok: true as const,
          value: projects.data.filter((project) => project.status === "budgeting").length,
          helper: "Pendientes de cierre comercial",
        },
        averageProgress: {
          ok: true as const,
          value: average(projects.data.map((project) => project.progress)),
          helper: "Calculado con obras reales",
        },
      }
    : {
        activeProjectsCount: metricError("Error leyendo obras"),
        budgetingProjectsCount: metricError("Error leyendo obras"),
        averageProgress: metricError("Error leyendo obras"),
      };

  return {
    ...projectMetrics,
    clientsCount: clients.ok
      ? {
          ok: true,
          value: clients.data.length,
          helper: "Contactos con expediente",
        }
      : metricError("Error leyendo clientes"),
  };
}
