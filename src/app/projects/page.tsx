import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getProjectCardsForProjectsPageResult,
} from "@/lib/services/projects";
import type { ProjectStatus } from "@/lib/domain/projects/status";

const statusLabels: Record<ProjectStatus, string> = {
  scheduled: "Planificado",
  in_progress: "En curso",
  on_hold: "En pausa",
  completed: "Completado",
  cancelled: "Cancelado",
};

const statusTones: Record<
  ProjectStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  scheduled: "info",
  in_progress: "info",
  on_hold: "warning",
  completed: "success",
  cancelled: "danger",
};

export default async function ProjectsPage() {
  const result = await getProjectCardsForProjectsPageResult();

  if (!result.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Obras
            </h1>
            <p className="text-sm text-[var(--text-secondary)] sm:text-base">
              No se pudo cargar el listado desde Supabase.
            </p>
            <div className="mt-2">
              <Link
                href="/projects"
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Reintentar
              </Link>
            </div>
          </div>
        </Card>
      </section>
    );
  }

  const projects = result.cards;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Obras
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              Listado de obras en modo solo lectura usando únicamente el
              contrato real disponible hoy.
            </p>
          </div>

          <Button disabled aria-disabled="true" variant="secondary">
            Nueva obra
          </Button>
        </div>
      </Card>

      {projects.length === 0 ? (
        <EmptyState
          title="No hay obras todavía"
          description="Cuando exista una obra activa, aparecerá aquí para que puedas seguir su estado."
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project: import("@/lib/types").ProjectCard) => (
            <Card
              key={project.id}
              className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-none"
            >
              <Link
                href={`/projects/${project.id}`}
                className="block p-5 transition-colors hover:bg-[var(--bg-surface-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {project.name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Cliente: {project.clientName}
                    </p>
                  </div>
                  <Badge tone={statusTones[project.status]}>
                    {statusLabels[project.status]}
                  </Badge>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Tareas retrasadas
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      {project.delayedTasksCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Tareas bloqueadas
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      {project.blockedTasksCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Aprobaciones pendientes
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
                      {project.pendingApprovalsCount}
                    </p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
