import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";

export const dynamic = "force-dynamic";

export default async function AppOnboardingPage() {
  const ctx = await getOrganizationContextForRequest();

  // If already configured, don't block the user here.
  if (ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/app"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver al panel
        </Link>

        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Onboarding</h1>
            <p className="text-sm text-[var(--text-secondary)] sm:text-base">
              Tu empresa ya está configurada.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Badge tone="success">Organización activa</Badge>
            <Badge tone="neutral">Rol: {ctx.role}</Badge>
          </div>

          <div className="mt-6">
            <Link
              href="/app"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Ir al panel
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  // If user is not authenticated, AppLayout should already redirect to /login.
  // We still show a safe message in case this page is ever reached without auth.
  if (!ctx.ok && ctx.reason !== "missing_membership") {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <EmptyState
          title="No pudimos iniciar el onboarding"
          description="Inicia sesión e inténtalo de nuevo."
        />
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/app"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver al panel
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Configura tu empresa en Reformando
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Para usar la zona privada necesitas crear o unirte a una organización.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Este paso de creación de empresa se implementará en el siguiente ticket.
          </p>

          <button
            type="button"
            disabled
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white opacity-60"
            title="Próximamente"
          >
            Crear empresa (siguiente paso)
          </button>
        </div>
      </Card>
    </section>
  );
}
