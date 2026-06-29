"use client";

import { useMemo, useState } from "react";

import {
  PURCHASE_STATUSES,
  type PurchaseItemInput,
  type PurchaseStatus,
} from "@/lib/services/purchases";

type Props = {
  mode: "new" | "edit";
  initialTitle: string;
  initialSupplierName: string;
  initialStatus: PurchaseStatus;
  initialExpectedDate: string;
  initialReceivedDate: string;
  initialNotes: string;
  initialItems: PurchaseItemInput[];
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function PurchaseEditorClient({
  initialTitle,
  initialSupplierName,
  initialStatus,
  initialExpectedDate,
  initialReceivedDate,
  initialNotes,
  initialItems,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [supplierName, setSupplierName] = useState(initialSupplierName);
  const [status, setStatus] = useState<PurchaseStatus>(initialStatus);
  const [expectedDate, setExpectedDate] = useState(initialExpectedDate);
  const [receivedDate, setReceivedDate] = useState(initialReceivedDate);
  const [notes, setNotes] = useState(initialNotes);

  const [items, setItems] = useState<PurchaseItemInput[]>(
    initialItems.length > 0
      ? initialItems
      : [
          {
            description: "",
            quantity: 1,
            unit: "ud",
            unitPrice: 0,
            taxRate: 21,
            sortOrder: 1,
          },
        ]
  );

  const itemsJson = useMemo(() => JSON.stringify(items), [items]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="title">
            Título
          </label>
          <input
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            placeholder="Ej: Pedido azulejos baño"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="supplierName">
            Proveedor (opcional)
          </label>
          <input
            id="supplierName"
            name="supplierName"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            placeholder="Ej: Cerámicas López"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="status">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PurchaseStatus)}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {PURCHASE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="expectedDate">
            Fecha prevista (opcional)
          </label>
          <input
            id="expectedDate"
            name="expectedDate"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="receivedDate">
            Fecha recibida (opcional)
          </label>
          <input
            id="receivedDate"
            name="receivedDate"
            type="date"
            value={receivedDate}
            onChange={(e) => setReceivedDate(e.target.value)}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="notes">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
      </div>

      <input type="hidden" name="itemsJson" value={itemsJson} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Materiales</h2>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={() => {
              setItems((prev) => {
                const nextSort = (prev[prev.length - 1]?.sortOrder ?? prev.length) + 1;
                return [
                  ...prev,
                  {
                    description: "",
                    quantity: 1,
                    unit: "ud",
                    unitPrice: 0,
                    taxRate: 21,
                    sortOrder: nextSort,
                  },
                ];
              });
            }}
          >
            + Añadir línea
          </button>
        </div>

        <div className="grid gap-3">
          {items.map((item, idx) => (
            <div
              key={item.id ?? `new-${idx}`}
              className="rounded-xl border border-subtle bg-bg-raised p-4"
            >
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    Descripción
                  </label>
                  <input
                    value={item.description}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, description: e.target.value } : l))
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    placeholder="Ej: Azulejo 30x60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    Cant.
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.quantity}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((l, i) =>
                          i === idx
                            ? { ...l, quantity: clampNumber(Number(e.target.value), 0, 1_000_000) }
                            : l
                        )
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    Ud
                  </label>
                  <input
                    value={item.unit}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, unit: e.target.value } : l))
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    placeholder="ud"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    €/ud
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((l, i) =>
                          i === idx
                            ? { ...l, unitPrice: clampNumber(Number(e.target.value), 0, 1_000_000) }
                            : l
                        )
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    IVA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={item.taxRate}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((l, i) =>
                          i === idx
                            ? { ...l, taxRate: clampNumber(Number(e.target.value), 0, 100) }
                            : l
                        )
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </div>

                <div className="sm:col-span-1 flex items-end justify-end">
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    disabled={items.length <= 1}
                    title={items.length <= 1 ? "Debe existir al menos una línea" : "Eliminar línea"}
                    onClick={() => {
                      setItems((prev) => prev.filter((_, i) => i !== idx));
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
