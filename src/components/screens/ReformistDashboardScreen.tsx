import type { DashboardSummary, OperationalAlertLevel } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ListItem } from "../ui/ListItem";
import { ProgressBar } from "../ui/ProgressBar";

type ReformistDashboardScreenProps = {
  summary: DashboardSummary;
};

const metrics = [
  {
    key: "activeProjectsCount",
    label: "Obras activas",
    helper: "Seguimiento operativo en curso",
    tone: "info",
    badgeLabel: "EN CURSO",
  },
  {
    key: "delayedTasksCount",
    label: "Tareas retrasadas",
    helper: "Pendientes a replanificar",
    tone: "warning",
    badgeLabel: "AVISO",
  },
  {
    key: "blockedTasksCount",
    label: "Bloqueos",
    helper: "Incidencias que frenan avance",
    tone: "danger",
    badgeLabel: "BLOQUEO",
  },
  {
    key: "pendingApprovalsCount",
    label: "Aprobaciones",
    helper: "Decisiones pendientes del equipo",
    tone: "info",
    badgeLabel: "INFO",
  },
] as const;

function mapAlertTone(level: OperationalAlertLevel): "info" | "warning" | "danger" {
  if (level === "danger") {
    return "danger";
  }

  if (level === "warning") {
    return "warning";
  }

  return "info";
}

function mapAlertLabel(level: OperationalAlertLevel): string {
  if (level === "danger") {
    return "BLOQUEO";
  }

  if (level === "warning") {
    return "AVISO";
  }

  return "INFO";
}

function formatStatusLabel(status: unknown): string {
  const normalized = String(status).trim().toLowerCase();

  const explicit: Record<string, string> = {
    in_progress: "EN CURSO",
    inprogress: "EN CURSO",
    "in-progress": "EN CURSO",
    sent: "ENVIADO",
    warning: "AVISO",
    danger: "BLOQUEO",
    info: "INFO",
    success: "OK",
    draft: "BORRADOR",
    approved: "APROBADO",
    pending: "PENDIENTE",
  };

  const mapped = explicit[normalized];
  if (mapped) {
    return mapped;
  }

  return normalized.replace(/[_-]+/g, " ").toUpperCase();
}

function getProjectHealthProgress(project: DashboardSummary["activeProjects"][number]): number {
  const delayedPenalty = project.delayedTasksCount * 12;
  const blockedPenalty = project.blockedTasksCount * 18;

  return Math.max(0, Math.min(100, 100 - delayedPenalty - blockedPenalty));
}

function mapProjectHealthTone(progress: number): "success" | "warning" | "danger" {
  if (progress < 50) {
    return "danger";
  }

  if (progress < 75) {
    return "warning";
  }

  return "success";
}

