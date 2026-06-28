import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PHASE_STATUSES, type PhaseStatus } from "@/lib/services/phases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type PhaseRow = {
  id: string;
  title: string;
  status: PhaseStatus;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
};


function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AppProjectPhasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Planificación</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver planificación.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/app/projects"
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
        >
          ← Volver a obras
        </Link>
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador dentro de tu organización."
        />
      </section>
    );
  }

  const { data: phases, error: phasesError } = await supabase
    .from("project_phases")
    .select("id, title, status, start_date, end_date, sort_order")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: true, nullsFirst: false });

  if (phasesError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar la planificación"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const rows = (phases ?? []) as PhaseRow[];

  const { data: taskCountsRaw } = await supabase
    .from("project_tasks")
    .select("phase_id", { count: "exact", head: false })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId);

  // Simple count aggregation in JS (MVP)
  const taskCountByPhase = new Map<string, number>();
  for (const t of (taskCountsRaw ?? []) as Array<{ phase_id: string | null }>) {
    if (!t.phase_id) continue;
    taskCountByPhase.set(t.phase_id, (taskCountByPhase.get(t.phase_id) ?? 0) + 1);
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}`}
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver a la obra
      </Link>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Planificación · {project.name}</h1>
            <p className="mt-2 text-sm text-content-secondary sm:text-base">
              Fases para planificar la obra.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge tone="neutral">Fases: {rows.length}</Badge>
            {canWrite ? (
              <Link
                href={`/app/projects/${projectId}/phases/new`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Nueva fase
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin fases"
          description={
            canWrite
              ? "Crea la primera fase para empezar la planificación."
              : "Aún no hay fases para esta obra."
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((phase) => {
            const statusLabel = PHASE_STATUSES.find((s) => s.value === phase.status)?.label ?? phase.status;
            const tasksCount = taskCountByPhase.get(phase.id) ?? 0;

            return (
              <Card
                key={phase.id}
                className="p-0 shadow-none"
              >
                <div className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold tracking-tight">{phase.title}</p>
                      <p className="mt-1 text-sm text-content-secondary">
                        {statusLabel} · Inicio: {formatDate(phase.start_date)} · Fin: {formatDate(phase.end_date)}
                      </p>
                      <p className="mt-1 text-xs text-content-tertiary">Tareas asociadas: {tasksCount}</p>
                    </div>

                    {canWrite ? (
                      <Link
                        href={`/app/projects/${projectId}/phases/${phase.id}/edit`}
                        className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Editar
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
