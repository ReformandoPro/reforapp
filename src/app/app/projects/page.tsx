import Link from "next/link";
import { redirect } from "next/navigation";

import { StatusBadge } from "@/components/app/StatusBadge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { canCreateProjects } from "@/lib/services/project-operational-permissions";
import { createSupabaseProjectsReader, toProjectsListState } from "@/lib/services/private-projects";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

export default async function AppProjectsPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    if (ctx.reason === "missing_membership") {
      redirect("/app/onboarding");
    }

    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ErrorState
          title="No se pudo cargar el listado de obras"
          description="No pudimos resolver tu organización. Inicia sesión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const reader = createSupabaseProjectsReader(supabase);
  const state = await reader
    .listProjects(ctx.organizationId)
    .then(toProjectsListState)
    .catch((error: unknown) => ({
      status: "error" as const,
      message: error instanceof Error ? error.message : "No pudimos cargar las obras.",
    }));

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <PageHeader
        eyebrow={
          <span className="inline-flex rounded-full border border-primary-300/20 bg-primary-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary-100">
            Producción
          </span>
        }
        title="Obras"
        description="Un listado claro para priorizar ejecución, revisar avance y entrar al detalle operativo de cada proyecto."
        actions={
          <>
            {canCreateProjects(ctx.role) ? <LinkButton href="/app/projects/new">Nueva obra</LinkButton> : null}
            <LinkButton href="/app" variant="secondary">Volver al panel</LinkButton>
          </>
        }
      />

      {state.status === "error" ? (
        <ErrorState
          title="No se pudieron cargar las obras"
          description="Ha ocurrido un error leyendo los proyectos reales de la organización."
        />
      ) : null}

      {state.status === "empty" ? (
        <EmptyState
          title="Todavía no hay obras"
          description="Crea la primera obra para empezar a organizar tareas y seguimiento."
          actions={
            canCreateProjects(ctx.role) ? <LinkButton href="/app/projects/new">Nueva obra</LinkButton> : undefined
          }
        />
      ) : null}

      {state.status === "ready" ? (
        <div className="grid gap-4">
          {state.items.map((project) => (
            <Card key={project.id} padding="none" variant="surface" className="overflow-hidden">
              <Link
                href={`/app/projects/${project.id}`}
                className="block p-5 transition-all hover:bg-primary-500/[0.04] sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-num text-xl font-bold tracking-tight text-content-primary">{project.name}</h2>
                      <StatusBadge status={project.status} />
                    </div>
                    <dl className="mt-4 grid gap-3 text-sm text-content-secondary sm:grid-cols-3">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Cliente</dt>
                        <dd className="mt-1 text-content-primary">{project.clientName ?? "Sin cliente"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Tipo</dt>
                        <dd className="mt-1">{project.type ?? "Pendiente"}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Dirección</dt>
                        <dd className="mt-1 truncate">{project.address ?? "Pendiente"}</dd>
                      </div>
                    </dl>
                  </div>
                  <span className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-primary-100 transition-colors group-hover:bg-primary-500/10">
                    Ver detalle
                  </span>
                </div>
                <ProgressBar value={project.progress} showValue label="Avance estimado" className="mt-5" tone="info" />
              </Link>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
