import Link from "next/link";

import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";
import { updateProject } from "./actions";

export const dynamic = "force-dynamic";

type EditProjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

type ClientRow = {
  id: string;
  display_name: string;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  address: string;
  type: string;
  progress: number;
  client_id: string;
};

const statusLabels: Record<ProjectStatus, string> = {
  lead: "Lead",
  budgeting: "Presupuestando",
  approved: "Aprobada",
  scheduled: "Planificado",
  in_progress: "En curso",
  paused: "En pausa",
  completed: "Completado",
  delivered: "Entregada",
  closed: "Cerrada",
  cancelled: "Cancelado",
};

export default async function EditProjectPage({
  params,
  searchParams,
}: EditProjectPageProps) {
  const { id } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Editar obra
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para editar una obra.
          </p>
          <div className="mt-4">
            <Link
              href={`/login?redirectTo=/app/projects/${id}/edit`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Ir a login
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${id}`}>← Volver al detalle</BackLink>

        <EmptyState
          title="Acceso denegado"
          description="No tienes permisos para editar obras."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, status, address, type, progress, client_id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (projectError) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar la obra
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-4">
            <Link
              href={`/app/projects/${id}/edit`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href="/app/projects">← Volver a obras</BackLink>

        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado esta obra dentro de tu organización."
        />
      </section>
    );
  }

  const projectRow = project as unknown as ProjectRow;

  const { data: clients } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", ctx.organizationId)
    .order("display_name");

  const clientRows = ((clients ?? []) as ClientRow[]) ?? [];
  const currentStatus = PROJECT_STATUSES.includes(projectRow.status as ProjectStatus)
    ? (projectRow.status as ProjectStatus)
    : "in_progress";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/app/projects/${id}`}>← Volver al detalle</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Editar obra
        </h1>
        <p className="mt-2 text-sm text-content-secondary sm:text-base">
          Cambios guardados bajo tu organización (RLS + memberships).
        </p>

        <form action={updateProject} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectRow.id} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Datos de obra</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                required
                defaultValue={projectRow.name}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="status">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  required
                  defaultValue={currentStatus}
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="progress">
                  Progreso
                </label>
                <input
                  id="progress"
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={projectRow.progress}
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                name="address"
                required
                defaultValue={projectRow.address}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="type">
                Tipo
              </label>
              <input
                id="type"
                name="type"
                required
                defaultValue={projectRow.type}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Cliente</h2>
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="clientId">
                Cliente
              </label>
              <select
                id="clientId"
                name="clientId"
                required
                defaultValue={projectRow.client_id}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {clientRows.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.display_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-content-tertiary">
                Solo aparecen clientes de tu organización.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-content-tertiary">
              La organización se deriva de tu sesión. No se puede modificar.
            </p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}

