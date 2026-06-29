import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { type BudgetLineInput } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { BudgetEditorClient } from "../../BudgetEditorClient";
import { updateProjectBudgetAction } from "./actions";

export const dynamic = "force-dynamic";

type BudgetRow = {
  id: string;
  title: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  notes: string | null;
};

type LineRow = {
  id: string;
  description: string;
  quantity: string | number;
  unit_price: string | number;
  tax_rate: string | number;
  sort_order: number;
};

export default async function EditBudgetPage({
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
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar presupuesto</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para editar un presupuesto.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/budgets/${budgetId}`}>← Volver al presupuesto</BackLink>
        <EmptyState title="Acceso denegado" description="No tienes permisos para editar presupuestos." />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href="/app/projects">← Volver a obras</BackLink>
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador dentro de tu organización."
        />
      </section>
    );
  }

  const { data: budget } = await supabase
    .from("project_budgets")
    .select("id, title, status, notes")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/budgets`}>← Volver a presupuestos</BackLink>
        <EmptyState
          title="Presupuesto no encontrado"
          description="No hemos encontrado este presupuesto dentro de tu organización."
        />
      </section>
    );
  }

  const { data: lines } = await supabase
    .from("project_budget_lines")
    .select("id, description, quantity, unit_price, tax_rate, sort_order")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("budget_id", budgetId)
    .order("sort_order", { ascending: true });

  const budgetRow = budget as unknown as BudgetRow;
  const lineRows = (lines ?? []) as LineRow[];
  const initialLines: BudgetLineInput[] =
    lineRows.length > 0
      ? lineRows.map((l) => ({
          id: l.id,
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unit_price),
          taxRate: Number(l.tax_rate),
          sortOrder: l.sort_order,
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, taxRate: 21, sortOrder: 1 }];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/app/projects/${projectId}/budgets/${budgetId}`}>← Volver al presupuesto</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Editar presupuesto · {project.name}
        </h1>

        <form action={updateProjectBudgetAction} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="budgetId" value={budgetId} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <BudgetEditorClient
            mode="edit"
            initialTitle={budgetRow.title}
            initialStatus={budgetRow.status}
            initialNotes={budgetRow.notes ?? ""}
            initialLines={initialLines}
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-content-tertiary">
              La organización y la obra se validan en servidor.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
