import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { getProjectOverview } from "@/lib/services/projects";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectOverview(id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <a
        href="/projects"
        className="text-sm font-medium text-[var(--primary-300)] hover:text-[var(--text-primary)]"
      >
        ← Volver a obras
      </Link>

      {project ? (
        <ProjectOverviewScreen project={project} />
      ) : (
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador."
        />
      )}
    </section>
  );
}
