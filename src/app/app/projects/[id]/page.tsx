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
import { getProjectOperationalSummary } from "@/lib/services/project-operational-summary";
import { createSupabaseProjectsReader, toProjectDetailState } from "@/lib/services/private-projects";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

function shortDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(value));
}

function BlockError({ message }: { message: string }) {
  return <p className="mt-4 rounded-xl border border-danger-500/20 bg-danger-500/10 p-3 text-sm text-danger-100">{message}</p>;
}

function EmptyCopy({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-sm leading-6 text-content-secondary">{children}</p>;
}

function formatMarginStatus(status: "healthy" | "risk" | "loss" | "unknown") {
  switch (status) {
    case "healthy":
      return "Va bien";
    case "risk":
      return "En riesgo";
    case "loss":
      return "En pérdidas";
    case "unknown":
      return "Sin aceptado";
  }
}

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
    .catch((error: unknown) => {
      console.error("Project detail query failed", error);

      return {
        status: "error" as const,
        message: "No pudimos cargar la obra.",
      };
    });

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
          description={state.message}
          actions={<LinkButton href="/app/projects">Volver a obras</LinkButton>}
        />
      </section>
    );
  }

  if (state.status !== "ready") return null;

  const project = state.item;
  const summary = await getProjectOperationalSummary({
    supabase,
    organizationId: ctx.organizationId,
    projectId: project.id,
    currentProgress: project.progress,
  });

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
        description={`${project.clientName ?? "Cliente sin asignar"} · ${project.address ?? "Dirección pendiente"}`}
        actions={
          <>
            <LinkButton href={`/app/projects/${project.id}/edit`} variant="secondary">Editar obra</LinkButton>
            <LinkButton href="/app/projects" variant="ghost">Listado</LinkButton>
          </>
        }
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
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">Tipo</dt>
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
          <h2 className="mt-2 font-num text-2xl font-bold tracking-tight">Cómo va esta obra</h2>
          <ProgressBar value={project.progress} showValue label="Avance actual" className="mt-6" tone="info" />
          {summary.progress.status === "error" ? (
            <BlockError message={summary.progress.message} />
          ) : summary.progress.data.latest ? (
            <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <p className="text-sm font-semibold text-content-primary">Último avance: {summary.progress.data.latest.progress}%</p>
              <p className="mt-2 text-sm text-content-secondary">{summary.progress.data.latest.note ?? "Sin nota asociada."}</p>
              <p className="mt-3 text-xs text-content-tertiary">{formatDate(summary.progress.data.latest.created_at)}</p>
            </div>
          ) : (
            <EmptyCopy>No hay avances registrados todavía.</EmptyCopy>
          )}
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card padding="lg" variant="surface">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Tareas</p>
              <h2 className="mt-2 text-xl font-semibold">Qué requiere atención</h2>
            </div>
            <LinkButton href={`/app/projects/${project.id}/tasks`} variant="ghost">Ver</LinkButton>
          </div>
          {summary.tasks.status === "error" ? <BlockError message={summary.tasks.message} /> : (
            <>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-white/[0.03] p-3"><p className="font-num text-2xl font-bold">{summary.tasks.data.open}</p><p className="text-content-tertiary">Abiertas</p></div>
                <div className="rounded-xl bg-white/[0.03] p-3"><p className="font-num text-2xl font-bold">{summary.tasks.data.inProgress}</p><p className="text-content-tertiary">En curso</p></div>
                <div className="rounded-xl bg-white/[0.03] p-3"><p className="font-num text-2xl font-bold">{summary.tasks.data.completed}</p><p className="text-content-tertiary">Hechas</p></div>
              </div>
              {summary.tasks.data.next.length === 0 ? <EmptyCopy>No hay tareas pendientes.</EmptyCopy> : (
                <ul className="mt-4 space-y-2 text-sm text-content-secondary">
                  {summary.tasks.data.next.map((task) => <li key={task.id}>• {task.title} <span className="text-content-tertiary">{shortDate(task.due_date)}</span></li>)}
                </ul>
              )}
            </>
          )}
        </Card>

        <Card padding="lg" variant="surface">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Fases</p><h2 className="mt-2 text-xl font-semibold">Planificación</h2></div>
            <LinkButton href={`/app/projects/${project.id}/phases`} variant="ghost">Ver</LinkButton>
          </div>
          {summary.phases.status === "error" ? <BlockError message={summary.phases.message} /> : (
            <div className="mt-5">
              <p className="font-num text-4xl font-bold">{summary.phases.data.count}</p>
              {summary.phases.data.current ? <p className="mt-3 text-sm text-content-secondary">Fase actual: <span className="text-content-primary">{summary.phases.data.current.title}</span></p> : <EmptyCopy>No hay fases definidas todavía.</EmptyCopy>}
            </div>
          )}
        </Card>

        <Card padding="lg" variant="surface">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Presupuesto</p><h2 className="mt-2 text-xl font-semibold">Importe principal</h2></div>
            <LinkButton href={`/app/projects/${project.id}/budgets`} variant="ghost">Ver</LinkButton>
          </div>
          {summary.budget.status === "error" ? <BlockError message={summary.budget.message} /> : summary.budget.data.main ? (
            <div className="mt-5"><p className="font-num text-3xl font-bold">{summary.budget.data.main.formattedTotal}</p><p className="mt-2 text-sm text-content-secondary">{summary.budget.data.main.title} · {summary.budget.data.main.status}</p></div>
          ) : <EmptyCopy>No hay presupuestos todavía.</EmptyCopy>}
        </Card>

        <Card padding="lg" variant="surface">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Costes</p><h2 className="mt-2 text-xl font-semibold">Gasto acumulado</h2></div>
            <LinkButton href={`/app/projects/${project.id}/costs`} variant="ghost">Ver</LinkButton>
          </div>
          {summary.costs.status === "error" ? <BlockError message={summary.costs.message} /> : <p className="mt-5 font-num text-3xl font-bold">{summary.costs.data.formattedTotal}</p>}
        </Card>

        <Card padding="lg" variant="surface">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Economía</p><h2 className="mt-2 text-xl font-semibold">Margen estimado</h2></div>
            <LinkButton href={`/app/projects/${project.id}/costs`} variant="ghost">Ver</LinkButton>
          </div>
          {summary.margin.status === "error" ? (
            <BlockError message={summary.margin.message} />
          ) : (
            <div className="mt-5">
              <p className="font-num text-3xl font-bold">{summary.margin.data.formattedMarginAmount}</p>
              <p className="mt-2 text-sm text-content-secondary">
                {summary.margin.data.marginPercent == null ? "—" : `${summary.margin.data.marginPercent.toFixed(1)}%`} · {formatMarginStatus(summary.margin.data.status)}
              </p>
              <p className="mt-2 text-xs text-content-tertiary">
                Presupuesto: {summary.margin.data.formattedBudgetTotal} · Costes: {summary.margin.data.formattedRealCostTotal}
              </p>
            </div>
          )}
        </Card>

        <Card padding="lg" variant="surface">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Compras</p><h2 className="mt-2 text-xl font-semibold">Pendientes y últimas</h2></div>
            <LinkButton href={`/app/projects/${project.id}/purchases`} variant="ghost">Ver</LinkButton>
          </div>
          {summary.purchases.status === "error" ? <BlockError message={summary.purchases.message} /> : (
            <><p className="mt-5 font-num text-3xl font-bold">{summary.purchases.data.pending}</p><p className="text-sm text-content-secondary">compras pendientes</p>{summary.purchases.data.latest.length === 0 ? <EmptyCopy>No hay compras todavía.</EmptyCopy> : <ul className="mt-4 space-y-2 text-sm text-content-secondary">{summary.purchases.data.latest.map((purchase) => <li key={purchase.id}>• {purchase.title} <span className="text-content-tertiary">{purchase.supplier_name ?? "Sin proveedor"}</span></li>)}</ul>}</>
          )}
        </Card>

        <Card padding="lg" variant="surface">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Documentos</p><h2 className="mt-2 text-xl font-semibold">Archivo de obra</h2></div>
            <LinkButton href={`/app/projects/${project.id}/documents`} variant="ghost">Ver</LinkButton>
          </div>
          {summary.documents.status === "error" ? <BlockError message={summary.documents.message} /> : (
            <><p className="mt-5 font-num text-3xl font-bold">{summary.documents.data.count}</p>{summary.documents.data.latest.length === 0 ? <EmptyCopy>No hay documentos todavía.</EmptyCopy> : <ul className="mt-4 space-y-2 text-sm text-content-secondary">{summary.documents.data.latest.map((doc) => <li key={doc.id}>• {doc.file_name} <span className="text-content-tertiary">{shortDate(doc.created_at)}</span></li>)}</ul>}</>
          )}
        </Card>
      </div>
    </section>
  );
}
