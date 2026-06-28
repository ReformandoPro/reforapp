"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToOnboardingWithError(message: string): never {
  const url = new URL("/app/onboarding", "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function createOrganizationAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    backToOnboardingWithError("El nombre de la empresa es obligatorio.");
  }

  const ctx = await getOrganizationContextForRequest();
  if (ctx.ok) {
    // Already configured; avoid duplicates.
    redirect("/app/onboarding");
  }

  if (ctx.reason !== "missing_membership") {
    redirect("/login?redirectTo=/app/onboarding");
  }

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?redirectTo=/app/onboarding");
  }

  // Defense-in-depth: if memberships exist, do not create another org.
  const { data: memberships, error: membershipsError } = await supabase
    .from("memberships")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1);

  if (membershipsError) {
    backToOnboardingWithError("No pudimos verificar tu organización. Inténtalo de nuevo.");
  }

  if ((memberships ?? []).length > 0) {
    redirect("/app/onboarding");
  }

  const baseSlug = slugify(name) || "empresa";
  const suffix = crypto.randomBytes(2).toString("hex");
  const slug = `${baseSlug}-${suffix}`;

  // Insert organization. Some schemas may require slug; others may not have it.
  const insertOrgWithSlug = async () =>
    supabase
      .from("organizations")
      .insert({ name, slug })
      .select("id")
      .single();

  const insertOrgWithoutSlug = async () =>
    supabase.from("organizations").insert({ name }).select("id").single();

  const { data: orgWithSlug, error: orgWithSlugError } = await insertOrgWithSlug();

  let organizationId: string | null = orgWithSlug?.id ?? null;

  if (orgWithSlugError) {
    const message = String(orgWithSlugError.message ?? "");

    // If slug column doesn't exist, retry without it.
    if (message.includes("column") && message.includes("slug") && message.includes("does not exist")) {
      const { data: orgWithoutSlug, error: orgWithoutSlugError } = await insertOrgWithoutSlug();
      if (orgWithoutSlugError || !orgWithoutSlug?.id) {
        backToOnboardingWithError("No pudimos crear la empresa. Inténtalo de nuevo.");
      }
      organizationId = orgWithoutSlug.id;
    } else {
      backToOnboardingWithError("No pudimos crear la empresa. Inténtalo de nuevo.");
    }
  }

  if (!organizationId) {
    backToOnboardingWithError("No pudimos crear la empresa. Inténtalo de nuevo.");
  }

  const { error: membershipInsertError } = await supabase.from("memberships").insert({
    organization_id: organizationId,
    user_id: user.id,
    role: "owner",
  });

  if (membershipInsertError) {
    backToOnboardingWithError(
      "Creamos la empresa, pero no pudimos asignarte acceso. Contacta con soporte."
    );
  }

  const url = new URL("/app/onboarding", "http://local");
  url.searchParams.set("created", "1");
  redirect(url.pathname + url.search);
}
