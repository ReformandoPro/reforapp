import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { addProjectProgressUpdateAction } from "./actions";

export const dynamic = "force-dynamic";

type ProgressRow = {
  id: string;
  author_user_id: string;
  progress: number;
  note: string;
  created_at: string;
};

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default async function AppProjectProgressPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: projectId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Avances</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver avances.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, progress")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los avances"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

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

  const members = await getOrgMembersWithProfiles(ctx.organizationId);
  const labelByUserId = new Map(members.map((m) => [m.userId, m.label] as const));

  const { data: updates, error: updatesError } = await supabase
    .from("project_progress_updates")
    .select("id, author_user_id, progress, note, created_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (updatesError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los avances"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const rows = (updates ?? []) as ProgressRow[];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<BackLink href={`/app/projects/${projectId}`}>← Volver a la obra</BackLink>}
        title={<>Avances · {project.name}</>}
        description="Registro cronológico de avances de obra."
        actions={<Badge tone="info">Progreso actual: {project.progress}%</Badge>}
      />

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Añadir avance</h2>

        {!canWrite ? (
          <p className="mt-2 text-sm text-content-secondary">
            No tienes permisos para registrar avances.
          </p>
        ) : (
          <form action={addProjectProgressUpdateAction} className="mt-4 space-y-5">
            <input type="hidden" name="projectId" value={projectId} />

            {error ? (
              <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
                {error}
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-sm font-medium" htmlFor="progress">
                  Progreso (0-100)
                </label>
                <input
                  id="progress"
                  name="progress"
                  type="number"
                  min={0}
                  max={100}
                  required
                  defaultValue={project.progress}
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium" htmlFor="note">
                  Nota
                </label>
                <input
                  id="note"
                  name="note"
                  required
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  placeholder="Ej: Finalizada demolición, empezamos replanteo"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-content-tertiary">
                Se valida organización/obra en servidor. Solo owner/admin.
              </p>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Guardar avance
              </button>
            </div>
          </form>
        )}
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin avances"
          description={
            canWrite
              ? "Registra el primer avance para esta obra."
              : "Aún no hay avances registrados."
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((update) => {
            const authorLabel = labelByUserId.get(update.author_user_id) ?? update.author_user_id;
            return (
              <Card
                key={update.id}
                className="border border-subtle bg-bg-surface p-5 text-content-primary shadow-none"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold tracking-tight">{update.progress}%</p>
                    <p className="mt-1 text-sm text-content-secondary">{update.note}</p>
                    <p className="mt-2 text-xs text-content-tertiary">
                      {formatDateTime(update.created_at)} · {authorLabel}
                    </p>
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
