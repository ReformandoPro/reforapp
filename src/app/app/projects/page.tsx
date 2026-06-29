import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardLinkRow } from "@/components/ui/CardLinkRow";
import { BackLink } from "@/components/ui/BackLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import type { ProjectStatus } from "@/lib/domain/projects/status";
import { isProjectStatus } from "@/lib/domain/projects/status";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

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

const statusTones: Record<
  ProjectStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  lead: "neutral",
  budgeting: "info",
  approved: "success",
  scheduled: "info",
  in_progress: "info",
  paused: "warning",
  completed: "success",
  delivered: "success",
  closed: "neutral",
  cancelled: "danger",
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  updated_at: string | null;
  client:
    | {
        display_name: string;
      }
    | { display_name: string }[]
    | null;
};

function normalizeJoinedClient(client: ProjectRow["client"]) {
  if (Array.isArray(client)) {
    return client[0] ?? null;
  }
  return client;
}

export const dynamic = "force-dynamic";

export default async function AppProjectsPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar tus obras
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            {ctx.reason === "missing_membership"
              ? "Tu usuario no tiene acceso a ninguna organización todavía."
              : "Inicia sesión e inténtalo de nuevo."}
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      status,
      updated_at,
      client:clients (
        display_name
      )
    `
    )
    .eq("organization_id", ctx.organizationId)
    .order("updated_at", { ascending: false, nullsFirst: false });

  if (error) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <ErrorState
          title="No pudimos cargar tus obras"
          description="Revisa tu conexión e inténtalo de nuevo."
          actions={
            <Link
              href="/app/projects"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          }
        />
      </section>
    );
  }

  const projects = (data ?? []) as ProjectRow[];
  const canCreate = ctx.role === "owner" || ctx.role === "admin";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<BackLink href="/app">← Volver al panel</BackLink>}
        title="Obras"
        description="Listado de obras de tu organización."
        actions={
          canCreate ? (
            <LinkButton href="/app/projects/new">Nueva obra</LinkButton>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-secondary opacity-70"
              title="No tienes permisos para crear obras"
            >
              Nueva obra
            </button>
          )
        }
      />

      {projects.length === 0 ? (
        <EmptyState
          title="Sin obras todavía"
          description="Cuando crees tu primera obra, aparecerá aquí."
          actions={
            canCreate ? <LinkButton href="/app/projects/new">Nueva obra</LinkButton> : null
          }
        />
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => {
            const joinedClient = normalizeJoinedClient(project.client);
            const status = isProjectStatus(project.status)
              ? project.status
              : null;

            return (
              <CardLinkRow
                key={project.id}
                href={`/app/projects/${project.id}`}
                heading={project.name}
                description={<>Cliente: {joinedClient?.display_name ?? "—"}</>}
                trailing={
                  status ? (
                    <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
                  ) : (
                    <Badge tone="neutral">Estado inválido</Badge>
                  )
                }
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

