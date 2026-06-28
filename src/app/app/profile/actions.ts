"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backWithError(message: string) {
  const url = new URL("/app/profile", "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function updateMyProfileAction(formData: FormData) {
  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect("/login?redirectTo=/app/profile");
  }

  const display_name = readOptionalText(formData, "display_name") ?? "";
  const phone = readOptionalText(formData, "phone");

  if (display_name.length > 120) {
    backWithError("El nombre es demasiado largo.");
  }

  if (phone && phone.length > 50) {
    backWithError("El teléfono es demasiado largo.");
  }

  const supabase = await createServerSupabaseClient();

  // Ensure profile exists (trigger should handle it, but be defensive).
  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: ctx.user.id,
      display_name,
      phone,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    backWithError("No pudimos guardar tu perfil.");
  }

  redirect("/app/profile");
}
