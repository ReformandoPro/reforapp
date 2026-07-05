import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { BUDGET_STATUSES, formatMoneyEUR } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { getOrganizationById } from "@/lib/services/organizations";
import { readProjectBudgetDetail } from "@/lib/services/project-budgets";
import { createSupabaseProjectsReader } from "@/lib/services/private-projects";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { PrintActionsClient } from "./PrintActionsClient";

export const dynamic = "force-dynamic";

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatQty(value: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(value);
}

export default async function BudgetPrintPage({
  params,
}: {
  params: Promise<{ id: string; budgetId: string }>;
}) {
  const { id: projectId, budgetId } = await params;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Presupuesto</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">Inicia sesión para imprimir este presupuesto.</p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const orgResult = await getOrganizationById(supabase, ctx.organizationId);
  const organizationName = orgResult.ok ? orgResult.organization.name : null;

  const project = await createSupabaseProjectsReader(supabase).getProject(ctx.organizationId, projectId);
  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link href="/app/projects" className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary">
          ← Volver a obras
        </Link>
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado esta obra dentro de tu organización."
        />
      </section>
    );
  }

  const budgetResult = await readProjectBudgetDetail(supabase, ctx.organizationId, projectId, budgetId);
  if (!budgetResult.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState title="No pudimos cargar el presupuesto" description="Revisa tu conexión e inténtalo de nuevo." />
      </section>
    );
  }

  const budgetDetail = budgetResult.data;
  if (!budgetDetail) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href={`/app/projects/${projectId}/budgets`}
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
        >
          ← Volver a presupuestos
        </Link>
        <EmptyState
          title="Presupuesto no encontrado"
          description="No hemos encontrado este presupuesto dentro de tu organización."
        />
      </section>
    );
  }

  const { budget, lines, totals } = budgetDetail;
  const statusLabel = BUDGET_STATUSES.find((s) => s.value === budget.status)?.label ?? budget.status;

  return (
    <section className="budget-print mx-auto flex w-full max-w-5xl flex-col gap-6 bg-white p-6 text-slate-950">
      <style>{`
        @media print {
          body > div > header {
            display: none !important;
          }
          body > div > div.pointer-events-none {
            display: none !important;
          }
          main {
            max-width: none !important;
            padding: 0 !important;
          }
          .budget-print {
            max-width: none !important;
            padding: 0 !important;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="print-hidden flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/app/projects/${projectId}/budgets/${budgetId}`}
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
        >
          ← Volver al detalle
        </Link>
        <PrintActionsClient />
      </div>

      <header className="border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">{organizationName ?? "—"}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">{budget.title}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {project.name}
              {project.clientName ? ` · ${project.clientName}` : ""}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {budget.updatedAt ? `Actualizado: ${formatDateTime(budget.updatedAt)}` : "—"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="neutral">Estado: {statusLabel}</Badge>
            <Badge tone="neutral">Total: {formatMoneyEUR(totals.total)}</Badge>
          </div>
        </div>

        {budget.notes ? (
          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-800">{budget.notes}</p>
        ) : null}
      </header>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
              <th className="py-2 pr-3">Descripción</th>
              <th className="py-2 pr-3 text-right">Cantidad</th>
              <th className="py-2 pr-3 text-right">Precio unit.</th>
              <th className="py-2 pr-3 text-right">IVA</th>
              <th className="py-2 pr-3 text-right">Subtotal</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-slate-600">
                  Sin líneas.
                </td>
              </tr>
            ) : (
              lines.map((line) => {
                const subtotal = line.quantity * line.unitPrice;
                const tax = subtotal * (line.taxRate / 100);
                const total = subtotal + tax;

                return (
                  <tr key={line.id} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-3">
                      <p className="font-medium text-slate-900">{line.description}</p>
                    </td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatQty(line.quantity)}</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatMoneyEUR(line.unitPrice)}</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{line.taxRate}%</td>
                    <td className="py-3 pr-3 text-right text-slate-700">{formatMoneyEUR(subtotal)}</td>
                    <td className="py-3 text-right font-medium text-slate-900">{formatMoneyEUR(total)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="ml-auto w-full max-w-sm rounded-xl border border-slate-200 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium text-slate-900">{formatMoneyEUR(totals.subtotal)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-slate-600">Impuestos</span>
          <span className="font-medium text-slate-900">{formatMoneyEUR(totals.tax)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
          <span className="font-semibold text-slate-900">Total</span>
          <span className="font-semibold text-slate-900">{formatMoneyEUR(totals.total)}</span>
        </div>
      </div>
    </section>
  );
}
