import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackLink } from "@/components/ui/BackLink";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";

import { createInvitationAction, createOrganizationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; invited?: string; inviteError?: string }>;
}) {
  const { created, error, invited, inviteError } = await searchParams;
  const ctx = await getOrganizationContextForRequest();

  // If already configured, don't block the user here.
  if (ctx.ok) {
    const canManageInvitations = ctx.role === "owner" || ctx.role === "admin";

    const invitations: Array<{
      id: string;
      invitee_email: string;
      invited_role: string;
      status: string;
      expires_at: string;
      created_at: string;
    }> = canManageInvitations
      ? await (async () => {
          const supabase = await createServerSupabaseClient();
          const { data } = await supabase
            .from("organization_invitations")
            .select("id, invitee_email, invited_role, status, expires_at, created_at")
            .eq("organization_id", ctx.organizationId)
            .order("created_at", { ascending: false });
          return (data ?? []) as Array<{
            id: string;
            invitee_email: string;
            invited_role: string;
            status: string;
            expires_at: string;
            created_at: string;
          }>;
        })()
      : [];

    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href="/app">← Volver al panel</BackLink>

        <Card className="p-6 shadow-none">
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Onboarding</h1>
            <p className="text-sm text-content-secondary sm:text-base">
              Tu empresa ya está configurada.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {created === "1" ? (
              <Badge tone="success">Empresa creada</Badge>
            ) : (
              <Badge tone="success">Organización activa</Badge>
            )}
            {invited === "1" ? <Badge tone="success">Invitación creada</Badge> : null}
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

        {canManageInvitations ? (
          <Card className="p-6 shadow-none">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold tracking-tight">Invitar equipo</h2>
              <p className="text-sm text-content-secondary">
                Aún no enviamos emails automáticamente. Crea la invitación y (en el siguiente ticket) se podrá
                aceptar desde un enlace.
              </p>
            </div>

            <form action={createInvitationAction} className="mt-6 space-y-6">
              {inviteError ? (
                <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
                  {inviteError}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="persona@empresa.com"
                    className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </div>

                <div className="space-y-1 sm:col-span-1">
                  <label className="text-sm font-medium" htmlFor="role">
                    Rol
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="member"
                    className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <option value="member">Miembro</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Crear invitación
                </button>
              </div>
            </form>

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-content-secondary">Invitaciones</h3>

              {invitations.length === 0 ? (
                <p className="mt-2 text-sm text-content-tertiary">Todavía no hay invitaciones.</p>
              ) : (
                <div className="mt-3 overflow-x-auto rounded-xl border border-subtle">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-bg-raised text-content-secondary">
                      <tr>
                        <th className="px-3 py-2 font-medium">Email</th>
                        <th className="px-3 py-2 font-medium">Rol</th>
                        <th className="px-3 py-2 font-medium">Estado</th>
                        <th className="px-3 py-2 font-medium">Expira</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {invitations.map((inv) => (
                        <tr key={inv.id} className="bg-bg-surface">
                          <td className="px-3 py-2 text-content-primary">{inv.invitee_email}</td>
                          <td className="px-3 py-2 text-content-secondary">{inv.invited_role}</td>
                          <td className="px-3 py-2 text-content-secondary">{inv.status}</td>
                          <td className="px-3 py-2 text-content-secondary">
                            {new Date(inv.expires_at).toLocaleString("es-ES", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>
        ) : null}
      </section>
    );
  }

  // If user is not authenticated, AppLayout should already redirect to /login.
  // We still show a safe message in case this page is ever reached without auth.
  if (ctx.reason !== "missing_membership") {
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
      <BackLink href="/app">← Volver al panel</BackLink>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Configura tu empresa en Reformando
          </h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Para usar la zona privada necesitas crear o unirte a una organización.
          </p>
        </div>

        <form action={createOrganizationAction} className="mt-6 space-y-6">
          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="name">
              Nombre de la empresa
            </label>
            <input
              id="name"
              name="name"
              required
              placeholder="Ej: Reformas García SL"
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
            <p className="text-xs text-content-tertiary">
              Próximo paso: invitar equipo y crear tu primera obra.
            </p>
            <p className="mt-2 text-sm">
              <Link
                href="/app/onboarding/first-project"
                className="font-medium text-content-secondary hover:text-content-primary"
              >
                Ir al asistente para crear la primera obra
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear empresa
            </button>

            <button
              type="button"
              disabled
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-5 py-2 text-sm font-medium text-content-secondary opacity-70"
              title="Siguiente ticket"
            >
              Invitar equipo (siguiente paso)
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
