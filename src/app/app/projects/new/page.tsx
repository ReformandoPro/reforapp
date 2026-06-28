import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";

export const dynamic = "force-dynamic";

export default async function NewProjectPlaceholderPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>;
}) {
  const { clientId } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nueva obra</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para continuar.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={clientId ? `/app/clients/${clientId}` : "/app/projects"}
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver
      </Link>

      <EmptyState
        title="Nueva obra (próximamente)"
        description={
          canWrite
            ? "Aún no hemos implementado el CRUD de obras."
            : "No tienes permisos para crear obras."
        }
      />

      {clientId ? (
        <p className="text-xs text-[var(--text-tertiary)]">
          Cliente preseleccionado: {clientId}
        </p>
      ) : null}
    </section>
  );
}
