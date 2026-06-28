import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  updated_at: string | null;
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  updated_at: string | null;
  archived_at: string | null;
};

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

export default async function AppClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Cliente
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

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, display_name, email, phone, address, notes, updated_at")
    .eq("organization_id", ctx.organizationId)
    .eq("id", id)
    .maybeSingle();

  if (clientError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar el cliente
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-4">
            <Link
              href={`/app/clients/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  if (!client) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/app/clients"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a clientes
        </Link>

        <EmptyState
          title="Cliente no encontrado"
          description="No hemos encontrado este cliente dentro de tu organización."
        />
      </section>
    );
  }

  const clientRow = client as unknown as ClientRow;

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, updated_at, archived_at")
    .eq("organization_id", ctx.organizationId)
    .eq("client_id", clientRow.id)
    .order("updated_at", { ascending: false, nullsFirst: false });

  const projectRows = ((projects ?? []) as ProjectRow[]) ?? [];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/app/clients"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a clientes
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {clientRow.display_name}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              {clientRow.email ? `Email: ${clientRow.email}` : "Email: —"} ·{" "}
              {clientRow.phone ? `Tel: ${clientRow.phone}` : "Tel: —"}
            </p>
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              Actualizado: {formatUpdatedAt(clientRow.updated_at)}
            </p>
          </div>

          {canWrite ? (
            <div className="flex flex-col gap-2">
              <Link
                href={`/app/clients/${clientRow.id}/edit`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Editar cliente
              </Link>
              <Link
                href={`/app/projects/new?clientId=${clientRow.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Nueva obra para este cliente
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Dirección
            </p>
            <p className="mt-1 text-sm text-[var(--text-primary)]">
              {clientRow.address ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
              Notas
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-primary)]">
              {clientRow.notes ?? "—"}
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Obras asociadas</h2>
        {projectRows.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Este cliente aún no tiene obras.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {projectRows.map((project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 hover:bg-[var(--bg-raised)]"
              >
                <p className="text-sm font-semibold">{project.name}</p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Estado: {project.status} · Actualizado: {formatUpdatedAt(project.updated_at)}
                  {project.archived_at ? " · Archivada" : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

