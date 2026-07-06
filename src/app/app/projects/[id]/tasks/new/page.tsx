import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormActions } from "@/components/ui/FormActions";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { canWriteProjectTasks } from "@/lib/services/project-operational-permissions";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";
import { createProjectTask } from "./actions";

export const dynamic = "force-dynamic";

type NewTaskPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProjectTaskPage({
  params,
  searchParams,
}: NewTaskPageProps) {
  const { id: projectId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Nueva tarea
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para crear una tarea.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = canWriteProjectTasks(ctx.role);
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/tasks`}>← Volver a tareas</BackLink>
        <EmptyState
          title="Acceso denegado"
          description="No tienes permisos para crear tareas."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const members = await getOrgMembersWithProfiles(ctx.organizationId);
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

  const { data: phases } = await supabase
    .from("project_phases")
    .select("id, title")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: true, nullsFirst: false });

  const phaseRows = (phases ?? []) as Array<{ id: string; title: string }>;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/app/projects/${projectId}/tasks`}>← Volver a tareas</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Nueva tarea · {project.name}
        </h1>
        <p className="mt-2 text-sm text-content-secondary sm:text-base">
          Crea una tarea operativa para esta obra.
        </p>

        <form action={createProjectTask} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              name="title"
              required
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="description">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="assignee_user_id">
              Responsable
            </label>
            <select
              id="assignee_user_id"
              name="assignee_user_id"
              defaultValue=""
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <option value="">Sin asignar</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.label} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="phase_id">
              Fase (opcional)
            </label>
            <select
              id="phase_id"
              name="phase_id"
              defaultValue=""
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <option value="">Sin fase</option>
              {phaseRows.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  {ph.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="status">
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue="pending"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En curso</option>
                <option value="blocked">Bloqueada</option>
                <option value="done">Hecha</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="priority">
                Prioridad
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue="medium"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="due_date">
              Fecha límite (opcional)
            </label>
            <input
              id="due_date"
              name="due_date"
              type="date"
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <FormActions
            layout="betweenResponsive"
            note="La organización y la obra se validan en servidor."
          >
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear tarea
            </button>
          </FormActions>
        </form>
      </Card>
    </section>
  );
}
