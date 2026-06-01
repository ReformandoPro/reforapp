import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { getProjectOverview } from "@/lib/services/projects";
import { getProjectTasks } from "@/lib/services/tasks";

import { ProjectTasksClient } from "./ProjectTasksClient";

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
        <ProjectTasksClient tasks={tasks} />
      )}
    </section>
  );
}
