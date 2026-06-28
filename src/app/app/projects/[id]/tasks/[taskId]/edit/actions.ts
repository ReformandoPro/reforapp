"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

type TaskStatus = "pending" | "in_progress" | "done" | "blocked";
type TaskPriority = "low" | "medium" | "high" | "urgent";

const taskStatuses: TaskStatus[] = ["pending", "in_progress", "done", "blocked"];
const taskPriorities: TaskPriority[] = ["low", "medium", "high", "urgent"];

function backToEditWithError(projectId: string, taskId: string, message: string) {
  const url = new URL(
    `/app/projects/${projectId}/tasks/${taskId}/edit`,
    "http://local"
  );
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

function readRequiredText(
  formData: FormData,
  key: string,
  label: string,
  projectId: string,
  taskId: string
) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) {
    backToEditWithError(projectId, taskId, `${label} es obligatorio.`);
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

export async function updateProjectTask(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  if (!projectId || !taskId) {
    redirect("/app/projects");
  }

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect(`/login?redirectTo=/app/projects/${projectId}/tasks/${taskId}/edit`);
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToEditWithError(projectId, taskId, "No tienes permisos para editar tareas.");
  }

  const title = readRequiredText(formData, "title", "Título", projectId, taskId);
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
    backToEditWithError(projectId, taskId, "Obra inválida para tu organización.");
  }

  // Validate task belongs to org + project.
  const { data: taskRow, error: taskError } = await supabase
    .from("project_tasks")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", taskId)
    .maybeSingle();

  if (taskError || !taskRow) {
    backToEditWithError(projectId, taskId, "Tarea inválida para esta obra.");
  }

  const { error: updateError } = await supabase
    .from("project_tasks")
    .update({
      title,
      description,
      status,
      priority,
      due_date,
    })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", taskId);

  if (updateError) {
    backToEditWithError(projectId, taskId, "No pudimos guardar los cambios.");
  }

  redirect(`/app/projects/${projectId}/tasks`);
}

