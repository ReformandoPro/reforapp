"use server";

import { redirect } from "next/navigation";

import type { BudgetLineInput, BudgetStatus } from "@/lib/services/budgets-basic";
import { BUDGET_STATUSES } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(projectId: string, budgetId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/budgets/${budgetId}/edit`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function parseLinesJson(projectId: string, budgetId: string, raw: string | null): BudgetLineInput[] {
  if (!raw) backToEditWithError(projectId, budgetId, "Faltan líneas.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    backToEditWithError(projectId, budgetId, "Líneas inválidas.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    backToEditWithError(projectId, budgetId, "Debe existir al menos una línea.");
  }

  return parsed as BudgetLineInput[];
}

function normalizeStatus(projectId: string, budgetId: string, raw: string): BudgetStatus {
  const value = raw.trim() as BudgetStatus;
  if (!BUDGET_STATUSES.some((s) => s.value === value)) {
    backToEditWithError(projectId, budgetId, "Estado inválido.");
  }
  return value;
}

export async function updateProjectBudgetAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const budgetId = String(formData.get("budgetId") ?? "").trim();
  if (!projectId || !budgetId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/budgets/${budgetId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(projectId, budgetId, "No tienes permisos para editar presupuestos.");

  const title = String(formData.get("title") ?? "").trim();
  if (!title) backToEditWithError(projectId, budgetId, "Título es obligatorio.");

  const status = normalizeStatus(projectId, budgetId, String(formData.get("status") ?? "draft"));
  const notesRaw = String(formData.get("notes") ?? "").trim();
  const notes = notesRaw.length > 0 ? notesRaw : null;

  const lines = parseLinesJson(projectId, budgetId, String(formData.get("linesJson") ?? null));

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToEditWithError(projectId, budgetId, "Obra inválida para tu organización.");
  }

  // Validate budget belongs to org + project.
  const { data: budgetRow, error: budgetError } = await supabase
    .from("project_budgets")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId)
    .maybeSingle();

  if (budgetError || !budgetRow) {
    backToEditWithError(projectId, budgetId, "Presupuesto inválido para esta obra.");
  }

  const { error: updateBudgetError } = await supabase
    .from("project_budgets")
    .update({ title, status, notes })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", budgetId);

  if (updateBudgetError) {
    backToEditWithError(projectId, budgetId, "No pudimos guardar la cabecera.");
  }

  const { data: existingLines, error: existingLinesError } = await supabase
    .from("project_budget_lines")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("budget_id", budgetId);

  if (existingLinesError) {
    backToEditWithError(projectId, budgetId, "No pudimos cargar las líneas actuales.");
  }

  const existingIds = new Set(
    (existingLines ?? []).map((l: { id: string }) => String(l.id))
  );

  const normalized = lines
    .map((line, index) => {
      const description = String(line.description ?? "").trim();
      const id = line.id ? String(line.id) : crypto.randomUUID();
      return {
        id,
        organization_id: ctx.organizationId,
        budget_id: budgetId,
        project_id: projectId,
        description,
        quantity: Number(line.quantity ?? 0),
        unit_price: Number(line.unitPrice ?? 0),
        tax_rate: Number(line.taxRate ?? 21),
        sort_order: Number.isFinite(line.sortOrder) ? Number(line.sortOrder) : index + 1,
      };
    })
    .filter((l) => l.description.length > 0);

  if (normalized.length === 0) {
    backToEditWithError(projectId, budgetId, "Debe existir al menos una línea con concepto.");
  }

  const incomingIds = new Set(normalized.map((l) => l.id));
  const toDelete = Array.from(existingIds).filter((id) => !incomingIds.has(id));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("project_budget_lines")
      .delete()
      .eq("organization_id", ctx.organizationId)
      .eq("project_id", projectId)
      .eq("budget_id", budgetId)
      .in("id", toDelete);

    if (deleteError) {
      backToEditWithError(projectId, budgetId, "No pudimos eliminar líneas.");
    }
  }

  const { error: upsertError } = await supabase
    .from("project_budget_lines")
    .upsert(normalized, { onConflict: "id" });

  if (upsertError) {
    backToEditWithError(projectId, budgetId, "No pudimos guardar las líneas.");
  }

  redirect(`/app/projects/${projectId}/budgets/${budgetId}`);
}
