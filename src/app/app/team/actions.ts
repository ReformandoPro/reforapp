"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { canChangeMemberRole, isInvitationRole, isMembershipRole } from "@/lib/services/team-permissions";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToTeamWithError(message: string): never {
  const url = new URL("/app/team", "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
  throw new Error("unreachable");
}

function backToTeamWithNotice(key: string, value = "1"): never {
  const url = new URL("/app/team", "http://local");
  url.searchParams.set(key, value);
  redirect(url.pathname + url.search);
  throw new Error("unreachable");
}

export async function createTeamInvitationAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "member").trim();

  if (!email || !email.includes("@")) {
    backToTeamWithError("Introduce un email válido.");
  }

  if (!isInvitationRole(role)) {
    backToTeamWithError("Rol inválido.");
  }

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect("/login?redirectTo=/app/team");
  }

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    backToTeamWithError("No tienes permisos para invitar miembros.");
  }

  const supabase = await createServerSupabaseClient();

  const token = crypto.randomBytes(32).toString("hex");
  const token_hash = crypto.createHash("sha256").update(token).digest("hex");

  const { error } = await supabase.from("organization_invitations").insert({
    organization_id: ctx.organizationId,
    invitee_email: email,
    invited_role: role,
    token_hash,
    created_by_user_id: ctx.user.id,
  });

  if (error) {
    backToTeamWithError(
      "No pudimos crear la invitación. Revisa si ya existe una invitación pendiente para ese email."
    );
  }

  const url = new URL("/app/team", "http://local");
  url.searchParams.set("invited", "1");
  url.searchParams.set("token", token);
  redirect(url.pathname + url.search);
}

export async function revokeTeamInvitationAction(formData: FormData) {
  const invitationId = String(formData.get("invitationId") ?? "").trim();
  if (!invitationId) backToTeamWithError("Invitación inválida.");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect("/login?redirectTo=/app/team");
  }

  if (ctx.role !== "owner" && ctx.role !== "admin") {
    backToTeamWithError("No tienes permisos para revocar invitaciones.");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("organization_invitations")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      revoked_by_user_id: ctx.user.id,
    })
    .eq("organization_id", ctx.organizationId)
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) {
    backToTeamWithError("No pudimos revocar la invitación.");
  }

  backToTeamWithNotice("revoked");
}

export async function updateTeamMemberRoleAction(formData: FormData) {
  const targetUserId = String(formData.get("userId") ?? "").trim();
  const nextRole = String(formData.get("role") ?? "").trim();

  if (!targetUserId) backToTeamWithError("Miembro inválido.");
  if (!isMembershipRole(nextRole)) backToTeamWithError("Rol inválido.");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect("/login?redirectTo=/app/team");
  }

  const supabase = await createServerSupabaseClient();

  const { data: membership, error: membershipError } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (membershipError || !membership) {
    backToTeamWithError("No pudimos localizar el miembro en esta organización.");
  }

  const currentRole = String((membership as { role: string }).role);
  if (!isMembershipRole(currentRole)) {
    backToTeamWithError("Rol actual inválido.");
  }

  const permission = canChangeMemberRole({
    actorRole: ctx.role,
    actorUserId: ctx.user.id,
    targetUserId,
    targetCurrentRole: currentRole,
    nextRole,
  });

  if (!permission.ok) {
    backToTeamWithError(permission.message);
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ role: nextRole })
    .eq("organization_id", ctx.organizationId)
    .eq("user_id", targetUserId);

  if (updateError) {
    backToTeamWithError("No pudimos actualizar el rol.");
  }

  backToTeamWithNotice("updated");
}
