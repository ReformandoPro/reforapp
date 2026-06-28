import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
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
};

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  updated_at: string | null;
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

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = await params;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Cliente</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver este cliente.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, display_name, email, phone, address, notes")
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState title="No pudimos cargar el cliente" description="Revisa tu conexión e inténtalo." />
      </section>
    );
  }

  if (!client) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/app/clients"
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
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

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, status, updated_at")
    .eq("organization_id", ctx.organizationId)
    .eq("client_id", clientId)
    .order("updated_at", { ascending: false, nullsFirst: false });

  const row = client as unknown as ClientRow;
  const projectRows = (projects ?? []) as ProjectRow[];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/app/clients"
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver a clientes
      </Link>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{row.display_name}</h1>
            <p className="mt-2 text-sm text-content-secondary sm:text-base">
              {row.email ? `Email: ${row.email}` : ""}
              {row.email && row.phone ? " · " : ""}
              {row.phone ? `Tel: ${row.phone}` : ""}
              {!row.email && !row.phone ? "—" : ""}
            </p>
            {row.address ? (
              <p className="mt-2 text-sm text-content-secondary">Dirección: {row.address}</p>
            ) : null}
            {row.notes ? (
              <p className="mt-3 whitespace-pre-wrap text-sm text-content-primary">{row.notes}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <Badge tone="neutral">Obras: {projectRows.length}</Badge>
            {canWrite ? (
              <>
                <Link
                  href={`/app/clients/${clientId}/edit`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Editar cliente
                </Link>
                <Link
                  href={`/app/projects/new?clientId=${clientId}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Nueva obra para este cliente
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Obras asociadas</h2>

        {projectRows.length === 0 ? (
          <p className="mt-3 text-sm text-content-secondary">Este cliente no tiene obras todavía.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {projectRows.map((p) => (
              <Card
                key={p.id}
                className="p-0 shadow-none"
              >
                <Link
                  href={`/app/projects/${p.id}`}
                  className="block p-5 hover:bg-bg-raised"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold tracking-tight">{p.name}</p>
                      <p className="mt-1 text-sm text-content-secondary">
                        Estado: {p.status} · Actualizado: {formatUpdatedAt(p.updated_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
