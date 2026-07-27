import { Badge } from "@/components/ui/Badge";
import type { ProjectTask } from "@/lib/data/projects";
import type {
  ProjectTaskPriority,
  ProjectTaskStatus,
} from "@/lib/services/project-tasks";

const statusLabels: Record<ProjectTaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En curso",
  blocked: "Bloqueada",
  done: "Hecha",
};

const statusTones: Record<
  ProjectTaskStatus,
  "neutral" | "info" | "danger" | "success"
> = {
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

const priorityTones: Record<
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

export function TaskCard({ task }: { task: ProjectTask }) {
  return (
    <article
      role="listitem"
      tabIndex={0}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      <h4 className="font-medium text-slate-900">{task.title}</h4>
      <dl className="mt-3 grid gap-2 text-sm text-slate-600">
        <div>
          <dt className="font-medium text-slate-700">Fase</dt>
          <dd>{task.phaseTitle ?? "Sin fase"}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-700">Fecha límite</dt>
          <dd>{formatTaskDate(task.dueDate)}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge tone={statusTones[task.status]}>
          Estado: {statusLabels[task.status]}
        </Badge>
        <Badge tone={priorityTones[task.priority]}>
          Prioridad: {priorityLabels[task.priority]}
        </Badge>
      </div>
    </article>
  );
}
