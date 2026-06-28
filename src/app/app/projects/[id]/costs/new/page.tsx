import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { COST_CATEGORIES } from "@/lib/services/costs";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { createProjectCostAction } from "./actions";

export const dynamic = "force-dynamic";

type DocumentRow = {
  id: string;
  file_name: string;
  category: string;
  description: string | null;
  created_at: string;
};

export default async function NewProjectCostPage({
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
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo coste</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para crear un coste.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href={`/app/projects/${projectId}/costs`}
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a costes
        </Link>
        <EmptyState title="Acceso denegado" description="No tienes permisos para crear costes." />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/app/projects"
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
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

  const { data: docs } = await supabase
    .from("project_documents")
    .select("id, file_name, category, description, created_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const docRows = (docs ?? []) as DocumentRow[];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}/costs`}
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a costes
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo coste · {project.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Registra un gasto real asociado a la obra.
        </p>

        <form action={createProjectCostAction} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />

          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              name="title"
              required
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              placeholder="Ej: Compra de azulejos"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="description">
              Descripción (opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                defaultValue="other"
              >
                {COST_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="supplierName">
                Proveedor (opcional)
              </label>
              <input
                id="supplierName"
                name="supplierName"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                placeholder="Ej: Ferretería López"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="amount">
                Importe (base)
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="taxRate">
                IVA (%)
              </label>
              <input
                id="taxRate"
                name="taxRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={21}
                required
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="costDate">
                Fecha
              </label>
              <input
                id="costDate"
                name="costDate"
                type="date"
                required
                defaultValue={today}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="documentId">
              Documento asociado (opcional)
            </label>
            <select
              id="documentId"
              name="documentId"
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              defaultValue=""
            >
              <option value="">— Sin documento —</option>
              {docRows.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--text-tertiary)]">
              Solo se permite seleccionar documentos de esta obra.
            </p>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-tertiary)]">La organización se valida en servidor.</p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear coste
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
