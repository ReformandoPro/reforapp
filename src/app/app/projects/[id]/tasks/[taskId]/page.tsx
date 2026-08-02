import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import type { ProjectTaskPriority, ProjectTaskStatus } from "@/lib/services/project-tasks";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { addTaskCommentAction } from "./actions";
import { CreateIssueForm } from "./CreateIssueForm";
import { IssueList, type TaskIssueListItem } from "./IssueList";
import { TaskCommentsClient, type TaskCommentListItem } from "./TaskCommentsClient";

export const dynamic = "force-dynamic";

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  due_date: string | null;
  assignee_user_id: string | null;
  updated_at: string | null;
};

type CommentRow = {
  id: string;
  author_user_id: string;
  body: string;
  created_at: string;
};

type IssueRow = {
  id: string;
  reporter_user_id: string;
  description: string;
  created_at: string;
};

function isIssueRow(value: unknown): value is IssueRow {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.reporter_user_id === "string" &&
    typeof row.description === "string" &&
    typeof row.created_at === "string"
  );
}

const statusLabels: Record<ProjectTaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  blocked: "Bloqueada",
  done: "Hecha",
};

const statusTones: Record<ProjectTaskStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  pending: "neutral",
  in_progress: "info",
  blocked: "danger",
  done: "success",
};

const priorityLabels: Record<ProjectTaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const priorityTones: Record<ProjectTaskPriority, "neutral" | "success" | "warning" | "danger" | "info"> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

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

export default async function AppProjectTaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; taskId: string }>;
  searchParams: Promise<{ error?: string; issueError?: string }>;
}) {
  const { id: projectId, taskId } = await params;
  const { error, issueError } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Tarea</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver esta tarea.
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar la tarea"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
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

  const { data: task, error: taskError } = await supabase
    .from("project_tasks")
    .select("id, title, description, status, priority, due_date, assignee_user_id, updated_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", taskId)
    .maybeSingle();

  if (taskError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar la tarea"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  if (!task) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href={`/app/projects/${projectId}/tasks`}
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
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

  const members = await getOrgMembersWithProfiles(ctx.organizationId);
  const labelByUserId = new Map(members.map((m) => [m.userId, m.label] as const));

  const { data: issues, error: issuesError } = await supabase
    .from("project_task_issues")
    .select("id, reporter_user_id, description, created_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  const { data: comments, error: commentsError } = await supabase
    .from("project_task_comments")
    .select("id, author_user_id, body, created_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });

  if (commentsError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los comentarios"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const row = task as unknown as TaskRow;
  const issueRows = Array.isArray(issues) ? issues.filter(isIssueRow) : [];
  const commentRows = (comments ?? []) as CommentRow[];

  const issueItems: TaskIssueListItem[] = issueRows.map((issue) => {
    const reporterLabel = labelByUserId.get(issue.reporter_user_id) ?? "Usuario";
    return {
      id: issue.id,
      reporterLabel,
      createdAtLabel: formatDateTime(issue.created_at),
      description: issue.description,
    };
  });

  const commentItems: TaskCommentListItem[] = commentRows.map((comment) => {
    const authorLabel = labelByUserId.get(comment.author_user_id) ?? comment.author_user_id;
    const canManage =
      comment.author_user_id === ctx.user.id || ctx.role === "owner" || ctx.role === "admin";

    return {
      id: comment.id,
      authorLabel,
      authorUserId: comment.author_user_id,
      createdAtLabel: formatDateTime(comment.created_at),
      body: comment.body,
      canManage,
    };
  });

  const assigneeLabel = row.assignee_user_id
    ? labelByUserId.get(row.assignee_user_id) ?? row.assignee_user_id
    : "Sin asignar";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}/tasks`}
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver a tareas
      </Link>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-content-tertiary">Obra</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{row.title}</h1>
            <p className="mt-2 text-sm text-content-secondary sm:text-base">
              {project.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge tone={priorityTones[row.priority]}>{priorityLabels[row.priority]}</Badge>
            <Badge tone={statusTones[row.status]}>{statusLabels[row.status]}</Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-content-tertiary">Responsable</p>
            <p className="mt-1 text-sm text-content-primary">{assigneeLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-content-tertiary">Fecha límite</p>
            <p className="mt-1 text-sm text-content-primary">{formatDate(row.due_date)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-content-tertiary">Actualizado</p>
            <p className="mt-1 text-sm text-content-primary">{row.updated_at ? formatDateTime(row.updated_at) : "—"}</p>
          </div>
        </div>

        {row.description ? (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.14em] text-content-tertiary">Descripción</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-content-primary">{row.description}</p>
          </div>
        ) : null}
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Incidencias</h2>

        {issuesError ? (
          <p className="mt-4 text-sm text-content-secondary">No pudimos cargar las incidencias.</p>
        ) : (
          <IssueList issues={issueItems} />
        )}

        <CreateIssueForm projectId={projectId} taskId={taskId} error={issueError} />
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Comentarios</h2>

        {commentItems.length === 0 ? (
          <p className="mt-4 text-sm text-content-secondary">Aún no hay comentarios.</p>
        ) : (
          <TaskCommentsClient projectId={projectId} taskId={taskId} comments={commentItems} />
        )}

        <form action={addTaskCommentAction} className="mt-6 space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="taskId" value={taskId} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="body">
              Añadir comentario
            </label>
            <textarea
              id="body"
              name="body"
              rows={4}
              required
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              placeholder="Escribe un comentario…"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-content-tertiary">Solo visible para miembros de la organización.</p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Publicar
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
