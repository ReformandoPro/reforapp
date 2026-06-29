import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackLink } from "@/components/ui/BackLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  BUDGET_STATUSES,
  computeBudgetTotals,
  formatMoneyEUR,
  type BudgetStatus,
} from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type BudgetRow = {
  id: string;
  title: string;
  status: BudgetStatus;
  updated_at: string;
};

type LineRow = {
  budget_id: string;
  quantity: string | number;
  unit_price: string | number;
  tax_rate: string | number;
};

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

export default async function AppProjectBudgetsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Presupuestos</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver presupuestos.
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

  const { data: budgets, error: budgetsError } = await supabase
    .from("project_budgets")
    .select("id, title, status, updated_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (budgetsError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los presupuestos"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const budgetRows = (budgets ?? []) as BudgetRow[];
  const budgetIds = budgetRows.map((b) => b.id);

  const { data: lines } = budgetIds.length
    ? await supabase
        .from("project_budget_lines")
        .select("budget_id, quantity, unit_price, tax_rate")
        .eq("organization_id", ctx.organizationId)
        .eq("project_id", projectId)
        .in("budget_id", budgetIds)
    : { data: [] as unknown[] };

  const lineRows = (lines ?? []) as LineRow[];
  const linesByBudget = new Map<string, LineRow[]>();
  for (const line of lineRows) {
    const list = linesByBudget.get(line.budget_id) ?? [];
    list.push(line);
    linesByBudget.set(line.budget_id, list);
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<BackLink href={`/app/projects/${projectId}`}>← Volver a la obra</BackLink>}
        title={<>Presupuestos · {project.name}</>}
        description="Presupuestos básicos con líneas e IVA."
        actions={
          canWrite ? (
            <LinkButton href={`/app/projects/${projectId}/budgets/new`}>Nuevo presupuesto</LinkButton>
          ) : null
        }
      />

      {budgetRows.length === 0 ? (
        <EmptyState
          title="Sin presupuestos"
          description={
            canWrite
              ? "Crea el primer presupuesto para esta obra."
              : "Aún no hay presupuestos para esta obra."
          }
        />
      ) : (
        <div className="grid gap-3">
          {budgetRows.map((budget) => {
            const statusLabel =
              BUDGET_STATUSES.find((s) => s.value === budget.status)?.label ?? budget.status;

            const lineList = linesByBudget.get(budget.id) ?? [];
            const totals = computeBudgetTotals(
              lineList.map((l) => ({
                quantity: Number(l.quantity),
                unitPrice: Number(l.unit_price),
                taxRate: Number(l.tax_rate),
              }))
            );

            return (
              <Card
                key={budget.id}
                className="p-0 shadow-none"
              >
                <Link
                  href={`/app/projects/${projectId}/budgets/${budget.id}`}
                  className="block p-5 hover:bg-bg-raised"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold tracking-tight">{budget.title}</p>
                      <p className="mt-1 text-sm text-content-secondary">
                        {statusLabel} · Actualizado: {formatDateTime(budget.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Badge tone="neutral">Total: {formatMoneyEUR(totals.total)}</Badge>
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
