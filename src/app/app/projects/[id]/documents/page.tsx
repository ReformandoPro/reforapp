import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DOCUMENT_CATEGORIES,
  createSignedDocumentUrl,
  type DocumentCategory,
} from "@/lib/services/documents";
import { getOrgMembersWithProfiles } from "@/lib/services/org-members-with-profiles";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { deleteProjectDocumentAction, uploadProjectDocumentAction } from "./actions";

export const dynamic = "force-dynamic";

const BUCKET = "project-documents";

type DocumentRow = {
  id: string;
  uploaded_by_user_id: string;
  file_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  category: DocumentCategory;
  description: string | null;
  created_at: string;
};

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let value = bytes;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx++;
  }
  const rounded = idx === 0 ? String(Math.round(value)) : value.toFixed(1);
  return `${rounded} ${units[idx]}`;
}

export default async function AppProjectDocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: projectId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Documentos</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver documentos.
          </p>
        </Card>
      </section>
    );
  }

  const canUpload = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  // Validate project belongs to org.
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (projectError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los documentos"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href="/app/projects"
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
        >
          ← Volver a obras
        </Link>
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador dentro de tu organización."
        />
      </section>
    );
  }

  const members = await getOrgMembersWithProfiles(ctx.organizationId);
  const labelByUserId = new Map(members.map((m) => [m.userId, m.label] as const));

  const { data: docs, error: docsError } = await supabase
    .from("project_documents")
    .select(
      "id, uploaded_by_user_id, file_path, file_name, mime_type, size_bytes, category, description, created_at"
    )
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (docsError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los documentos"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const rows = (docs ?? []) as DocumentRow[];

  // Signed URLs (simple MVP: generate for each row)
  const signedUrls = new Map<string, string>();
  for (const row of rows) {
    const url = await createSignedDocumentUrl({ bucket: BUCKET, filePath: row.file_path });
    if (url) signedUrls.set(row.id, url);
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}`}
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver a la obra
      </Link>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Documentos · {project.name}
            </h1>
            <p className="mt-2 text-sm text-content-secondary sm:text-base">
              Documentación asociada a esta obra.
            </p>
          </div>

          <Badge tone="neutral">Total: {rows.length}</Badge>
        </div>
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Subir documento</h2>

        {!canUpload ? (
          <p className="mt-2 text-sm text-content-secondary">
            No tienes permisos para subir documentos.
          </p>
        ) : (
          <form action={uploadProjectDocumentAction} className="mt-4 space-y-5">
            <input type="hidden" name="projectId" value={projectId} />

            {error ? (
              <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
                {error}
              </p>
            ) : null}

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="file">
                Archivo
              </label>
              <input
                id="file"
                name="file"
                type="file"
                required
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="category">
                  Categoría
                </label>
                <select
                  id="category"
                  name="category"
                  defaultValue="general"
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {DOCUMENT_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="description">
                  Descripción (opcional)
                </label>
                <input
                  id="description"
                  name="description"
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  placeholder="Ej: Plano de instalación eléctrica"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-content-tertiary">
                Se valida organización/obra en servidor. El bucket es privado.
              </p>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Subir
              </button>
            </div>
          </form>
        )}
      </Card>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin documentos"
          description={
            canUpload
              ? "Sube el primer documento para esta obra."
              : "Aún no hay documentos para esta obra."
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((doc) => {
            const authorLabel = labelByUserId.get(doc.uploaded_by_user_id) ?? doc.uploaded_by_user_id;
            const canDelete =
              doc.uploaded_by_user_id === ctx.user.id || ctx.role === "owner" || ctx.role === "admin";

            const downloadUrl = signedUrls.get(doc.id) ?? null;

            return (
              <Card
                key={doc.id}
                className="border border-subtle bg-bg-surface p-5 text-content-primary shadow-none"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-base font-semibold tracking-tight">{doc.file_name}</p>
                    <p className="mt-1 text-sm text-content-secondary">
                      {DOCUMENT_CATEGORIES.find((c) => c.value === doc.category)?.label ?? doc.category}
                      {" "}· {formatSize(doc.size_bytes)} · {formatDateTime(doc.created_at)}
                    </p>
                    <p className="mt-1 text-sm text-content-secondary">Autor: {authorLabel}</p>
                    {doc.description ? (
                      <p className="mt-2 text-sm text-content-primary">{doc.description}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Descargar
                      </a>
                    ) : (
                      <Badge tone="warning">URL no disponible</Badge>
                    )}

                    {canDelete ? (
                      <form
                        action={deleteProjectDocumentAction}
                        onSubmit={(event) => {
                          if (!confirm("¿Eliminar este documento?") ) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="projectId" value={projectId} />
                        <input type="hidden" name="documentId" value={doc.id} />
                        <button
                          type="submit"
                          className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          Eliminar
                        </button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
