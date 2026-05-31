import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { TaskPriority } from "@/lib/domain/tasks/priority";
import type { TaskStatus } from "@/lib/domain/tasks/status";
import { getProjectOverview } from "@/lib/services/projects";
import { getProjectTasks } from "@/lib/services/tasks";

const taskStatusLabels: Record<TaskStatus, string> = {
  todo: "Pendiente",
  in_progress: "En curso",
  blocked: "Bloqueada",
  done: "Hecha",
  cancelled: "Cancelada",
};

const taskStatusTones: Record<
  TaskStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  todo: "neutral",
  in_progress: "info",
  blocked: "danger",
  done: "success",
  cancelled: "warning",
};

const taskPriorityLabels: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

const taskPriorityTones: Record<
  TaskPriority,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  low: "neutral",
  medium: "info",
  high: "warning",
  urgent: "danger",
};

type ProjectTasksPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectTasksPage({ params }: ProjectTasksPageProps) {
  const { id } = await params;
  const project = getProjectOverview(id);

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/projects"
          className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Volver a obras
        </Link>

        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador."
        />
      </section>
    );
  }

  const tasks = getProjectTasks(id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href={`/projects/${id}`}
          className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          ← Volver a la obra
        </Link>

        <div>
          <p className="text-sm text-slate-500">Tareas</p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {project.name}
          </h1>
          <p className="mt-1 text-sm text-slate-600">Cliente: {project.clientName}</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No hay tareas todavía"
          description="Cuando existan tareas registradas para esta obra, aparecerán aquí en modo solo lectura."
        />
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{task.sectionLabel ?? "Sin sección"}</p>
                  <h2 className="text-lg font-semibold text-slate-900">{task.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={taskStatusTones[task.status]}>
                      {taskStatusLabels[task.status]}
                    </Badge>
                    <Badge tone={taskPriorityTones[task.priority]}>
                      Prioridad {taskPriorityLabels[task.priority]}
                    </Badge>
                    {task.isDelayed ? <Badge tone="warning">Retrasada</Badge> : null}
                    {task.isBlocked ? <Badge tone="danger">Bloqueada</Badge> : null}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Responsable
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {task.assigneeName ?? "Sin asignar"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Fecha objetivo
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {task.dueDate ?? "Sin fecha"}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                    Bloqueo
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {task.blockedReason ?? "Sin bloqueo activo"}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
