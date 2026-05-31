import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getBudgetSummaries } from "@/lib/services/budgets";
import type { BudgetStatus } from "@/lib/domain/budgets/status";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const percentageFormatter = new Intl.NumberFormat("es-ES", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const statusLabels: Record<BudgetStatus, string> = {
  draft: "Borrador",
  sent: "Enviado",
  viewed: "Visto",
  change_requested: "Cambios solicitados",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Caducado",
  archived: "Archivado",
};

const statusTones: Record<
  BudgetStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  draft: "neutral",
  sent: "info",
  viewed: "info",
  change_requested: "warning",
  approved: "success",
  rejected: "danger",
  expired: "warning",
  archived: "neutral",
};

function formatBudgetTitle(id: string) {
  return id
    .replace(/^budget_/, "")
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.toUpperCase())
    .join(" · ");
}

export default function BudgetsPage() {
  const budgets = getBudgetSummaries();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Presupuestos
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              Listado de presupuestos en modo solo lectura para revisar importes,
              márgenes y estado actual.
            </p>
          </div>

          <Button disabled aria-disabled="true" variant="secondary">
            Nuevo presupuesto
          </Button>
        </div>
      </Card>

      {budgets.length === 0 ? (
        <EmptyState
          title="No hay presupuestos todavía"
          description="Cuando exista un presupuesto, aparecerá aquí para que puedas revisar importes, márgenes y estado."
        />
      ) : (
        <div className="grid gap-4">
          {budgets.map((budget) => (
            <Card
              key={budget.id}
              className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] shadow-none"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    {formatBudgetTitle(budget.id)}
                  </p>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {budget.id}
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Obra: {budget.projectId}
                  </p>
                </div>
                <Badge tone={statusTones[budget.status]}>
                  {statusLabels[budget.status]}
                </Badge>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Coste estimado
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {currencyFormatter.format(budget.estimatedCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Precio de venta
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {currencyFormatter.format(budget.salePrice)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Margen objetivo
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {percentageFormatter.format(budget.targetMarginRate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Margen actual
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {percentageFormatter.format(budget.actualMarginRate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Total visible cliente
                  </p>
                  <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                    {currencyFormatter.format(budget.clientVisibleTotal)}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
