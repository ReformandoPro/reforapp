"use server";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function isAllowedRedirectTo(value: string): boolean {
  return value === "/app" || value.startsWith("/app/");
}

export async function loginWithPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/app");

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    const url = new URL("/login", "http://local");
    url.searchParams.set("error", "1");
    url.searchParams.set("redirectTo", isAllowedRedirectTo(redirectTo) ? redirectTo : "/app");
    redirect(url.pathname + url.search);
  }

  redirect(isAllowedRedirectTo(redirectTo) ? redirectTo : "/app");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

