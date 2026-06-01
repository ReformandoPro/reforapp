import type { DashboardSummary, OperationalAlertLevel } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { EmptyState } from "../ui/EmptyState";
import { ListItem } from "../ui/ListItem";
import { MetricCard } from "../ui/MetricCard";
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
  },
  {
    key: "delayedTasksCount",
    label: "Tareas retrasadas",
    helper: "Pendientes a replanificar",
    tone: "warning",
  },
  {
    key: "blockedTasksCount",
    label: "Bloqueos",
    helper: "Incidencias que frenan avance",
    tone: "danger",
  },
  {
    key: "pendingApprovalsCount",
    label: "Aprobaciones",
    helper: "Decisiones pendientes del equipo",
    tone: "info",
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

export function ReformistDashboardScreen({
  summary,
}: ReformistDashboardScreenProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-1 sm:px-6 xl:px-0">
      <Card className="overflow-hidden p-6 shadow-none sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <Badge tone="info" className="bg-[var(--primary-900)] text-[var(--primary-100)]">
              Dashboard operativo
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reformando.app
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
              Vista priorizada para controlar obras activas, tareas críticas,
              aprobaciones y presupuestos pendientes sin salir del contrato real
              del dashboard.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:max-w-[360px]">
            <Card className="bg-[var(--bg-base)] p-4 shadow-none">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                Presupuestos pendientes
              </p>
              <p className="mt-2 text-3xl font-semibold">{summary.pendingBudgetsCount}</p>
              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                Revisión comercial o envío pendiente.
              </p>
            </Card>
            <Card className="bg-[var(--bg-base)] p-4 shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-tertiary)]">
                    Incidencias abiertas
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{summary.openIncidentsCount}</p>
                </div>
                <Badge tone={summary.openIncidentsCount > 0 ? "danger" : "success"}>
                  {summary.openIncidentsCount > 0 ? "Atención" : "Al día"}
                </Badge>
              </div>
              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                Señales operativas que requieren seguimiento.
              </p>
            </Card>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={summary[metric.key]}
            description={metric.helper}
            tone={metric.tone}
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
        <Card className="p-6 shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Obras activas</h2>
              <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                Tarjetas resumidas con el contrato existente de proyecto.
              </p>
            </div>
            <Button variant="secondary" className="w-full sm:w-auto">Ver todas</Button>
          </div>

          {summary.activeProjects.length > 0 ? (
            <ul className="mt-5 space-y-3">
              {summary.activeProjects.map((project) => {
                const projectHealthProgress = getProjectHealthProgress(project);
                const projectHealthTone = mapProjectHealthTone(projectHealthProgress);

                return (
                  <li key={project.id}>
                    <Card className="bg-[var(--bg-base)] p-4 shadow-none">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-base font-semibold">{project.name}</p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Cliente: {project.clientName}
                          </p>
                        </div>
                        <Badge tone="info">{project.status}</Badge>
                      </div>

                      <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/40 p-4">
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
                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                            Retrasos
                          </p>
                          <p className="mt-1 text-lg font-semibold">{project.delayedTasksCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                            Bloqueos
                          </p>
                          <p className="mt-1 text-lg font-semibold">{project.blockedTasksCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                            Aprobaciones
                          </p>
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
                <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
                  Oportunidades comerciales pendientes de mover.
                </p>
              </div>
              <Badge tone="warning">{summary.pendingBudgetsCount}</Badge>
            </div>

            {summary.pendingBudgets.length > 0 ? (
              <ul className="mt-5 space-y-3">
                {summary.pendingBudgets.map((budget) => (
                  <li key={budget.id}>
                    <Card className="bg-[var(--bg-base)] p-4 shadow-none">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--text-primary)]">
                            {budget.projectId}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">
                            Venta prevista: {budget.salePrice.toLocaleString("es-ES")} €
                          </p>
                        </div>
                        <Badge tone="info">{budget.status}</Badge>
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
                <p className="mt-1 text-sm leading-5 text-[var(--text-secondary)]">
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
                      eyebrow={
                        alert.relatedProjectId
                          ? `Proyecto relacionado: ${alert.relatedProjectId}`
                          : undefined
                      }
                      trailing={<Badge tone={mapAlertTone(alert.level)}>{alert.level}</Badge>}
                      tone={mapAlertTone(alert.level)}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5">
                <EmptyState
                  title="Sin alertas operativas"
                  description="No hay alertas activas en el resumen actual."
                />
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
}
