import Link from "next/link";

import { AppShell } from "@/components/layout";

import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { notFound } from "next/navigation";

import { getProjectDetail } from "@/lib/data";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const project = await getProjectDetail(id);
  if (!project) notFound();

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
        </>
      </section>
    </AppShell>
  );
}
