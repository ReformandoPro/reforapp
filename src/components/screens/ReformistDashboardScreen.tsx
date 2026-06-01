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

type SemanticTone = "info" | "success" | "warning" | "danger";

type KpiKey =
  | "activeProjectsCount"
  | "delayedTasksCount"
  | "blockedTasksCount"
  | "pendingApprovalsCount";

const kpis: Array<{
  key: KpiKey;
  label: string;
  helper: string;
  tone: Exclude<SemanticTone, "success">;
}> = [
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
];

function mapAlertTone(level: OperationalAlertLevel): Exclude<SemanticTone, "success"> {
  if (level === "danger") return "danger";
  if (level === "warning") return "warning";
  return "info";
}

function getProjectHealthProgress(project: DashboardSummary["activeProjects"][number]): number {
  const delayedPenalty = project.delayedTasksCount * 12;
  const blockedPenalty = project.blockedTasksCount * 18;

  return Math.max(0, Math.min(100, 100 - delayedPenalty - blockedPenalty));
}

function mapProjectHealthTone(progress: number): Exclude<SemanticTone, "info"> {
  if (progress < 50) return "danger";
  if (progress < 75) return "warning";
  return "success";
}

const ds = {
  bgBase: "bg-[var(--ds-bg-base,var(--bg-base))]",
  bgSurface: "bg-[var(--ds-bg-surface,var(--bg-surface))]",
  textPrimary: "text-[var(--ds-content-primary,var(--text-primary))]",
  textSecondary: "text-[var(--ds-content-secondary,var(--text-secondary))]",
  textTertiary: "text-[var(--ds-content-tertiary,var(--text-tertiary))]",
};

