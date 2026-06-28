"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(clientId: string, message: string): never {
  const url = new URL(`/app/clients/${clientId}/edit`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

export async function updateClientAction(formData: FormData) {
  const clientId = String(formData.get("clientId") ?? "").trim();
  if (!clientId) redirect("/app/clients");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/clients/${clientId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(clientId, "No tienes permisos para editar clientes.");

  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) backToEditWithError(clientId, "Nombre es obligatorio.");

  const email = readOptionalText(formData, "email");
  const phone = readOptionalText(formData, "phone");
  const address = readOptionalText(formData, "address");
  const notes = readOptionalText(formData, "notes");

  const supabase = await createServerSupabaseClient();

  // Validate client belongs to org.
  const { data: existing, error: existingError } = await supabase
    .from("clients")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId)
    .maybeSingle();

  if (existingError || !existing) {
    backToEditWithError(clientId, "Cliente inválido para tu organización.");
  }

  const { error: updateError } = await supabase
    .from("clients")
    .update({ display_name, email, phone, address, notes })
    .eq("organization_id", ctx.organizationId)
    .eq("id", clientId);

  if (updateError) {
    backToEditWithError(clientId, "No pudimos guardar el cliente.");
  }

  redirect(`/app/clients/${clientId}`);
}
