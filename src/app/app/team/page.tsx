import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";

export const dynamic = "force-dynamic";

export default async function AppTeamPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Equipo</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para ver el equipo.
          </p>
        </Card>
      </section>
    );
  }

  const members = await getOrgMembersWithProfiles(ctx.organizationId);
  const canInvite = ctx.role === "owner" || ctx.role === "admin";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/app"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver al panel
        </Link>

        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Equipo</h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
                Directorio básico de miembros de tu organización.
              </p>
            </div>

            <button
              type="button"
              disabled={!canInvite}
              className={`inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                canInvite
                  ? "bg-primary-500 text-white opacity-70"
                  : "border border-subtle bg-bg-surface text-content-secondary opacity-70"
              }`}
              title={
                canInvite
                  ? "Próximamente"
                  : "No tienes permisos para invitar miembros"
              }
            >
              Invitar miembro (próximamente)
            </button>
          </div>
        </Card>
      </div>

      {members.length === 0 ? (
        <EmptyState
          title="Sin miembros"
          description="No hay miembros registrados para esta organización."
        />
      ) : (
        <div className="grid gap-3">
          {members.map((member) => {
            const roleTone =
              member.role === "owner"
                ? "success"
                : member.role === "admin"
                  ? "info"
                  : "neutral";

            return (
              <Card
                key={member.userId}
                className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] shadow-none"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold tracking-tight">
                      {member.displayName || member.email || member.userId}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {member.email ? member.email : "—"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                      ID: {member.userId}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      Teléfono: {member.phone ?? "—"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Badge tone={roleTone}>
                      {member.role === "owner"
                        ? "Owner"
                        : member.role === "admin"
                          ? "Admin"
                          : "Member"}
                    </Badge>
                    {member.userId === ctx.user.id ? <Badge tone="warning">Tú</Badge> : null}
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
