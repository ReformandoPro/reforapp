import type { BudgetView } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type BudgetSummaryScreenProps = {
  budget: BudgetView;
};

export function BudgetSummaryScreen({ budget }: BudgetSummaryScreenProps) {
  return (
    <Card padding="lg" shadow="none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-overline text-content-tertiary">Presupuesto</p>
          <h2 className="text-h3 text-content-primary">{budget.title}</h2>
          <p className="mt-1 text-body text-content-secondary">
            Margen objetivo: {(budget.internal.targetMarginRate * 100).toFixed(0)}%
          </p>
        </div>
        <Badge tone="success">{budget.status}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Coste estimado</p>
          <p className="mt-2 text-h2 text-content-primary">
            {budget.internal.estimatedCost.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Venta prevista</p>
          <p className="mt-2 text-h2 text-content-primary">
            {budget.internal.salePrice.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Margen actual</p>
          <p className="mt-2 text-h2 text-content-primary">
            {(budget.internal.actualMarginRate * 100).toFixed(0)}%
          </p>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-label text-content-tertiary">Visible cliente</p>
          <p className="mt-2 text-h2 text-content-primary">
            {budget.client.clientVisibleTotal.toLocaleString("es-ES")} €
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-h3 text-content-primary">Vista interna</p>
          <ul className="mt-3 space-y-2 text-body text-content-secondary">
            <li>Coste estimado: {budget.internal.estimatedCost.toLocaleString("es-ES")} €</li>
            <li>Venta: {budget.internal.salePrice.toLocaleString("es-ES")} €</li>
            <li>Contingencia: {budget.internal.contingencyAmount.toLocaleString("es-ES")} €</li>
          </ul>
        </div>
        <div className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
          <p className="text-h3 text-content-primary">Vista cliente</p>
          <ul className="mt-3 space-y-2 text-body text-content-secondary">
            <li>Total visible: {budget.client.clientVisibleTotal.toLocaleString("es-ES")} €</li>
            <li>Estado mostrado: {budget.client.statusLabel}</li>
          </ul>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {budget.alerts.map((alert) => (
          <div key={alert.id} className="rounded-lg border border-subtle bg-bg-surface-raised p-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-body font-medium text-content-primary">Alerta de presupuesto</span>
              <Badge tone={alert.level === "danger" ? "danger" : alert.level === "warning" ? "warning" : "info"}>
                {alert.level}
              </Badge>
            </div>
            <p className="mt-2 text-body text-content-secondary">{alert.message}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
