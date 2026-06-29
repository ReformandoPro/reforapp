import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { updateClientAction } from "./actions";

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
};

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: clientId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar cliente</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para editar un cliente.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/clients/${clientId}`}>← Volver al cliente</BackLink>
        <EmptyState title="Acceso denegado" description="No tienes permisos para editar clientes." />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id, display_name, email, phone, address, notes")
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId)
    .maybeSingle();

  if (clientError) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar el cliente"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  if (!client) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href="/app/clients">← Volver a clientes</BackLink>
        <EmptyState
          title="Cliente no encontrado"
          description="No hemos encontrado este cliente dentro de tu organización."
        />
      </section>
    );
  }

  const row = client as unknown as ClientRow;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/app/clients/${clientId}`}>← Volver al cliente</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar cliente</h1>

        <form action={updateClientAction} className="mt-6 space-y-6">
          <input type="hidden" name="clientId" value={clientId} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="display_name">Nombre</label>
            <input
              id="display_name"
              name="display_name"
              required
              defaultValue={row.display_name}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="email">Email (opcional)</label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={row.email ?? ""}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="phone">Teléfono (opcional)</label>
              <input
                id="phone"
                name="phone"
                defaultValue={row.phone ?? ""}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="address">Dirección (opcional)</label>
            <input
              id="address"
              name="address"
              defaultValue={row.address ?? ""}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="notes">Notas (opcional)</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={row.notes ?? ""}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
