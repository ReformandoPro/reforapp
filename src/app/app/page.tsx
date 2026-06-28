import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  archived_at: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AppDashboardPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Panel
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            {ctx.reason === "missing_membership"
              ? "Tu usuario no tiene acceso a ninguna organización todavía."
              : "Inicia sesión e inténtalo de nuevo."}
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  const [{ count: activeProjectsCount }, { count: archivedProjectsCount }, { count: clientsCount }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId)
        .is("archived_at", null),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId)
        .not("archived_at", "is", null),
      supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId),
    ]);

  const { data: lastCreatedProjects } = await supabase
    .from("projects")
    .select("id, name, status, created_at, updated_at, archived_at")
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: false, nullsFirst: false })
    .limit(5);

  const { data: lastUpdatedProjects } = await supabase
    .from("projects")
    .select("id, name, status, created_at, updated_at, archived_at")
    .eq("organization_id", ctx.organizationId)
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(5);

  const createdRows = ((lastCreatedProjects ?? []) as ProjectRow[]) ?? [];
  const updatedRows = ((lastUpdatedProjects ?? []) as ProjectRow[]) ?? [];

  const hasAnyData =
    (activeProjectsCount ?? 0) > 0 ||
    (archivedProjectsCount ?? 0) > 0 ||
    (clientsCount ?? 0) > 0;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Panel</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              Resumen operativo de tu organización.
            </p>
          </div>

          {canWrite ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/app/projects/new"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Nueva obra
              </Link>
              <Link
                href="/app/clients/new"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Nuevo cliente
              </Link>
            </div>
          ) : null}
        </div>
      </Card>

      {!hasAnyData ? (
        <EmptyState
          title="Aún no hay actividad"
          description="Crea tu primera obra o cliente para empezar a ver métricas y actividad reciente."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Obras activas
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {activeProjectsCount ?? 0}
              </p>
              <Link
                href="/app/projects"
                className="mt-3 inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Ver obras
              </Link>
            </Card>

            <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Obras archivadas
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {archivedProjectsCount ?? 0}
              </p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">
                Ocultas por defecto en el listado.
              </p>
            </Card>

            <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                Clientes
              </p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                {clientsCount ?? 0}
              </p>
              <Link
                href="/app/clients"
                className="mt-3 inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Ver clientes
              </Link>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
              <h2 className="text-lg font-semibold tracking-tight">Últimas 5 obras creadas</h2>
              {createdRows.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Aún no hay obras.
                </p>
              ) : (
                <div className="mt-4 grid gap-2">
                  {createdRows.map((project) => (
                    <Link
                      key={project.id}
                      href={`/app/projects/${project.id}`}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:bg-[var(--bg-raised)]"
                    >
                      <p className="text-sm font-semibold">{project.name}</p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Creada: {formatDate(project.created_at)} · Estado: {project.status}
                        {project.archived_at ? " · Archivada" : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>

            <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
              <h2 className="text-lg font-semibold tracking-tight">Últimas 5 obras actualizadas</h2>
              {updatedRows.filter((row) => Boolean(row.updated_at)).length === 0 ? (
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Aún no hay obras con actualizaciones.
                </p>
              ) : (
                <div className="mt-4 grid gap-2">
                  {updatedRows.map((project) => (
                    <Link
                      key={project.id}
                      href={`/app/projects/${project.id}`}
                      className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:bg-[var(--bg-raised)]"
                    >
                      <p className="text-sm font-semibold">{project.name}</p>
                      <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                        Actualizada: {formatDate(project.updated_at)} · Estado: {project.status}
                        {project.archived_at ? " · Archivada" : ""}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </section>
  );
}

