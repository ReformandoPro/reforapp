import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PHASE_STATUSES, type PhaseStatus } from "@/lib/services/phases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { deleteProjectPhaseAction, updateProjectPhaseAction } from "./actions";

export const dynamic = "force-dynamic";

type PhaseRow = {
  id: string;
  title: string;
  description: string | null;
  status: PhaseStatus;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
};

export default async function EditProjectPhasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; phaseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: projectId, phaseId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar fase</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para editar una fase.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/phases`}>← Volver a planificación</BackLink>
        <EmptyState title="Acceso denegado" description="No tienes permisos para editar fases." />
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

  const { data: phase } = await supabase
    .from("project_phases")
    .select("id, title, description, status, start_date, end_date, sort_order")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", phaseId)
    .maybeSingle();

  if (!phase) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/phases`}>← Volver a planificación</BackLink>
        <EmptyState
          title="Fase no encontrada"
          description="No hemos encontrado esta fase dentro de tu organización."
        />
      </section>
    );
  }

  const row = phase as unknown as PhaseRow;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/app/projects/${projectId}/phases`}>← Volver a planificación</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar fase · {project.name}</h1>

        <form action={updateProjectPhaseAction} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="phaseId" value={phaseId} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="title">Título</label>
            <input
              id="title"
              name="title"
              required
              defaultValue={row.title}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="description">Descripción (opcional)</label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={row.description ?? ""}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="status">Estado</label>
              <select
                id="status"
                name="status"
                defaultValue={row.status}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {PHASE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="sortOrder">Orden</label>
              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                defaultValue={row.sort_order}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="startDate">Inicio (opcional)</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                defaultValue={row.start_date ?? ""}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="endDate">Fin (opcional)</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                defaultValue={row.end_date ?? ""}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar
            </button>
          </div>
        </form>

        <form
          action={deleteProjectPhaseAction}
          className="mt-4"
          onSubmit={(e) => {
            const ok = confirm("¿Eliminar fase? Las tareas asociadas quedarán sin fase.");
            if (!ok) e.preventDefault();
          }}
        >
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="phaseId" value={phaseId} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-rose-700 hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Eliminar fase
          </button>
        </form>
      </Card>
    </section>
  );
}