export function ReformistDashboardScreen({ summary }: ReformistDashboardScreenProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-1 sm:px-6 xl:px-0">
      <Card variant="raised" padding="lg" shadow="none" className="overflow-hidden">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Badge status="info">Dashboard operativo</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Reformando.app</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-content-secondary sm:text-base">
              Vista priorizada para controlar obras activas, tareas críticas, aprobaciones y presupuestos pendientes sin
              salir del contrato real del dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:max-w-[360px]">
            <Card variant="surface" padding="sm" shadow="none" className="bg-bg-base">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-content-tertiary">
                Presupuestos pendientes
              </p>
              <p className="mt-2 text-3xl font-semibold">{summary.pendingBudgetsCount}</p>
              <p className="mt-1 text-sm leading-5 text-content-secondary">Revisión comercial o envío pendiente.</p>
            </Card>
            <Card variant="surface" padding="sm" shadow="none" className="bg-bg-base">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-content-tertiary">
                    Incidencias abiertas
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{summary.openIncidentsCount}</p>
                </div>
                <Badge tone={summary.openIncidentsCount > 0 ? "danger" : "success"}>
                  {summary.openIncidentsCount > 0 ? "AVISO" : "AL DÍA"}
                </Badge>
              </div>
              <p className="mt-1 text-sm leading-5 text-content-secondary">
                Señales operativas que requieren seguimiento.
              </p>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.key} padding="md" shadow="none" className="bg-bg-surface">
            <div className="flex items-start justify-between gap-3">
              <p className="text-overline font-semibold uppercase tracking-wide text-content-secondary">
                {metric.label}
              </p>
              <Badge status={metric.tone}>{metric.badgeLabel}</Badge>
            </div>

            <p className="mt-3 font-num text-display leading-none">{summary[metric.key]}</p>
            <p className="mt-2 text-sm text-content-tertiary">{metric.helper}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
        <Card className="p-6 shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Obras activas</h2>
              <p className="mt-1 text-sm leading-5 text-content-secondary">
                Tarjetas resumidas con el contrato existente de proyecto.
              </p>
            </div>
            <Button variant="secondary" className="w-full sm:w-auto">
              Ver todas
            </Button>
          </div>

          {summary.activeProjects.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {summary.activeProjects.map((project) => {
                const projectHealthProgress = getProjectHealthProgress(project);
                const projectHealthTone = mapProjectHealthTone(projectHealthProgress);

                return (
                  <li key={project.id}>
                    <Card variant="surface" padding="sm" shadow="none" className="bg-bg-base">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold">{project.name}</p>
                          <p className="mt-1 text-sm text-content-secondary">Cliente: {project.clientName}</p>
                        </div>
                        <Badge tone="info">{formatStatusLabel(project.status)}</Badge>
                      </div>

                      <div className="mt-5 rounded-lg border border-subtle bg-bg-surface/40 p-4">
                        <ProgressBar
                          value={projectHealthProgress}
                          label="Salud operativa estimada"
                          helperText="Indicador visual readonly derivado de retrasos y bloqueos."
                          showValue
                          tone={projectHealthTone}
                        />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-content-tertiary">Retrasos</p>
                          <p className="mt-1 text-lg font-semibold">{project.delayedTasksCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-content-tertiary">Bloqueos</p>
                          <p className="mt-1 text-lg font-semibold">{project.blockedTasksCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-content-tertiary">Aprobaciones</p>
                          <p className="mt-1 text-lg font-semibold">{project.pendingApprovalsCount}</p>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Sin obras activas"
                description="Cuando el dashboard tenga obras en curso aparecerán aquí con su estado y contadores principales."
              />
            </div>
          )}
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="p-6 shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Presupuestos pendientes</h2>
                <p className="mt-1 text-sm leading-5 text-content-secondary">Oportunidades comerciales pendientes de mover.</p>
              </div>
              <Badge tone="warning">{summary.pendingBudgetsCount}</Badge>
            </div>

            {summary.pendingBudgets.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {summary.pendingBudgets.map((budget) => (
                  <li key={budget.id}>
                    <Card variant="surface" padding="sm" shadow="none" className="bg-bg-base">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-content-primary">{budget.projectId}</p>
                          <p className="mt-1 text-sm text-content-secondary">
                            Venta prevista: {budget.salePrice.toLocaleString("es-ES")} €
                          </p>
                        </div>
                        <Badge tone="info">{formatStatusLabel(budget.status)}</Badge>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="Sin presupuestos pendientes"
                  description="No hay presupuestos pendientes en el resumen actual del dashboard."
                />
              </div>
            )}
          </Card>

          <Card className="p-6 shadow-none">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Alertas operativas</h2>
                <p className="mt-1 text-sm leading-5 text-content-secondary">
                  Alertas priorizadas con el contrato real del dashboard.
                </p>
              </div>
              <Badge tone={summary.operationalAlerts.length > 0 ? "danger" : "success"}>
                {summary.operationalAlerts.length > 0 ? summary.operationalAlerts.length : "0"}
              </Badge>
            </div>

            {summary.operationalAlerts.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {summary.operationalAlerts.map((alert) => (
                  <li key={alert.id}>
                    <ListItem
                      title={alert.title}
                      description={alert.description}
                      eyebrow={alert.relatedProjectId ? `Proyecto relacionado: ${alert.relatedProjectId}` : undefined}
                      trailing={<Badge tone={mapAlertTone(alert.level)}>{mapAlertLabel(alert.level)}</Badge>}
                      tone={mapAlertTone(alert.level)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5">
                <EmptyState title="Sin alertas operativas" description="No hay alertas activas en el resumen actual." />
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
