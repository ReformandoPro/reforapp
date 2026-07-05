"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { validateProjectBudgetFormPayload } from "@/lib/services/project-budgets-validation";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToEditWithError(projectId: string, budgetId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/budgets/${budgetId}/edit`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

export async function updateProjectBudgetAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const budgetId = String(formData.get("budgetId") ?? "").trim();
  if (!projectId || !budgetId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/budgets/${budgetId}/edit`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) backToEditWithError(projectId, budgetId, "No tienes permisos para editar presupuestos.");

  const validated = validateProjectBudgetFormPayload({
    title: formData.get("title"),
    status: formData.get("status"),
    notes: formData.get("notes"),
    linesJson: formData.get("linesJson"),
  });

  if (!validated.ok) backToEditWithError(projectId, budgetId, validated.message);

  const { title, status, notes, lines } = validated;

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

  const normalized = lines.map((line, index) => ({
    id: line.id ? String(line.id) : crypto.randomUUID(),
    organization_id: ctx.organizationId,
    budget_id: budgetId,
    project_id: projectId,
    description: line.description,
    quantity: Number(line.quantity),
    unit_price: Number(line.unitPrice),
    tax_rate: Number(line.taxRate),
    sort_order: Number.isFinite(line.sortOrder) ? Number(line.sortOrder) : index + 1,
  }));

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
