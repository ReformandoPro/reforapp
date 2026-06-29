"use client";

import { useMemo, useState } from "react";

import { BUDGET_STATUSES, type BudgetLineInput, type BudgetStatus } from "@/lib/services/budgets-basic";

type BudgetEditorClientProps = {
  mode: "new" | "edit";
  initialTitle: string;
  initialStatus: BudgetStatus;
  initialNotes: string;
  initialLines: BudgetLineInput[];
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

export function BudgetEditorClient({
  mode,
  initialTitle,
  initialStatus,
  initialNotes,
  initialLines,
}: BudgetEditorClientProps) {
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState<BudgetStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [lines, setLines] = useState<BudgetLineInput[]>(
    initialLines.length > 0
      ? initialLines
      : [
          {
            description: "",
            quantity: 1,
            unitPrice: 0,
            taxRate: 21,
            sortOrder: 1,
          },
        ]
  );

  const linesJson = useMemo(() => JSON.stringify(lines), [lines]);

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
            placeholder={mode === "new" ? "Presupuesto inicial" : "Título"}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="status">
            Estado
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as BudgetStatus)}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            {BUDGET_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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

      <input type="hidden" name="linesJson" value={linesJson} />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">Líneas</h2>
          <button
            type="button"
            className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            onClick={() => {
              setLines((prev) => {
                const nextSort = (prev[prev.length - 1]?.sortOrder ?? prev.length) + 1;
                return [
                  ...prev,
                  {
                    description: "",
                    quantity: 1,
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
          {lines.map((line, idx) => (
            <div
              key={line.id ?? `new-${idx}`}
              className="rounded-xl border border-subtle bg-bg-raised p-4"
            >
              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    Concepto
                  </label>
                  <input
                    value={line.description}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((l, i) => (i === idx ? { ...l, description: e.target.value } : l))
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    placeholder="Ej: Alicatado baño"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    Cant.
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) =>
                      setLines((prev) =>
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

                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.14em] text-content-tertiary">
                    €/ud
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) =>
                      setLines((prev) =>
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
                    value={line.taxRate}
                    onChange={(e) =>
                      setLines((prev) =>
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
                    disabled={lines.length <= 1}
                    title={lines.length <= 1 ? "Debe existir al menos una línea" : "Eliminar línea"}
                    onClick={() => {
                      setLines((prev) => prev.filter((_, i) => i !== idx));
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
