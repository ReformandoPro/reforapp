import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { createTeamInvitationAction, revokeTeamInvitationAction, updateTeamMemberRoleAction } from "./actions";

export const dynamic = "force-dynamic";

type InvitationRow = {
  id: string;
  invitee_email: string;
  invited_role: "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  created_at: string;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}

export default async function AppTeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; invited?: string; token?: string; updated?: string; revoked?: string }>;
}) {
  const sp = await searchParams;
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Equipo</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver el equipo.
          </p>
        </Card>
      </section>
    );
  }

  const canView = ctx.role === "owner" || ctx.role === "admin";
  if (!canView) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <PageHeader
          backLink={<BackLink href="/app">← Volver al panel</BackLink>}
          title="Equipo"
          description="No tienes permisos para ver el equipo de la organización."
        />
        <EmptyState
          title="Acceso restringido"
          description="Solo owner/admin pueden ver o gestionar el equipo."
        />
      </section>
    );
  }

  const members = await getOrgMembersWithProfiles(ctx.organizationId);
  const canInvite = true;

  const supabase = await createServerSupabaseClient();
  const { data: invitations, error: invitationsError } = await supabase
    .from("organization_invitations")
    .select("id, invitee_email, invited_role, status, expires_at, created_at")
    .eq("organization_id", ctx.organizationId)
    .order("created_at", { ascending: false });

  const invitationRows = (invitationsError ? [] : (invitations ?? [])) as InvitationRow[];
  const pendingInvitations = invitationRows.filter((i) => i.status === "pending");

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<BackLink href="/app">← Volver al panel</BackLink>}
        title="Equipo"
        description="Directorio básico de miembros de tu organización."
      />

      {sp.error ? (
        <Card className="p-4 shadow-none">
          <p className="text-sm text-danger-100">{sp.error}</p>
        </Card>
      ) : null}

      {sp.invited && sp.token ? (
        <Card className="p-5 shadow-none">
          <p className="text-sm font-medium text-content-primary">Invitación creada</p>
          <p className="mt-2 text-sm text-content-secondary">
            Comparte este enlace con la persona invitada:
          </p>
          <p className="mt-2 break-all rounded-xl border border-subtle bg-bg-raised px-3 py-2 font-mono text-xs text-content-primary">
            {`/invite/${sp.token}`}
          </p>
        </Card>
      ) : null}

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Invitar</h2>
        <form action={createTeamInvitationAction} className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Email</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm text-content-primary"
              placeholder="nombre@empresa.com"
            />
          </label>
          <label>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-content-tertiary">Rol</span>
            <select
              name="role"
              defaultValue="member"
              className="mt-2 w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm text-content-primary"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={!canInvite}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear invitación
            </button>
          </div>
        </form>
        {invitationsError ? (
          <p className="mt-3 text-xs text-content-tertiary">
            Invitaciones no disponibles (tabla/RLS no configurada en Supabase todavía).
          </p>
        ) : null}
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Invitaciones pendientes</h2>
        {invitationsError ? (
          <p className="mt-2 text-sm text-content-secondary">No se pudieron cargar.</p>
        ) : pendingInvitations.length === 0 ? (
          <p className="mt-2 text-sm text-content-secondary">Sin invitaciones pendientes.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {pendingInvitations.map((inv) => (
              <Card key={inv.id} className="p-5 shadow-none">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-content-primary">{inv.invitee_email}</p>
                    <p className="mt-1 text-xs text-content-tertiary">
                      Rol: {inv.invited_role} · Expira: {formatDate(inv.expires_at)}
                    </p>
                  </div>
                  <form action={revokeTeamInvitationAction}>
                    <input type="hidden" name="invitationId" value={inv.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-secondary hover:bg-bg-raised"
                    >
                      Revocar
                    </button>
                  </form>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

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
                className="p-5 shadow-none"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold tracking-tight">
                      {member.displayName || member.email || member.userId}
                    </p>
                    <p className="mt-1 text-sm text-content-secondary">
                      {member.email ? member.email : "—"}
                    </p>
                    <p className="mt-1 text-xs text-content-tertiary">
                      ID: {member.userId}
                    </p>
                    <p className="mt-2 text-sm text-content-secondary">
                      Teléfono: {member.phone ?? "—"}
                    </p>
                    <p className="mt-2 text-sm text-content-secondary">
                      Alta: {formatDate(member.joinedAt)}
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
                    {ctx.role === "owner" && member.userId !== ctx.user.id && member.role !== "owner" ? (
                      <form action={updateTeamMemberRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={member.userId} />
                        <select
                          name="role"
                          defaultValue={member.role}
                          className="min-h-11 rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm text-content-primary"
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-secondary hover:bg-bg-raised"
                        >
                          Guardar
                        </button>
                      </form>
                    ) : null}
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
