import type { BudgetSummary } from "@/lib/types";

import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type BudgetSummaryScreenProps = {
  budget: BudgetSummary;
};

export function BudgetSummaryScreen({ budget }: BudgetSummaryScreenProps) {
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">Presupuesto</p>
          <h2 className="text-lg font-semibold text-slate-900">{budget.projectId}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Margen objetivo: {(budget.targetMarginRate * 100).toFixed(0)}%
          </p>
        </div>
        <Badge tone="success">{budget.status}</Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Coste estimado</p>
          <p className="mt-2 text-xl font-semibold">
            {budget.estimatedCost.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Venta prevista</p>
          <p className="mt-2 text-xl font-semibold">
            {budget.salePrice.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">€/m²</p>
          <p className="mt-2 text-xl font-semibold">
            {budget.pricePerSquareMeter.toLocaleString("es-ES")} €
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Visible cliente</p>
          <p className="mt-2 text-xl font-semibold">
            {budget.clientVisibleTotal.toLocaleString("es-ES")} €
          </p>
        </div>
      </div>
    </Card>
  );
}
