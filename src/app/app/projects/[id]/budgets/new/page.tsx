import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BUDGET_STATUSES, type BudgetLineInput } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { BudgetEditorClient } from "../BudgetEditorClient";
import { createProjectBudgetAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewProjectBudgetPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: projectId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo presupuesto</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para crear un presupuesto.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/budgets`}>← Volver a presupuestos</BackLink>
        <EmptyState title="Acceso denegado" description="No tienes permisos para crear presupuestos." />
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

  const initialLines: BudgetLineInput[] = [
    { description: "", quantity: 1, unitPrice: 0, taxRate: 21, sortOrder: 1 },
  ];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/app/projects/${projectId}/budgets`}>← Volver a presupuestos</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Nuevo presupuesto · {project.name}
        </h1>
        <p className="mt-2 text-sm text-content-secondary sm:text-base">
          Crea un presupuesto básico con líneas, IVA y total.
        </p>

        <form action={createProjectBudgetAction} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <BudgetEditorClient
            mode="new"
            initialTitle="Presupuesto"
            initialStatus={BUDGET_STATUSES[0].value}
            initialNotes=""
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
              Crear presupuesto
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
