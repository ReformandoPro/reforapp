import type { BudgetView } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type BudgetSummaryScreenProps = {
  budget: BudgetView;
};

export function BudgetSummaryScreen({ budget }: BudgetSummaryScreenProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Presupuesto</p>
          <h2 className="text-lg font-semibold text-slate-900">{budget.title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Margen objetivo: {(budget.internal.targetMarginRate * 100).toFixed(0)}%
          </p>
        </div>
        <Badge tone="success">{budget.status}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Coste estimado</p>
          <p className="mt-2 text-xl font-semibold">
            {budget.internal.estimatedCost.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Venta prevista</p>
          <p className="mt-2 text-xl font-semibold">
            {budget.internal.salePrice.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">€/m²</p>
          <p className="mt-2 text-xl font-semibold">
            {(budget.internal.actualMarginRate * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Visible cliente</p>
          <p className="mt-2 text-xl font-semibold">
            {budget.client.clientVisibleTotal.toLocaleString("es-ES")} €
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-900">Vista interna</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Coste estimado: {budget.internal.estimatedCost.toLocaleString("es-ES")} €</li>
            <li>Venta: {budget.internal.salePrice.toLocaleString("es-ES")} €</li>
            <li>Contingencia: {budget.internal.contingencyAmount.toLocaleString("es-ES")} €</li>
          </ul>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-900">Vista cliente</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Total visible: {budget.client.clientVisibleTotal.toLocaleString("es-ES")} €</li>
            <li>Estado mostrado: {budget.client.statusLabel}</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {budget.alerts.map((alert) => (
          <div key={alert.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-900">Alerta de presupuesto</span>
              <Badge tone={alert.level === "danger" ? "danger" : alert.level === "warning" ? "warning" : "info"}>
                {alert.level}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
