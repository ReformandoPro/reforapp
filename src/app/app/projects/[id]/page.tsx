import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProjectStatus } from "@/lib/domain/projects/status";
import { isProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

type AppProjectDetailPageProps = {
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

type ProjectDetailRow = {
  id: string;
  name: string;
  status: string;
  address: string;
  type: string;
  progress: number;
  updated_at: string | null;
  client:
    | {
        display_name: string;
      }
    | { display_name: string }[]
    | null;
};

function normalizeJoinedClient(client: ProjectDetailRow["client"]) {
  if (Array.isArray(client)) {
    return client[0] ?? null;
  }
  return client;
}

function formatUpdatedAt(value: string | null): string {
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

export const dynamic = "force-dynamic";

export default async function AppProjectDetailPage({
  params,
}: AppProjectDetailPageProps) {
  const { id } = await params;
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar la obra
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
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      status,
      address,
      type,
      progress,
      updated_at,
      client:clients (
        display_name
      )
    `
    )
    .eq("organization_id", ctx.organizationId)
    .eq("id", id)
    .maybeSingle();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/app/projects"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a obras
      </Link>

      {error ? (
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar la obra
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-4">
            <Link
              href={`/app/projects/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          </div>
        </Card>
      ) : !data ? (
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador dentro de tu organización."
        />
      ) : (() => {
          const row = data as unknown as ProjectDetailRow;
          const joinedClient = normalizeJoinedClient(row.client);
          const status = isProjectStatus(row.status) ? row.status : null;

          return (
            <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {row.name}
                  </h1>
                  <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
                    Cliente: {joinedClient?.display_name ?? "—"}
                  </p>
                </div>
                {status ? (
                  <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
                ) : (
                  <Badge tone="neutral">Estado inválido</Badge>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="grid gap-4 sm:grid-cols-2 flex-1">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Dirección
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">
                    {row.address}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Tipo
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">
                    {row.type}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Progreso
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">
                    {row.progress}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                    Actualizado
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-primary)]">
                    {formatUpdatedAt(row.updated_at)}
                  </p>
                </div>
                </div>

                {canWrite ? (
                  <div className="sm:pl-4">
                    <Link
                      href={`/app/projects/${id}/edit`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Editar obra
                    </Link>
                  </div>
                ) : null}
              </div>
            </Card>
          );
        })()}
    </section>
  );
}

