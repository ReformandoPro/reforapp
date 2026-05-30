import type { DashboardSummary } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type ReformistDashboardScreenProps = {
  summary: DashboardSummary;
};

const metrics = [
  {
    key: "activeProjectsCount",
    label: "Obras activas",
  },
  {
    key: "delayedTasksCount",
    label: "Tareas retrasadas",
  },
  {
    key: "blockedTasksCount",
    label: "Bloqueos",
  },
  {
    key: "pendingApprovalsCount",
    label: "Aprobaciones pendientes",
  },
] as const;

export function ReformistDashboardScreen({
  summary,
}: ReformistDashboardScreenProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Dashboard del reformista</h2>
            <p className="mt-1 text-sm text-slate-600">
              Vista temporal para priorizar obras, bloqueos y decisiones.
            </p>
          </div>
          <Badge tone="warning">Mock temporal</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.key}
              className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200"
            >
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {summary[metric.key]}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-base font-semibold">Presupuestos que requieren acción</h3>
        <ul className="mt-4 space-y-3">
          {summary.budgetsRequiringAction.map((budget) => (
            <li key={budget.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-900">{budget.projectId}</span>
                <Badge tone="info">{budget.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Venta prevista: {budget.salePrice.toLocaleString("es-ES")} €
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
