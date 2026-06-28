"use server";

import { redirect } from "next/navigation";

import type { PurchaseItemInput, PurchaseStatus } from "@/lib/services/purchases";
import { PURCHASE_STATUSES } from "@/lib/services/purchases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(projectId: string, purchaseId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/purchases/${purchaseId}/edit`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function parseItemsJson(projectId: string, purchaseId: string, raw: string | null): PurchaseItemInput[] {
  if (!raw) backToEditWithError(projectId, purchaseId, "Faltan líneas.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backToEditWithError(projectId, purchaseId, "Líneas inválidas.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    backToEditWithError(projectId, purchaseId, "Debe existir al menos una línea.");
  }

  return parsed as PurchaseItemInput[];
}

function normalizeStatus(projectId: string, purchaseId: string, raw: string): PurchaseStatus {
  const value = raw.trim() as PurchaseStatus;
  if (!PURCHASE_STATUSES.some((s) => s.value === value)) {
    backToEditWithError(projectId, purchaseId, "Estado inválido.");
  }
  return value;
}

export async function updateProjectPurchaseAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const purchaseId = String(formData.get("purchaseId") ?? "").trim();
  if (!projectId || !purchaseId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/purchases/${purchaseId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(projectId, purchaseId, "No tienes permisos para editar pedidos.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToEditWithError(projectId, purchaseId, "Título es obligatorio.");

  const supplierNameRaw = String(formData.get("supplierName") ?? "").trim();
  const supplier_name = supplierNameRaw.length > 0 ? supplierNameRaw : null;

  const status = normalizeStatus(projectId, purchaseId, String(formData.get("status") ?? "planned"));

  const expectedDateRaw = String(formData.get("expectedDate") ?? "").trim();
  const expected_date = expectedDateRaw.length > 0 ? expectedDateRaw : null;

  const receivedDateRaw = String(formData.get("receivedDate") ?? "").trim();
  const received_date = receivedDateRaw.length > 0 ? receivedDateRaw : null;

  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  const items = parseItemsJson(projectId, purchaseId, String(formData.get("itemsJson") ?? null));

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToEditWithError(projectId, purchaseId, "Obra inválida para tu organización.");
  }

  // Validate purchase belongs to org + project.
  const { data: purchaseRow, error: purchaseError } = await supabase
    .from("project_purchases")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError || !purchaseRow) {
    backToEditWithError(projectId, purchaseId, "Pedido inválido para esta obra.");
  }

  const { error: updatePurchaseError } = await supabase
    .from("project_purchases")
    .update({ title, supplier_name, status, expected_date, received_date, notes })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId);

  if (updatePurchaseError) {
    backToEditWithError(projectId, purchaseId, "No pudimos guardar el pedido.");
  }

  const { data: existingItems, error: existingItemsError } = await supabase
    .from("project_purchase_items")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("purchase_id", purchaseId);

  if (existingItemsError) {
    backToEditWithError(projectId, purchaseId, "No pudimos cargar las líneas actuales.");
  }

  const existingIds = new Set((existingItems ?? []).map((l: { id: string }) => String(l.id)));

  const normalized = items
    .map((item, index) => {
      const description = String(item.description ?? "").trim();
      const unit = String(item.unit ?? "").trim();
      const id = item.id ? String(item.id) : crypto.randomUUID();
      return {
        id,
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

  if (normalized.length === 0) {
    backToEditWithError(projectId, purchaseId, "Debe existir al menos una línea con descripción.");
  }

  const incomingIds = new Set(normalized.map((l) => l.id));
  const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("project_purchase_items")
      .delete()
      .eq("organization_id", ctx.organizationId)
      .eq("project_id", projectId)
      .eq("purchase_id", purchaseId)
      .in("id", toDelete);

    if (deleteError) {
      backToEditWithError(projectId, purchaseId, "No pudimos eliminar líneas.");
    }
  }

  const { error: upsertError } = await supabase
    .from("project_purchase_items")
    .upsert(normalized, { onConflict: "id" });

  if (upsertError) {
    backToEditWithError(projectId, purchaseId, "No pudimos guardar las líneas.");
  }

  redirect(`/app/projects/${projectId}/purchases/${purchaseId}`);
}
