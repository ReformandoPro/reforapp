"use server";

import { redirect } from "next/navigation";

import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

function fail(message: string, projectId: string) {
  const url = new URL(`/app/projects/${projectId}`, "http://local");
  url.searchParams.set("error", message);
  redirect(url.pathname + url.search);
}

async function ensureCanWrite(projectId: string) {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    redirect(`/login?redirectTo=/app/projects/${projectId}`);
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    fail("No tienes permisos para archivar/restaurar obras.", projectId);
  }

  return ctx;
}

export async function archiveProject(projectId: string) {
  const ctx = await ensureCanWrite(projectId);
  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org (defense-in-depth; RLS also enforces)
  const { data: projectRow, error: lookupError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (lookupError || !projectRow) {
    fail("Obra inválida para tu organización.", projectId);
  }

  const { error } = await supabase
    .from("projects")
    .update({ archived_at: new Date().toISOString() })
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId);

  if (error) {
    fail("No pudimos archivar la obra.", projectId);
  }

  redirect(`/app/projects/${projectId}`);
}

export async function restoreProject(projectId: string) {
  const ctx = await ensureCanWrite(projectId);
  const supabase = await createServerSupabaseClient();

  const { data: projectRow, error: lookupError } = await supabase
    .from("projects")
    .select("id")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (lookupError || !projectRow) {
    fail("Obra inválida para tu organización.", projectId);
  }

  const { error } = await supabase
    .from("projects")
    .update({ archived_at: null })
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId);

  if (error) {
    fail("No pudimos restaurar la obra.", projectId);
  }

  redirect(`/app/projects/${projectId}`);
}

