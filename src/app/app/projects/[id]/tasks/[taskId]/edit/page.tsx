import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { listOrganizationMembers } from "@/lib/services/org-members";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";
import { updateProjectTask } from "./actions";

export const dynamic = "force-dynamic";

type EditTaskPageProps = {
  params: Promise<{ id: string; taskId: string }>;
  searchParams: Promise<{ error?: string }>;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  assignee_user_id: string | null;
};

export default async function EditProjectTaskPage({
  params,
  searchParams,
}: EditTaskPageProps) {
  const { id: projectId, taskId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Editar tarea
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para editar una tarea.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href={`/app/projects/${projectId}/tasks`}
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a tareas
        </Link>
        <EmptyState
          title="Acceso denegado"
          description="No tienes permisos para editar tareas."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const members = await listOrganizationMembers(ctx.organizationId);

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/app/projects"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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

  const { data: task, error: taskError } = await supabase
    .from("project_tasks")
    .select("id, title, description, status, priority, due_date, assignee_user_id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", taskId)
    .maybeSingle();

  if (taskError) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar la tarea
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
        </Card>
      </section>
    );
  }

  if (!task) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href={`/app/projects/${projectId}/tasks`}
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a tareas
        </Link>
        <EmptyState
          title="Tarea no encontrada"
          description="No hemos encontrado esta tarea dentro de tu organización."
        />
      </section>
    );
  }

  const row = task as unknown as TaskRow;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}/tasks`}
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a tareas
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Editar tarea · {project.name}
        </h1>

        <form action={updateProjectTask} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="taskId" value={row.id} />

          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
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
              defaultValue={row.title}
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
              defaultValue={row.description ?? ""}
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
              defaultValue={row.assignee_user_id ?? ""}
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="status">
                Estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue={row.status}
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
                defaultValue={row.priority}
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
              defaultValue={row.due_date ?? ""}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[var(--text-tertiary)]">
              La organización y la obra se validan en servidor.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}

