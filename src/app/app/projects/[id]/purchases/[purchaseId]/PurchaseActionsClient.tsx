"use client";

import type { PurchaseStatus } from "@/lib/services/purchases";
import { PURCHASE_STATUSES } from "@/lib/services/purchases";

import { createCostFromPurchaseAction, deletePurchaseAction, updatePurchaseStatusAction } from "./actions";

type Props = {
  projectId: string;
  purchaseId: string;
  currentStatus: PurchaseStatus;
};

export function PurchaseActionsClient({ projectId, purchaseId, currentStatus }: Props) {
  const statuses = PURCHASE_STATUSES.filter((s) => s.value !== currentStatus);

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {statuses.map((s) => (
          <form key={s.value} action={updatePurchaseStatusAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <input type="hidden" name="purchaseId" value={purchaseId} />
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

      <form action={createCostFromPurchaseAction}>
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="purchaseId" value={purchaseId} />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Crear coste desde pedido
        </button>
      </form>

      <form
        action={deletePurchaseAction}
        onSubmit={(e) => {
          const ok = confirm(
            "¿Eliminar pedido? Esta acción no se puede deshacer y borrará también sus líneas."
          );
          if (!ok) e.preventDefault();
        }}
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="purchaseId" value={purchaseId} />
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-rose-700 hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Eliminar pedido
        </button>
      </form>
    </div>
  );
}
