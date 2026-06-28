"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(message: string) {
  const url = new URL("/app/clients/new", "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function readRequiredText(formData: FormData, key: string, label: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    backToNewWithError(`${label} es obligatorio.`);
  }
  return value;
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function createClient(formData: FormData) {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    redirect("/login?redirectTo=/app/clients/new");
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToNewWithError("No tienes permisos para crear clientes.");
  }

  const displayName = readRequiredText(formData, "display_name", "Nombre");
  const email = readOptionalText(formData, "email");
  const phone = readOptionalText(formData, "phone");
  const address = readOptionalText(formData, "address");
  const notes = readOptionalText(formData, "notes");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: ctx.organizationId,
      display_name: displayName,
      email,
      phone,
      address,
      notes,
    })
    .select("id")
    .single();

  const clientId = data?.id;
  if (error || !clientId) {
    backToNewWithError("No pudimos crear el cliente.");
  }

  redirect(`/app/clients/${clientId}`);
}

