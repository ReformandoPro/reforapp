"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

type TaskStatus = "pending" | "in_progress" | "done" | "blocked";
type TaskPriority = "low" | "medium" | "high" | "urgent";

const taskStatuses: TaskStatus[] = ["pending", "in_progress", "done", "blocked"];
const taskPriorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

function backToNewWithError(projectId: string, message: string) {
  const url = new URL(`/app/projects/${projectId}/tasks/new`, "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function readRequiredText(formData: FormData, key: string, label: string, projectId: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    backToNewWithError(projectId, `${label} es obligatorio.`);
  }
  return value;
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function readEnum<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  const raw = String(formData.get(key) ?? "").trim();
  return (allowed as readonly string[]).includes(raw) ? (raw as T) : fallback;
}

export async function createProjectTask(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) {
    redirect("/app/projects");
  }

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect(`/login?redirectTo=/app/projects/${projectId}/tasks/new`);
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToNewWithError(projectId, "No tienes permisos para crear tareas.");
  }

  const title = readRequiredText(formData, "title", "Título", projectId);
  const description = readOptionalText(formData, "description");
  const status = readEnum(formData, "status", taskStatuses, "pending");
  const priority = readEnum(formData, "priority", taskPriorities, "medium");
  const dueDateRaw = readOptionalText(formData, "due_date");
  const due_date = dueDateRaw;

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

  const { data: inserted, error: insertError } = await supabase
    .from("project_tasks")
    .insert({
      organization_id: ctx.organizationId,
      project_id: projectId,
      title,
      description,
      status,
      priority,
      due_date,
    })
    .select("id")
    .single();

  if (insertError || !inserted?.id) {
    backToNewWithError(projectId, "No pudimos crear la tarea.");
  }

  redirect(`/app/projects/${projectId}/tasks`);
}

