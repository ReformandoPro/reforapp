import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackLink } from "@/components/ui/BackLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type TaskStatus = "pending" | "in_progress" | "done" | "blocked";
type TaskPriority = "low" | "medium" | "high" | "urgent";

type TaskRow = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  updated_at: string | null;
  assignee_user_id: string | null;
  phase_id: string | null;
  phase?: { title: string } | { title: string }[] | null;
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  blocked: "Bloqueada",
  done: "Hecha",
};

const statusTones: Record<TaskStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  pending: "neutral",
  in_progress: "info",
  blocked: "danger",
  done: "success",
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const priorityTones: Record<TaskPriority, "neutral" | "success" | "warning" | "danger" | "info"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

export default async function AppProjectTasksPage({
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Tareas
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            {ctx.reason === "missing_membership"
              ? "Tu usuario no tiene acceso a ninguna organización todavía."
              : "Inicia sesión e inténtalo de nuevo."}
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar las tareas
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
        </Card>
      </section>
    );
  }

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
  const memberLabelById = new Map(members.map((m) => [m.userId, m.label] as const));

  const { data: tasks, error } = await supabase
    .from("project_tasks")
    .select("id, title, status, priority, due_date, updated_at, assignee_user_id, phase_id, phase:project_phases(title)")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar las tareas
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-4">
            <Link
              href={`/app/projects/${projectId}/tasks`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const rows = ((tasks ?? []) as TaskRow[]) ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<BackLink href={`/app/projects/${projectId}`}>← Volver a la obra</BackLink>}
        title={<>Tareas · {project.name}</>}
        description="Gestión operativa de tareas para esta obra."
        actions={
          canWrite ? (
            <LinkButton href={`/app/projects/${projectId}/tasks/new`}>Nueva tarea</LinkButton>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Sin tareas"
          description={
            canWrite
              ? "Crea la primera tarea para empezar a gestionar la obra."
              : "Aún no hay tareas para esta obra."
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((task) => (
            <Card
              key={task.id}
              className="p-0 shadow-none"
            >
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
                <Link
                  href={`/app/projects/${projectId}/tasks/${task.id}`}
                  className="flex-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <p className="text-base font-semibold tracking-tight hover:underline">{task.title}</p>
                  <p className="mt-1 text-xs text-content-tertiary">
                    Vence: {formatDate(task.due_date)}
                  </p>
                  <p className="mt-1 text-xs text-content-tertiary">
                    Responsable:{" "}
                    {task.assignee_user_id
                      ? (memberLabelById.get(task.assignee_user_id) ?? task.assignee_user_id)
                      : "Sin asignar"}
                  </p>
                  {task.phase_id ? (
                    <p className="mt-1 text-xs text-content-tertiary">
                      Fase:{" "}
                      {Array.isArray(task.phase)
                        ? task.phase[0]?.title
                        : task.phase?.title ?? task.phase_id}
                    </p>
                  ) : null}
                </Link>

                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge tone={priorityTones[task.priority]}>
                    {priorityLabels[task.priority]}
                  </Badge>
                  <Badge tone={statusTones[task.status]}>{statusLabels[task.status]}</Badge>

                  {canWrite ? (
                    <Link
                      href={`/app/projects/${projectId}/tasks/${task.id}/edit`}
                      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Editar
                    </Link>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

