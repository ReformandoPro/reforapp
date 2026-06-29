import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { COST_CATEGORIES } from "@/lib/services/costs";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { deleteProjectCostAction, updateProjectCostAction } from "./actions";

export const dynamic = "force-dynamic";

type CostRow = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  amount: string | number;
  tax_rate: string | number;
  cost_date: string;
  supplier_name: string | null;
  document_id: string | null;
};

type DocumentRow = {
  id: string;
  file_name: string;
  created_at: string;
};

export default async function EditProjectCostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; costId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: projectId, costId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar coste</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para editar un coste.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/costs`}>← Volver a costes</BackLink>
        <EmptyState title="Acceso denegado" description="No tienes permisos para editar costes." />
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
        <BackLink href="/app/projects">← Volver a obras</BackLink>
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador dentro de tu organización."
        />
      </section>
    );
  }

  const { data: cost } = await supabase
    .from("project_costs")
    .select(
      "id, title, description, category, amount, tax_rate, cost_date, supplier_name, document_id"
    )
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", costId)
    .maybeSingle();

  if (!cost) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href={`/app/projects/${projectId}/costs`}>← Volver a costes</BackLink>
        <EmptyState
          title="Coste no encontrado"
          description="No hemos encontrado este coste dentro de tu organización."
        />
      </section>
    );
  }

  const { data: docs } = await supabase
    .from("project_documents")
    .select("id, file_name, created_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  const docRows = (docs ?? []) as DocumentRow[];
  const row = cost as unknown as CostRow;

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href={`/app/projects/${projectId}/costs`}>← Volver a costes</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Editar coste · {project.name}
        </h1>

        <form action={updateProjectCostAction} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="costId" value={costId} />

          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
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
              defaultValue={row.title}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
              defaultValue={row.description ?? ""}
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
                defaultValue={row.category}
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
                defaultValue={row.supplier_name ?? ""}
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
                defaultValue={Number(row.amount)}
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
                required
                defaultValue={Number(row.tax_rate)}
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
                defaultValue={row.cost_date}
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
              defaultValue={row.document_id ?? ""}
            >
              <option value="">— Sin documento —</option>
              {docRows.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.file_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar
            </button>
          </div>
        </form>

        <form
          action={deleteProjectCostAction}
          className="mt-4"
          onSubmit={(e) => {
            const ok = confirm("¿Eliminar coste? Esta acción no se puede deshacer.");
            if (!ok) e.preventDefault();
          }}
        >
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="costId" value={costId} />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-rose-700 hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Eliminar coste
          </button>
        </form>
      </Card>
    </section>
  );
}
