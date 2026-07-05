import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

import { BudgetActionsClient } from "./BudgetActionsClient";
import {
  BUDGET_STATUSES,
  formatMoneyEUR,
} from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { readProjectBudgetDetail } from "@/lib/services/project-budgets";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

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

export default async function BudgetDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; budgetId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: projectId, budgetId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Presupuesto</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver este presupuesto.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/app/projects"
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
        >
          ← Volver a obras
        </Link>
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador dentro de tu organización."
        />
      </section>
    );
  }

  const budgetResult = await readProjectBudgetDetail(
    supabase,
    ctx.organizationId,
    projectId,
    budgetId
  );

  if (!budgetResult.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar el presupuesto"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
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

  const { budget, lines, totals, formattedTotal } = budgetDetail;

  const statusLabel =
    BUDGET_STATUSES.find((s) => s.value === budget.status)?.label ?? budget.status;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}/budgets`}
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver a presupuestos
      </Link>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{budget.title}</h1>
            <p className="mt-2 text-sm text-content-secondary sm:text-base">
              {project.name} ·{" "}
              {budget.updatedAt ? formatDateTime(budget.updatedAt) : "—"}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="neutral">Estado: {statusLabel}</Badge>
              <Badge tone="neutral">Total: {formattedTotal}</Badge>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <Link
              href={`/app/projects/${projectId}/budgets/${budgetId}/print`}
              target="_blank"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              rel="noreferrer"
            >
              Vista imprimible
            </Link>

            {canWrite ? (
              <>
                <Link
                  href={`/app/projects/${projectId}/budgets/${budgetId}/edit`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Editar
                </Link>

                <BudgetActionsClient
                  projectId={projectId}
                  budgetId={budgetId}
                  currentStatus={budget.status}
                />
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
            {error}
          </p>
        ) : null}

        {budget.notes ? (
          <p className="mt-5 whitespace-pre-wrap text-sm text-content-primary">{budget.notes}</p>
        ) : null}
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Líneas</h2>

        {lines.length === 0 ? (
          <p className="mt-4 text-sm text-content-secondary">Sin líneas.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {lines.map((line) => {
              const qty = line.quantity;
              const unit = line.unitPrice;
              const taxRate = line.taxRate;
              const subtotal = qty * unit;
              const tax = subtotal * (taxRate / 100);
              const total = subtotal + tax;

              return (
                <div
                  key={line.id}
                  className="rounded-xl border border-subtle bg-bg-raised px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-content-primary">{line.description}</p>
                      <p className="mt-1 text-xs text-content-tertiary">
                        {qty} × {formatMoneyEUR(unit)} · IVA {taxRate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-content-primary">
                        {formatMoneyEUR(total)}
                      </p>
                      <p className="mt-1 text-xs text-content-tertiary">
                        Base {formatMoneyEUR(subtotal)} · IVA {formatMoneyEUR(tax)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">Subtotal</span>
            <span className="font-medium">{formatMoneyEUR(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">IVA</span>
            <span className="font-medium">{formatMoneyEUR(totals.tax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-primary font-semibold">Total</span>
            <span className="font-semibold">{formatMoneyEUR(totals.total)}</span>
          </div>
        </div>
      </Card>
    </section>
  );
}
