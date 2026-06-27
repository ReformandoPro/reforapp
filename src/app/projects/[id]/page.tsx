import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProjectStatus } from "@/lib/domain/projects/status";
import { getProjectDetailForProjectsDetailPageResult } from "@/lib/services/projects";

type ProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

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

function formatUpdatedAt(value: string | null): string {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { id } = await params;
  const result = await getProjectDetailForProjectsDetailPageResult(id);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/projects"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a obras
      </Link>

      {!result.ok ? (
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar la obra
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-4">
            <Link
              href={`/projects/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          </div>
        </Card>
      ) : !result.project ? (
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador."
        />
      ) : (
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {result.project.name}
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
                Cliente: {result.project.clientName}
              </p>
            </div>
            <Badge tone={statusTones[result.project.status]}>
              {statusLabels[result.project.status]}
            </Badge>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Dirección
              </p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {result.project.address ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Tipo
              </p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {result.project.type ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Progreso
              </p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {result.project.progress ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Actualizado
              </p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">
                {formatUpdatedAt(result.project.updatedAt)}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Link
              href={`/projects/${id}/tasks`}
              className="inline-flex text-sm font-medium text-[var(--text-secondary)] underline-offset-4 hover:text-[var(--text-primary)] hover:underline"
            >
              Ver tareas de la obra
            </Link>
          </div>
        </Card>
      )}
    </section>
  );
}
