"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function backToTaskWithError(projectId: string, taskId: string, message: string) {
  const url = new URL(`/app/projects/${projectId}/tasks/${taskId}`, "http://local");
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
    backToTaskWithError(projectId, taskId, `${label} es obligatorio.`);
  }
  return value;
}

export async function addTaskCommentAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!projectId || !taskId) {
    redirect("/app/projects");
  }

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect(`/login?redirectTo=/app/projects/${projectId}/tasks/${taskId}`);
  }

  const body = readRequiredText(formData, "body", "Comentario", projectId, taskId);

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToTaskWithError(projectId, taskId, "Obra inválida para tu organización.");
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
    backToTaskWithError(projectId, taskId, "Tarea inválida para esta obra.");
  }

  const { error: insertError } = await supabase.from("project_task_comments").insert({
    organization_id: ctx.organizationId,
    project_id: projectId,
    task_id: taskId,
    author_user_id: ctx.user.id,
    body,
  });

  if (insertError) {
    backToTaskWithError(projectId, taskId, "No pudimos publicar el comentario.");
  }

  redirect(`/app/projects/${projectId}/tasks/${taskId}`);
}
