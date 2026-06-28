"use client";

import type { BudgetStatus } from "@/lib/services/budgets-basic";
import { BUDGET_STATUSES } from "@/lib/services/budgets-basic";

import { deleteBudgetAction, updateBudgetStatusAction } from "./actions";

type Props = {
  projectId: string;
  budgetId: string;
  currentStatus: BudgetStatus;
};

export function BudgetActionsClient({ projectId, budgetId, currentStatus }: Props) {
  const statuses = BUDGET_STATUSES.filter((s) => s.value !== currentStatus);

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {statuses.map((s) => (
          <form key={s.value} action={updateBudgetStatusAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="budgetId" value={budgetId} />
            <input type="hidden" name="status" value={s.value} />
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Marcar como {s.label.toLowerCase()}
            </button>
          </form>
        ))}
      </div>

      <form
        action={deleteBudgetAction}
        onSubmit={(e) => {
          const ok = confirm(
            "¿Eliminar presupuesto? Esta acción no se puede deshacer y borrará también sus líneas."
          );
          if (!ok) e.preventDefault();
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="budgetId" value={budgetId} />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-rose-700 hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Eliminar presupuesto
        </button>
      </form>
    </div>
  );
}
