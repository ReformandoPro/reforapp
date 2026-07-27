import Link from "next/link";

import { AppShell } from "@/components/layout";

import { ProjectOverviewScreen } from "@/components/screens/ProjectOverviewScreen";
import { notFound } from "next/navigation";

import { getProjectDetail, getProjectPhasesForRequest } from "@/lib/data";

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
  const phases = await getProjectPhasesForRequest(id);

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
                  </li>
                ))}
              </ol>
            )}
          </section>
        </>
      </section>
    </AppShell>
  );
}
