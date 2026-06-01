"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { TaskPriority } from "@/lib/domain/tasks/priority";
import type { TaskStatus } from "@/lib/domain/tasks/status";
import type { ProjectTaskListItem } from "@/lib/types";

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

type ProjectTasksClientProps = {
  tasks: ProjectTaskListItem[];
};

export function ProjectTasksClient({ tasks }: ProjectTasksClientProps) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, TaskStatus>>({});

  const tasksWithStatus = useMemo(() => {
    return tasks.map((task) => ({
      ...task,
      status: statusOverrides[task.id] ?? task.status,
    }));
  }, [tasks, statusOverrides]);

  return (
    <div className="grid gap-4">
      {tasksWithStatus.map((task) => {
        const isDone = task.status === "done";

        return (
          <Card key={task.id} className={isDone ? "opacity-90" : ""}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">{task.sectionLabel ?? "Sin sección"}</p>
                <h2
                  className={
                    isDone
                      ? "text-lg font-semibold text-slate-900 line-through decoration-slate-400"
                      : "text-lg font-semibold text-slate-900"
                  }
                >
                  {task.title}
                </h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge tone={taskStatusTones[task.status]}>{taskStatusLabels[task.status]}</Badge>
                  <Badge tone={taskPriorityTones[task.priority]}>
                    Prioridad {taskPriorityLabels[task.priority]}
                  </Badge>
                  {task.isDelayed ? <Badge tone="warning">Retrasada</Badge> : null}
                  {task.isBlocked ? <Badge tone="danger">Bloqueada</Badge> : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={isDone ? "ghost" : "secondary"}
                  onClick={() => {
                    setStatusOverrides((prev) => ({
                      ...prev,
                      [task.id]: isDone ? "todo" : "done",
                    }));
                  }}
                >
                  {isDone ? "Reabrir" : "Marcar hecha"}
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Responsable</p>
                <p className="mt-1 text-sm text-slate-900">{task.assigneeName ?? "Sin asignar"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Fecha objetivo</p>
                <p className="mt-1 text-sm text-slate-900">{task.dueDate ?? "Sin fecha"}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Bloqueo</p>
                <p className="mt-1 text-sm text-slate-900">
                  {task.blockedReason ?? "Sin bloqueo activo"}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
