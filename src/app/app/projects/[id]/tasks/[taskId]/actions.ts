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

async function validateTaskContextOrThrow(params: {
  projectId: string;
  taskId: string;
}) {
  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    redirect(`/login?redirectTo=/app/projects/${params.projectId}/tasks/${params.taskId}`);
  }

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", params.projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToTaskWithError(params.projectId, params.taskId, "Obra inválida para tu organización.");
  }

  // Validate task belongs to org + project.
  const { data: taskRow, error: taskError } = await supabase
    .from("project_tasks")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", params.projectId)
    .eq("id", params.taskId)
    .maybeSingle();

  if (taskError || !taskRow) {
    backToTaskWithError(params.projectId, params.taskId, "Tarea inválida para esta obra.");
  }

  return { ctx, supabase };
}

export async function addTaskCommentAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();

  if (!projectId || !taskId) {
    redirect("/app/projects");
  }

  const body = readRequiredText(formData, "body", "Comentario", projectId, taskId);

  const { ctx, supabase } = await validateTaskContextOrThrow({ projectId, taskId });

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

export async function updateTaskCommentAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const commentId = String(formData.get("commentId") ?? "").trim();

  if (!projectId || !taskId || !commentId) {
    redirect("/app/projects");
  }

  const body = readRequiredText(formData, "body", "Comentario", projectId, taskId);

  const { ctx, supabase } = await validateTaskContextOrThrow({ projectId, taskId });

  const { data: commentRow, error: commentError } = await supabase
    .from("project_task_comments")
    .select("id, author_user_id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("task_id", taskId)
    .eq("id", commentId)
    .maybeSingle();

  if (commentError || !commentRow) {
    backToTaskWithError(projectId, taskId, "Comentario inválido para esta tarea.");
  }

  const commentAuthorUserId = String(commentRow?.author_user_id ?? "");
  const canManage =
    commentAuthorUserId === ctx.user.id || ctx.role === "owner" || ctx.role === "admin";

  if (!canManage) {
    backToTaskWithError(projectId, taskId, "No tienes permisos para editar este comentario.");
  }

  const { error: updateError } = await supabase
    .from("project_task_comments")
    .update({ body })
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("task_id", taskId)
    .eq("id", commentId);

  if (updateError) {
    backToTaskWithError(projectId, taskId, "No pudimos guardar el comentario.");
  }

  redirect(`/app/projects/${projectId}/tasks/${taskId}`);
}

export async function deleteTaskCommentAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const taskId = String(formData.get("taskId") ?? "").trim();
  const commentId = String(formData.get("commentId") ?? "").trim();

  if (!projectId || !taskId || !commentId) {
    redirect("/app/projects");
  }

  const { ctx, supabase } = await validateTaskContextOrThrow({ projectId, taskId });

  const { data: commentRow, error: commentError } = await supabase
    .from("project_task_comments")
    .select("id, author_user_id")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("task_id", taskId)
    .eq("id", commentId)
    .maybeSingle();

  if (commentError || !commentRow) {
    backToTaskWithError(projectId, taskId, "Comentario inválido para esta tarea.");
  }

  const commentAuthorUserId = String(commentRow?.author_user_id ?? "");
  const canManage =
    commentAuthorUserId === ctx.user.id || ctx.role === "owner" || ctx.role === "admin";

  if (!canManage) {
    backToTaskWithError(projectId, taskId, "No tienes permisos para eliminar este comentario.");
  }

  const { error: deleteError } = await supabase
    .from("project_task_comments")
    .delete()
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("task_id", taskId)
    .eq("id", commentId);

  if (deleteError) {
    backToTaskWithError(projectId, taskId, "No pudimos eliminar el comentario.");
  }

  redirect(`/app/projects/${projectId}/tasks/${taskId}`);
}
