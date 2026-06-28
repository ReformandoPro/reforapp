"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(message: string): never {
  const url = new URL("/app/clients/new", "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function createClientAction(formData: FormData) {
  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect("/login?redirectTo=/app/clients/new");

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToNewWithError("No tienes permisos para crear clientes.");

  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) backToNewWithError("Nombre es obligatorio.");

  const email = readOptionalText(formData, "email");
  const phone = readOptionalText(formData, "phone");
  const address = readOptionalText(formData, "address");
  const notes = readOptionalText(formData, "notes");

  const supabase = await createServerSupabaseClient();

  const { data: inserted, error } = await supabase
    .from("clients")
    .insert({
      organization_id: ctx.organizationId,
      display_name,
      email,
      phone,
      address,
      notes,
    })
    .select("id")
    .single();

  if (error || !inserted?.id) {
    backToNewWithError("No pudimos crear el cliente.");
  }

  redirect(`/app/clients/${inserted.id}`);
}
