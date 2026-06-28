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
  phone: string | null;
  email: string | null;
};

export default async function AppClientsPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clientes</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para ver clientes.
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, display_name, phone, email")
    .eq("organization_id", ctx.organizationId)
    .order("display_name", { ascending: true });

  if (error) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los clientes"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const rows = (clients ?? []) as ClientRow[];

  const canWrite = ctx.role === "owner" || ctx.role === "admin";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/app"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver al panel
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clientes</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
              Clientes de tu organización.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge tone="neutral">Total: {rows.length}</Badge>
            {canWrite ? (
              <Link
                href="/app/clients/new"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Nuevo cliente
              </Link>
            ) : null}
          </div>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          description={
            canWrite
              ? "Crea tu primer cliente para asociar obras."
              : "Aún no hay clientes en tu organización."
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Card
              key={c.id}
              className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-0 text-[var(--text-primary)] shadow-none"
            >
              <Link href={`/app/clients/${c.id}`} className="block p-5 hover:bg-[var(--bg-raised)]">
                <p className="text-base font-semibold tracking-tight">{c.display_name}</p>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {c.email ? `Email: ${c.email}` : ""}
                  {c.email && c.phone ? " · " : ""}
                  {c.phone ? `Tel: ${c.phone}` : ""}
                  {!c.email && !c.phone ? "—" : ""}
                </p>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
