"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/app/projects");

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const url = new URL("/login", "http://local");
    url.searchParams.set("error", "1");
    url.searchParams.set(
      "redirectTo",
      redirectTo.startsWith("/app") ? redirectTo : "/app/projects"
    );
    redirect(url.pathname + url.search);
  }

  redirect(redirectTo.startsWith("/app") ? redirectTo : "/app/projects");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

