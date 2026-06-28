"use server";

import { redirect } from "next/navigation";

import type { PurchaseItemInput, PurchaseStatus } from "@/lib/services/purchases";
import { PURCHASE_STATUSES } from "@/lib/services/purchases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToNewWithError(projectId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/purchases/new`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function parseItemsJson(projectId: string, raw: string | null): PurchaseItemInput[] {
  if (!raw) backToNewWithError(projectId, "Faltan líneas.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backToNewWithError(projectId, "Líneas inválidas.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    backToNewWithError(projectId, "Debe existir al menos una línea.");
  }

  return parsed as PurchaseItemInput[];
}

function normalizeStatus(projectId: string, raw: string): PurchaseStatus {
  const value = raw.trim() as PurchaseStatus;
  if (!PURCHASE_STATUSES.some((s) => s.value === value)) {
    backToNewWithError(projectId, "Estado inválido.");
  }
  return value;
}

export async function createProjectPurchaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/purchases/new`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToNewWithError(projectId, "No tienes permisos para crear pedidos.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToNewWithError(projectId, "Título es obligatorio.");

  const supplierNameRaw = String(formData.get("supplierName") ?? "").trim();
  const supplier_name = supplierNameRaw.length > 0 ? supplierNameRaw : null;

  const status = normalizeStatus(projectId, String(formData.get("status") ?? "planned"));

  const expectedDateRaw = String(formData.get("expectedDate") ?? "").trim();
  const expected_date = expectedDateRaw.length > 0 ? expectedDateRaw : null;

  const receivedDateRaw = String(formData.get("receivedDate") ?? "").trim();
  const received_date = receivedDateRaw.length > 0 ? receivedDateRaw : null;

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  const items = parseItemsJson(projectId, String(formData.get("itemsJson") ?? null));

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToNewWithError(projectId, "Obra inválida para tu organización.");
  }

  const purchaseId = crypto.randomUUID();

  const { error: insertPurchaseError } = await supabase.from("project_purchases").insert({
    id: purchaseId,
    organization_id: ctx.organizationId,
    project_id: projectId,
    created_by_user_id: ctx.user.id,
    title,
    supplier_name,
    status,
    expected_date,
    received_date,
    notes,
  });

  if (insertPurchaseError) {
    backToNewWithError(projectId, "No pudimos crear el pedido.");
  }

  const normalizedItems = items
    .map((item, index) => {
      const description = String(item.description ?? "").trim();
      const unit = String(item.unit ?? "").trim();
      return {
        id: crypto.randomUUID(),
        organization_id: ctx.organizationId,
        purchase_id: purchaseId,
        project_id: projectId,
        description,
        quantity: Number(item.quantity ?? 0),
        unit: unit.length > 0 ? unit : null,
        unit_price: Number(item.unitPrice ?? 0),
        tax_rate: Number(item.taxRate ?? 21),
        sort_order: Number.isFinite(item.sortOrder) ? Number(item.sortOrder) : index + 1,
      };
    })
    .filter((i) => i.description.length > 0);

  if (normalizedItems.length === 0) {
    backToNewWithError(projectId, "Debe existir al menos una línea con descripción.");
  }

  const { error: insertItemsError } = await supabase.from("project_purchase_items").insert(normalizedItems);

  if (insertItemsError) {
    await supabase
      .from("project_purchases")
      .delete()
      .eq("organization_id", ctx.organizationId)
      .eq("project_id", projectId)
      .eq("id", purchaseId);

    backToNewWithError(projectId, "No pudimos guardar las líneas.");
  }

  redirect(`/app/projects/${projectId}/purchases/${purchaseId}`);
}