export function ReformistDashboardScreen({ summary }: ReformistDashboardScreenProps) {
  return (
    <section className={`${ds.bgBase} ${ds.textPrimary}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 xl:px-0">
        {/* HERO / TOP PANEL */}
        <Card variant="surface" padding="lg" shadow="none" className="overflow-hidden">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <Badge status="info" dot>
                Dashboard operativo
              </Badge>

              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Reformando.app
              </h1>
              <p className={`mt-3 max-w-xl text-sm leading-6 sm:text-base ${ds.textSecondary}`}>
                Control de obras activas, tareas críticas, aprobaciones y presupuestos pendientes.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[320px] lg:max-w-[380px]">
              <Card variant="raised" padding="md" shadow="none">
                <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${ds.textTertiary}`}>
                  Presupuestos pendientes
                </p>
                <p className="mt-2 text-3xl font-semibold">{summary.pendingBudgetsCount}</p>
                <p className={`mt-1 text-sm leading-5 ${ds.textSecondary}`}>
                  Revisión comercial o envío pendiente.
                </p>
              </Card>

              <Card variant="raised" padding="md" shadow="none">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${ds.textTertiary}`}>
                      Incidencias abiertas
                    </p>
                    <p className="mt-2 text-3xl font-semibold">{summary.openIncidentsCount}</p>
                  </div>
                  <Badge status={summary.openIncidentsCount > 0 ? "danger" : "success"}>
                    {summary.openIncidentsCount > 0 ? "Atención" : "Al día"}
                  </Badge>
                </div>
                <p className={`mt-1 text-sm leading-5 ${ds.textSecondary}`}>
                  Señales operativas que requieren seguimiento.
                </p>
              </Card>
            </div>
          </div>
        </Card>

        {/* KPI GRID (modern composition; avoids MetricCard accent bar) */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.key} variant="surface" padding="md" shadow="none">
              <div className="flex items-start justify-between gap-3">
                <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${ds.textSecondary}`}>
                  {kpi.label}
                </p>
                <Badge status={kpi.tone} pill={false}>
                  {kpi.tone}
                </Badge>
              </div>
              <p className="mt-3 text-4xl font-semibold tracking-tight">
                {summary[kpi.key]}
              </p>
              <p className={`mt-2 text-sm leading-5 ${ds.textSecondary}`}>{kpi.helper}</p>
            </Card>
          ))}
        </div>

        {/* MAIN GRID */}
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] xl:items-start">
          <Card variant="surface" padding="lg" shadow="none">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Obras activas</h2>
                <p className={`mt-1 text-sm leading-5 ${ds.textSecondary}`}>
                  Tarjetas resumidas con el contrato existente de proyecto.
                </p>
              </div>
              <Button variant="secondary" className="w-full sm:w-auto">
                Ver todas
              </Button>
            </div>

            {summary.activeProjects.length > 0 ? (
              <ul className="mt-6 space-y-3">
                {summary.activeProjects.map((project) => {
                  const projectHealthProgress = getProjectHealthProgress(project);
                  const projectHealthTone = mapProjectHealthTone(projectHealthProgress);

                  return (
                    <li key={project.id}>
                      <Card variant="raised" padding="md" shadow="none">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-semibold">{project.name}</p>
                            <p className={`mt-1 text-sm ${ds.textSecondary}`}>
                              Cliente: {project.clientName}
                            </p>
                          </div>
                          <Badge status="info">{project.status}</Badge>
                        </div>

                        <div className={`mt-5 rounded-2xl border border-[var(--border-subtle)] ${ds.bgSurface} p-4`}>
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
                            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${ds.textTertiary}`}>
                              Retrasos
                            </p>
                            <p className="mt-1 text-lg font-semibold">{project.delayedTasksCount}</p>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${ds.textTertiary}`}>
                              Bloqueos
                            </p>
                            <p className="mt-1 text-lg font-semibold">{project.blockedTasksCount}</p>
                          </div>
                          <div>
                            <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${ds.textTertiary}`}>
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
              <div className="mt-6">
                <EmptyState
                  title="Sin obras activas"
                  description="Cuando el dashboard tenga obras en curso aparecerán aquí con su estado y contadores principales."
                />
              </div>
            )}
          </Card>

          <div className="flex flex-col gap-6">
            <Card variant="surface" padding="lg" shadow="none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Presupuestos pendientes</h2>
                  <p className={`mt-1 text-sm leading-5 ${ds.textSecondary}`}>
                    Oportunidades comerciales pendientes de mover.
                  </p>
                </div>
                <Badge status="warning">{summary.pendingBudgetsCount}</Badge>
              </div>

              {summary.pendingBudgets.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {summary.pendingBudgets.map((budget) => (
                    <li key={budget.id}>
                      <Card variant="raised" padding="md" shadow="none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold">{budget.projectId}</p>
                            <p className={`mt-1 text-sm ${ds.textSecondary}`}>
                              Venta prevista: {budget.salePrice.toLocaleString("es-ES")} €
                            </p>
                          </div>
                          <Badge status="info">{budget.status}</Badge>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="Sin presupuestos pendientes"
                    description="No hay presupuestos pendientes en el resumen actual del dashboard."
                  />
                </div>
              )}
            </Card>

            <Card variant="surface" padding="lg" shadow="none">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Alertas operativas</h2>
                  <p className={`mt-1 text-sm leading-5 ${ds.textSecondary}`}>
                    Alertas priorizadas con el contrato real del dashboard.
                  </p>
                </div>
                <Badge status={summary.operationalAlerts.length > 0 ? "danger" : "success"}>
                  {summary.operationalAlerts.length > 0 ? summary.operationalAlerts.length : "0"}
                </Badge>
              </div>

              {summary.operationalAlerts.length > 0 ? (
                <ul className="mt-6 space-y-3">
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
                        trailing={<Badge status={mapAlertTone(alert.level)}>{alert.level}</Badge>}
                        tone={mapAlertTone(alert.level)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6">
                  <EmptyState
                    title="Sin alertas operativas"
                    description="No hay alertas activas en el resumen actual."
                  />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
