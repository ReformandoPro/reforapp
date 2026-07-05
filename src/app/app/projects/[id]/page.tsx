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
import { createSupabaseProjectsReader, toProjectDetailState } from "@/lib/services/private-projects";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

const futureSections = ["Fases", "Tareas", "Presupuesto", "Documentos", "Actividad"];

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    if (ctx.reason === "missing_membership") {
      redirect("/app/onboarding");
    }

    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ErrorState
          title="No se pudo cargar la obra"
          description="No pudimos resolver tu organización. Inicia sesión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const reader = createSupabaseProjectsReader(supabase);
  const state = await reader
    .getProject(ctx.organizationId, id)
    .then(toProjectDetailState)
    .catch((error: unknown) => ({
      status: "error" as const,
      message: error instanceof Error ? error.message : "No pudimos cargar la obra.",
    }));

  if (state.status === "not_found") {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado esta obra dentro de tu organización activa."
          actions={<LinkButton href="/app/projects">Volver a obras</LinkButton>}
        />
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ErrorState
          title="No se pudo cargar la obra"
          description="Ha ocurrido un error leyendo el proyecto real de la organización."
          actions={<LinkButton href="/app/projects">Volver a obras</LinkButton>}
        />
      </section>
    );
  }

  if (state.status !== "ready") return null;

  const project = state.item;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-7">
      <PageHeader
        backLink={
          <Link href="/app/projects" className="text-sm font-semibold text-content-secondary hover:text-content-primary">
            ← Volver a obras
          </Link>
        }
        eyebrow={<StatusBadge status={project.status} />}
        title={project.name}
        description="Ficha operativa para entender el estado de la obra, su contexto y los módulos que se conectarán en los próximos incrementos."
        actions={<LinkButton href="/app/projects" variant="secondary">Listado de obras</LinkButton>}
      />

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card padding="lg" variant="surface">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Resumen</p>
          <h2 className="mt-2 font-num text-2xl font-bold tracking-tight">Datos de obra</h2>
          <dl className="mt-6 space-y-5 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Cliente</dt>
              <dd className="mt-1 text-content-primary">{project.clientName ?? "Sin cliente asignado"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Dirección</dt>
              <dd className="mt-1 text-content-secondary">{project.address ?? "Pendiente"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Tipo de obra</dt>
              <dd className="mt-1 text-content-secondary">{project.type ?? "Pendiente"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Creada</dt>
                <dd className="mt-1 text-content-secondary">{formatDate(project.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Actualizada</dt>
                <dd className="mt-1 text-content-secondary">{formatDate(project.updatedAt)}</dd>
              </div>
            </div>
          </dl>
        </Card>

        <Card padding="lg" variant="raised">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Control</p>
          <h2 className="mt-2 font-num text-2xl font-bold tracking-tight">Avance y próximos pasos</h2>
          <p className="mt-2 text-sm leading-6 text-content-secondary">
            Vista inicial para validar el flujo del MVP antes de conectar todos los módulos operativos.
          </p>
          <ProgressBar value={project.progress} showValue label="Avance estimado" className="mt-6" tone="info" />
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <p className="font-semibold text-content-primary">Siguiente decisión</p>
              <p className="mt-2 text-sm leading-5 text-content-secondary">Revisar planificación de fase y tareas críticas.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <p className="font-semibold text-content-primary">Riesgo operativo</p>
              <p className="mt-2 text-sm leading-5 text-content-secondary">Confirmar materiales y documentación pendiente.</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="lg" variant="surface">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Módulos</p>
            <h2 className="mt-2 font-num text-2xl font-bold tracking-tight">Sistema operativo de la obra</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-content-secondary">
            Placeholders para visualizar la navegación futura del MVP privado.
          </p>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {futureSections.map((section) => (
            <div key={section} className="rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.025] p-4">
              <p className="font-semibold text-content-primary">{section}</p>
              <p className="mt-2 text-xs leading-5 text-content-tertiary">Pendiente de conectar en próximos incrementos.</p>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
