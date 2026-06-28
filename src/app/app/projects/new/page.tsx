import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PROJECT_STATUSES, type ProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { createProjectWithOptionalQuickClient } from "./actions";

export const dynamic = "force-dynamic";

type NewProjectPageProps = {
  searchParams: Promise<{ error?: string; clientId?: string }>;
};

type ClientRow = {
  id: string;
  display_name: string;
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

export default async function NewProjectPage({ searchParams }: NewProjectPageProps) {
  const { error, clientId } = await searchParams;

  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nueva obra</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para crear una obra.
          </p>
          <div className="mt-4">
            <Link
              href="/login?redirectTo=/app/projects/new"
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
        <Link
          href="/app/projects"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a obras
        </Link>

        <EmptyState title="Acceso denegado" description="No tienes permisos para crear obras." />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", ctx.organizationId)
    .order("display_name");

  const clientRows = ((clients ?? []) as ClientRow[]) ?? [];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/app/projects"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a obras
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nueva obra</h1>
          <p className="text-sm text-[var(--text-secondary)] sm:text-base">
            Crea una obra real para tu organización.
          </p>
        </div>

        <form action={createProjectWithOptionalQuickClient} className="mt-6 space-y-6">
          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
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
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  defaultValue="in_progress"
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
                  defaultValue={0}
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
                placeholder="Ej: Reforma integral"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Cliente</h2>

            {clientsError ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No pudimos cargar clientes. Inténtalo de nuevo.
              </p>
            ) : null}

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="clientId">
                Cliente existente
              </label>
              <select
                id="clientId"
                name="clientId"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                defaultValue={clientId ?? ""}
              >
                <option value="">— Selecciona un cliente —</option>
                {clientRows.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.display_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-tertiary)]">
                Debes seleccionar un cliente o crear uno nuevo.
              </p>
            </div>

            <details className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Crear cliente rápido
              </summary>
              <div className="mt-4 space-y-4">
                <input type="hidden" name="quickClientEnabled" value="" />
                <div className="flex items-center gap-2">
                  <input
                    id="quickClientEnabled"
                    name="quickClientEnabled"
                    type="checkbox"
                    className="h-4 w-4"
                  />
                  <label htmlFor="quickClientEnabled" className="text-sm">
                    Crear un cliente nuevo ahora
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="quickClientDisplayName">
                      Nombre del cliente
                    </label>
                    <input
                      id="quickClientDisplayName"
                      name="quickClientDisplayName"
                      className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      placeholder="Ej: María García"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="quickClientEmail">
                      Email (opcional)
                    </label>
                    <input
                      id="quickClientEmail"
                      name="quickClientEmail"
                      type="email"
                      className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="quickClientPhone">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="quickClientPhone"
                    name="quickClientPhone"
                    className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </div>

                <p className="text-xs text-[var(--text-tertiary)]">
                  Este cliente se creará dentro de tu organización.
                </p>
              </div>
            </details>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear obra
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
