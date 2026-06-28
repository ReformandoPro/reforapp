"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function redirectWithStatus(
  status: "invalid" | "expired" | "used" | "revoked" | "forbidden" | "not_authenticated" | "error"
): never {
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

  const { data, error } = await supabase.rpc("accept_organization_invitation", {
    invitation_token: token,
  });

  if (error) {
    redirectWithStatus("error");
  }

  const status = String(data ?? "error");

  if (status === "accepted") {
    redirect("/app?inviteAccepted=1");
  }

  switch (status) {
    case "invalid":
    case "expired":
    case "used":
    case "revoked":
    case "forbidden":
    case "not_authenticated":
      redirectWithStatus(status);
    default:
      redirectWithStatus("error");
  }
}
