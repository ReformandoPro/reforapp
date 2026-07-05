import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardLinkRow } from "@/components/ui/CardLinkRow";
import { BackLink } from "@/components/ui/BackLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { BUDGET_STATUSES } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { readProjectBudgetSummaries } from "@/lib/services/project-budgets";
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

  const budgetsResult = await readProjectBudgetSummaries(
    supabase,
    ctx.organizationId,
    projectId
  );

  if (!budgetsResult.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los presupuestos"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const budgetRows = budgetsResult.data;

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
          actions={
            canWrite ? (
              <LinkButton href={`/app/projects/${projectId}/budgets/new`}>Nuevo presupuesto</LinkButton>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3">
          {budgetRows.map((budget) => {
            const statusLabel =
              BUDGET_STATUSES.find((s) => s.value === budget.status)?.label ?? budget.status;

            return (
              <CardLinkRow
                key={budget.id}
                href={`/app/projects/${projectId}/budgets/${budget.id}`}
                heading={budget.title}
                description={
                  <>
                    {statusLabel} · Actualizado:{" "}
                    {budget.updatedAt ? formatDateTime(budget.updatedAt) : "—"}
                  </>
                }
                trailing={<Badge tone="neutral">Total: {budget.formattedTotal}</Badge>}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
