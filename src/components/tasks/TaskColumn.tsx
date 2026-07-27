import type { ProjectTaskBoardColumn } from "@/lib/data/projects";
import type { ProjectTaskStatus } from "@/lib/services/project-tasks";

import { TaskCard } from "./TaskCard";

const statusLabels: Record<ProjectTaskStatus, string> = {
  pending: "Pendientes",
  in_progress: "En curso",
  blocked: "Bloqueadas",
  done: "Hechas",
};

export function TaskColumn({ column }: { column: ProjectTaskBoardColumn }) {
  const headingId = `task-column-${column.status}`;

  return (
    <section
      aria-labelledby={headingId}
      className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={headingId} className="font-semibold text-slate-900">
          {statusLabels[column.status]}
        </h3>
        <span
          className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
          aria-label={`${column.tasks.length} tareas`}
        >
          {column.tasks.length}
        </span>
      </div>
      {column.tasks.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">Sin tareas</p>
      ) : null}
      <div role="list" aria-label={statusLabels[column.status]} className="mt-4 grid gap-3">
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </section>
  );
}
