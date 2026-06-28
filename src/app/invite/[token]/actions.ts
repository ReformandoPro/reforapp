"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/ssr";

type InvitationRow = {
  id: string;
  organization_id: string;
  invitee_email: string;
  invited_role: "admin" | "member";
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
};

function redirectWithStatus(status: "invalid" | "expired" | "used" | "revoked" | "forbidden" | "error"):
  | never {
  const url = new URL("/invite/status", "http://local");
  url.searchParams.set("s", status);
  redirect(url.pathname + url.search);
}

export async function acceptInvitationAction(formData: FormData) {
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    redirectWithStatus("invalid");
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const { data, error } = await supabase
    .from("organization_invitations")
    .select("id, organization_id, invitee_email, invited_role, status, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error || !data) {
    redirectWithStatus("invalid");
  }

  const invitation = data as InvitationRow;

  // Basic state checks.
  const now = Date.now();
  const expiresAt = Date.parse(invitation.expires_at);
  if (Number.isFinite(expiresAt) && expiresAt <= now) {
    redirectWithStatus("expired");
  }

  if (invitation.status === "revoked") {
    redirectWithStatus("revoked");
  }

  if (invitation.status === "accepted") {
    redirectWithStatus("used");
  }

  if (invitation.status !== "pending") {
    redirectWithStatus("error");
  }

  // Optional safety: ensure the logged-in user's email matches the invite.
  const userEmail = String(user.email ?? "");
  if (!userEmail || userEmail.toLowerCase() !== invitation.invitee_email.toLowerCase()) {
    redirectWithStatus("forbidden");
  }

  // Create membership. RLS should enforce tenant integrity.
  // If membership already exists, we treat it as used.
  const { error: membershipError } = await supabase.from("memberships").insert({
    organization_id: invitation.organization_id,
    user_id: user.id,
    role: invitation.invited_role,
  });

  if (membershipError) {
    // Likely unique constraint (already a member) or RLS. Treat as used to prevent replays.
    redirectWithStatus("used");
  }

  // Mark invitation as accepted.
  const { error: acceptError } = await supabase
    .from("organization_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by_user_id: user.id,
    })
    .eq("id", invitation.id);

  if (acceptError) {
    redirectWithStatus("error");
  }

  redirect("/app?inviteAccepted=1");
}
