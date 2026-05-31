import Link from "next/link";

import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProjectOverview } from "@/lib/services/projects";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const project = getProjectOverview(id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-900"
      >
        ← Volver a obras
      </Link>

      {project ? (
        <>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/projects/${id}/tasks`}
              className="inline-flex text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Ver tareas de la obra
            </Link>
          </div>

          <ProjectOverviewScreen project={project} />
        </>
      ) : (
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador."
        />
      )}
    </section>
  );
}
