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
  updated_at: string | null;
};

export default async function AppClientsPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Clientes
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
    .from("clients")
    .select("id, display_name, email, phone, updated_at")
    .eq("organization_id", ctx.organizationId)
    .order("display_name");

  if (error) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar clientes
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-4">
            <Link
              href="/app/clients"
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const clients = (data ?? []) as ClientRow[];

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Clientes
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              Listado real de clientes de tu organización.
            </p>
          </div>

          {canWrite ? (
            <Link
              href="/app/clients/new"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Nuevo cliente
            </Link>
          ) : null}
        </div>
      </Card>

      {clients.length === 0 ? (
        <EmptyState
          title="Sin clientes todavía"
          description="Cuando crees tu primer cliente, aparecerá aquí."
        />
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card
              key={client.id}
              className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-none"
            >
              <Link
                href={`/app/clients/${client.id}`}
                className="block p-5 hover:bg-[var(--bg-raised)]"
              >
                <p className="text-lg font-semibold tracking-tight">
                  {client.display_name}
                </p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  {client.email ? `Email: ${client.email}` : "Email: —"} ·{" "}
                  {client.phone ? `Tel: ${client.phone}` : "Tel: —"}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

