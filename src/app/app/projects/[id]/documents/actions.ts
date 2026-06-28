"use server";

import { redirect } from "next/navigation";

import { safeFilename, type DocumentCategory } from "@/lib/services/documents";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

const BUCKET = "project-documents";

function backToDocumentsWithError(projectId: string, message: string): never {
  const url = new URL(`/app/projects/${projectId}/documents`, "http://local");
  url.searchParams.set("error", message);
  return redirect(url.pathname + url.search);
}

function readOptionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length > 0 ? value : null;
}

function readCategory(formData: FormData): DocumentCategory {
  const raw = String(formData.get("category") ?? "general").trim();
  const allowed: DocumentCategory[] = [
    "general",
    "budget",
    "invoice",
    "photo",
    "license",
    "plan",
    "report",
  ];
  return (allowed as string[]).includes(raw) ? (raw as DocumentCategory) : "general";
}

export async function uploadProjectDocumentAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/documents`);

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    backToDocumentsWithError(projectId, "No tienes permisos para subir documentos.");
  }

  const fileValue = formData.get("file");
  if (!(fileValue instanceof File)) {
    backToDocumentsWithError(projectId, "Falta el archivo.");
  }

  const file = fileValue;

  if (file.size <= 0) {
    backToDocumentsWithError(projectId, "El archivo está vacío.");
  }

  const category = readCategory(formData);
  const description = readOptionalText(formData, "description");

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToDocumentsWithError(projectId, "Obra inválida para tu organización.");
  }

  const documentId = crypto.randomUUID();
  const originalName = file.name || "document";
  const safeName = safeFilename(originalName);

  const filePath = `${ctx.organizationId}/${projectId}/${documentId}-${safeName}`;

  // 1) Upload to private bucket
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (uploadError) {
    backToDocumentsWithError(projectId, "No pudimos subir el archivo.");
  }

  // 2) Insert document row
  const { error: insertError } = await supabase.from("project_documents").insert({
    id: documentId,
    organization_id: ctx.organizationId,
    project_id: projectId,
    uploaded_by_user_id: ctx.user.id,
    file_path: filePath,
    file_name: originalName,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    category,
    description,
  });

  if (insertError) {
    // Best-effort cleanup
    await supabase.storage.from(BUCKET).remove([filePath]);
    backToDocumentsWithError(projectId, "No pudimos guardar el documento.");
  }

  redirect(`/app/projects/${projectId}/documents`);
}

export async function deleteProjectDocumentAction(formData: FormData) {
  const projectId = String(formData.get("projectId") ?? "").trim();
  const documentId = String(formData.get("documentId") ?? "").trim();
  if (!projectId || !documentId) redirect("/app/projects");

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) redirect(`/login?redirectTo=/app/projects/${projectId}/documents`);

  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: projectRow, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !projectRow) {
    backToDocumentsWithError(projectId, "Obra inválida para tu organización.");
  }

  // Load document row (also validates org+project)
  const { data: docRow, error: docError } = await supabase
    .from("project_documents")
    .select("id, uploaded_by_user_id, file_path")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", documentId)
    .maybeSingle();

  if (docError || !docRow) {
    backToDocumentsWithError(projectId, "Documento no encontrado.");
  }

  const canDelete =
    docRow.uploaded_by_user_id === ctx.user.id || ctx.role === "owner" || ctx.role === "admin";

  if (!canDelete) {
    backToDocumentsWithError(projectId, "No tienes permisos para eliminar este documento.");
  }

  // Delete DB row first (RLS enforced)
  const { error: deleteRowError } = await supabase
    .from("project_documents")
    .delete()
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", documentId);

  if (deleteRowError) {
    backToDocumentsWithError(projectId, "No pudimos eliminar el documento.");
  }

  // Best-effort delete from storage (policy uses project_documents + membership)
  await supabase.storage.from(BUCKET).remove([docRow.file_path]);

  redirect(`/app/projects/${projectId}/documents`);
}
