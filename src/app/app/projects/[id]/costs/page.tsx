import Link from "next/link";

import { BackLink } from "@/components/ui/BackLink";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CardActionRow } from "@/components/ui/CardActionRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoneyEUR } from "@/lib/services/budgets-basic";
import { COST_CATEGORIES, computeCostTotals, type CostCategory } from "@/lib/services/costs";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { readMainProjectBudgetSummary } from "@/lib/services/project-budgets";
import { computeProjectMargin } from "@/lib/services/project-margin";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type CostRow = {
  id: string;
  created_by_user_id: string;
  title: string;
  category: CostCategory;
  amount: string | number;
  tax_rate: string | number;
  cost_date: string;
  supplier_name: string | null;
  document_id: string | null;
  created_at: string;
};

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatMarginStatus(status: "healthy" | "risk" | "loss" | "unknown") {
  switch (status) {
    case "healthy":
      return "Va bien";
    case "risk":
      return "En riesgo";
    case "loss":
      return "En pérdidas";
    case "unknown":
      return "Sin aceptado";
  }
}

export default async function AppProjectCostsPage({
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Costes</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver costes.
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

  const members = await getOrgMembersWithProfiles(ctx.organizationId);
  const labelByUserId = new Map(members.map((m) => [m.userId, m.label] as const));

  const { data: costs, error: costsError } = await supabase
    .from("project_costs")
    .select(
      "id, created_by_user_id, title, category, amount, tax_rate, cost_date, supplier_name, document_id, created_at"
    )
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("cost_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (costsError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los costes"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const rows = (costs ?? []) as CostRow[];

  const totals = computeCostTotals(
    rows.map((r) => ({ amount: Number(r.amount), taxRate: Number(r.tax_rate) }))
  );

  const totalsByCategory = new Map<CostCategory, number>();
  for (const row of rows) {
    const prev = totalsByCategory.get(row.category) ?? 0;
    totalsByCategory.set(row.category, prev + Number(row.amount) * (1 + Number(row.tax_rate) / 100));
  }

  const mainBudgetResult = await readMainProjectBudgetSummary(supabase, ctx.organizationId, projectId);
  const mainBudget = mainBudgetResult.ok ? mainBudgetResult.data : null;
  const budgetTotal = mainBudget?.totals.total ?? 0;
  const budgetKind = mainBudget?.kind ?? "none";

  const margin = computeProjectMargin({ budgetTotal, realCostTotal: totals.total, budgetKind });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<BackLink href={`/app/projects/${projectId}`}>← Volver a la obra</BackLink>}
        title={`Costes · ${project.name}`}
        description="Registro de gastos reales para comparar con presupuestos."
        actions={
          canWrite ? (
            <LinkButton href={`/app/projects/${projectId}/costs/new`}>Nuevo coste</LinkButton>
          ) : null
        }
      />

      <Card className="p-6 shadow-none">
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge tone="neutral">Costes: {rows.length}</Badge>
          <Badge tone="neutral">Total: {formatMoneyEUR(totals.total)}</Badge>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">Total base</span>
            <span className="font-medium">{formatMoneyEUR(totals.base)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">Total IVA</span>
            <span className="font-medium">{formatMoneyEUR(totals.tax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-primary font-semibold">Total (con IVA)</span>
            <span className="font-semibold">{formatMoneyEUR(totals.total)}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-none">
        <div className="grid gap-2 rounded-xl border border-subtle bg-bg-raised p-4 text-sm">
          <p className="font-semibold text-content-primary">Comparativa</p>
          {budgetKind === "none" ? (
            <p className="text-content-secondary">Sin presupuesto.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">
                  {budgetKind === "accepted" ? "Presupuesto aceptado (total)" : "Presupuesto principal (no aceptado)"}
                </span>
                <span className="font-medium">{formatMoneyEUR(budgetTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">Costes reales (total)</span>
                <span className="font-medium">{formatMoneyEUR(totals.total)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-primary font-semibold">Margen estimado</span>
                <span className="font-semibold">{formatMoneyEUR(margin.marginAmount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">Margen %</span>
                <span className="font-medium">{margin.marginPercent == null ? "—" : `${margin.marginPercent.toFixed(1)}%`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-content-secondary">Estado</span>
                <span className="font-medium">{formatMarginStatus(margin.status)}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Resumen por categoría</h2>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-content-secondary">Aún no hay costes.</p>
        ) : (
          <div className="mt-4 grid gap-2 text-sm">
            {COST_CATEGORIES.map((c) => {
              const totalInc = totalsByCategory.get(c.value) ?? 0;
              return (
                <div key={c.value} className="flex items-center justify-between">
                  <span className="text-content-secondary">{c.label}</span>
                  <span className="font-medium">{formatMoneyEUR(totalInc)}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin costes"
          description={
            canWrite
              ? "Crea el primer coste real para esta obra."
              : "Aún no hay costes registrados para esta obra."
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((row) => {
            const base = Number(row.amount);
            const taxRate = Number(row.tax_rate);
            const totalInc = base * (1 + taxRate / 100);
            const catLabel = COST_CATEGORIES.find((c) => c.value === row.category)?.label ?? row.category;
            const authorLabel = labelByUserId.get(row.created_by_user_id) ?? row.created_by_user_id;

            return (
              <CardActionRow
                key={row.id}
                heading={row.title}
                description={
                  <>
                    {catLabel} · {formatDate(row.cost_date)} · {authorLabel}
                    {row.supplier_name ? ` · ${row.supplier_name}` : ""}
                  </>
                }
                meta={row.document_id ? "Con documento asociado" : null}
                trailing={<Badge tone="neutral">{formatMoneyEUR(totalInc)}</Badge>}
                actions={
                  canWrite ? (
                    <Link
                      href={`/app/projects/${projectId}/costs/${row.id}/edit`}
                      className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
                    >
                      Editar
                    </Link>
                  ) : null
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
