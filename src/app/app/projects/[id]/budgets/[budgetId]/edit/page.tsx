import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { readProjectBudgetEditorState } from "@/lib/services/project-budgets";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { BudgetEditorClient } from "../../BudgetEditorClient";
import { updateProjectBudgetAction } from "./actions";

export const dynamic = "force-dynamic";

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

  const editorStateResult = await readProjectBudgetEditorState(
    supabase,
    ctx.organizationId,
    projectId,
    budgetId
  );

  if (!editorStateResult.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/budgets/${budgetId}`}>← Volver al presupuesto</BackLink>
        <EmptyState title="No pudimos cargar el presupuesto" description="Revisa tu conexión e inténtalo de nuevo." />
      </section>
    );
  }

  const editorState = editorStateResult.data;
  if (!editorState) {
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
            initialTitle={editorState.budget.title}
            initialStatus={editorState.budget.status}
            initialNotes={editorState.budget.notes}
            initialLines={editorState.initialLines}
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
