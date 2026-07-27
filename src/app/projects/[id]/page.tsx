import Link from "next/link";

import { AppShell } from "@/components/layout";
import { Badge } from "@/components/ui/Badge";

import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { notFound } from "next/navigation";

import {
  getProjectDetail,
  getProjectPhasesForRequest,
  getProjectTasksForRequest,
  groupProjectTasksByPhase,
} from "@/lib/data";
import type {
  ProjectTaskPriority,
  ProjectTaskStatus,
} from "@/lib/services/project-tasks";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

const taskStatusLabels: Record<ProjectTaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  done: "Hecha",
  blocked: "Bloqueada",
};

const taskStatusTones: Record<
  ProjectTaskStatus,
  "neutral" | "success" | "danger" | "info"
> = {
  pending: "neutral",
  in_progress: "info",
  done: "success",
  blocked: "danger",
};

const taskPriorityLabels: Record<ProjectTaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const taskPriorityTones: Record<
  ProjectTaskPriority,
  "neutral" | "info" | "warning" | "danger"
> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

function formatTaskDate(value: string | null): string {
  if (!value) return "Sin fecha límite";

  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(
    new Date(`${value}T00:00:00.000Z`)
  );
}

type TaskListProps = {
  tasks: Awaited<ReturnType<typeof getProjectTasksForRequest>>;
};

function TaskList({ tasks }: TaskListProps) {
  return (
    <ul className="mt-3 grid gap-3">
      {tasks.map((task) => (
        <li key={task.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h4 className="font-medium text-slate-900">{task.title}</h4>
              {task.description ? (
                <p className="mt-1 text-sm text-slate-600">{task.description}</p>
              ) : null}
              <p className="mt-2 text-xs text-slate-500">
                Fecha límite: {formatTaskDate(task.dueDate)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2" aria-label="Estado y prioridad de la tarea">
              <Badge tone={taskStatusTones[task.status]}>
                Estado: {taskStatusLabels[task.status]}
              </Badge>
              <Badge tone={taskPriorityTones[task.priority]}>
                Prioridad: {taskPriorityLabels[task.priority]}
              </Badge>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) notFound();
  const [phases, tasks] = await Promise.all([
    getProjectPhasesForRequest(id),
    getProjectTasksForRequest(id),
  ]);
  const tasksByPhase = groupProjectTasksByPhase(tasks);
  const unphasedTasks = tasksByPhase.get(null) ?? [];

  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Volver a obras
      </Link>

      <>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/projects/${id}/tasks`}
              className="inline-flex text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Ver tareas de la obra
            </Link>
          </div>

          <ProjectOverviewScreen project={{
            ...project,
            nextActions: [],
            availableSections: [],
            delayedTasksCount: 0,
            blockedTasksCount: 0,
            pendingApprovalsCount: 0,
            openIncidentsCount: 0,
            pendingMaterialRequestsCount: 0,
          }} />
          <div className="grid gap-3 rounded-xl border border-subtle bg-bg-surface p-5 text-sm">
            <p>Dirección: {project.address}</p>
            <p>Inicio: {project.startDate}</p>
            <p>Tipo: {project.type}</p>
          </div>
          <section aria-labelledby="project-phases-heading" className="rounded-xl border border-subtle bg-bg-surface p-5">
            <h2 id="project-phases-heading" className="text-lg font-semibold text-slate-900">Fases del proyecto</h2>
            {tasks.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Este proyecto todavía no tiene tareas.</p>
            ) : null}
            {phases.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">Este proyecto todavía no tiene fases.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {phases.map((phase) => (
                  <li key={phase.id} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-slate-900">{phase.title}</h3>
                        {phase.description ? <p className="mt-1 text-sm text-slate-600">{phase.description}</p> : null}
                      </div>
                      <span className="text-sm text-slate-600">{phase.status}</span>
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-3">
                      <div><dt className="font-medium">Inicio</dt><dd>{phase.startDate ?? "—"}</dd></div>
                      <div><dt className="font-medium">Fin</dt><dd>{phase.endDate ?? "—"}</dd></div>
                      <div><dt className="font-medium">Orden</dt><dd>{phase.sortOrder}</dd></div>
                    </dl>
                    {(tasksByPhase.get(phase.id) ?? []).length === 0 ? (
                      <p className="mt-4 text-sm text-slate-600">Esta fase todavía no tiene tareas.</p>
                    ) : (
                      <TaskList tasks={tasksByPhase.get(phase.id) ?? []} />
                    )}
                  </li>
                ))}
              </ol>
            )}
            {unphasedTasks.length > 0 ? (
              <section aria-labelledby="unphased-tasks-heading" className="mt-5 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <h3 id="unphased-tasks-heading" className="font-medium text-slate-900">Tareas sin fase</h3>
                <TaskList tasks={unphasedTasks} />
              </section>
            ) : null}
          </section>
        </>
      </section>
    </AppShell>
  );
}
