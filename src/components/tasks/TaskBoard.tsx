import type { ProjectTaskBoardColumn } from "@/lib/data/projects";

import { TaskColumn } from "./TaskColumn";

export function TaskBoard({ columns }: { columns: ProjectTaskBoardColumn[] }) {
  const taskCount = columns.reduce(
    (total, column) => total + column.tasks.length,
    0
  );

  return (
    <div>
      {taskCount === 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          Este proyecto todavía no tiene tareas.
        </p>
      ) : null}
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <TaskColumn key={column.status} column={column} />
        ))}
      </div>
    </div>
  );
}
