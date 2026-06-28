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
              Directorio de clientes (lectura). CRUD completo lo añadimos en un módulo aparte.
            </p>
          </div>
          <Badge tone="neutral">Total: {rows.length}</Badge>
        </div>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="Sin clientes" description="Aún no hay clientes en tu organización." />
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <Card
              key={c.id}
              className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] shadow-none"
            >
              <p className="text-base font-semibold tracking-tight">{c.display_name}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {c.email ? `Email: ${c.email}` : ""}
                {c.email && c.phone ? " · " : ""}
                {c.phone ? `Tel: ${c.phone}` : ""}
                {!c.email && !c.phone ? "—" : ""}
              </p>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
