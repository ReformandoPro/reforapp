import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import type { PurchaseItemInput, PurchaseStatus } from "@/lib/services/purchases";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { PurchaseEditorClient } from "../../PurchaseEditorClient";
import { updateProjectPurchaseAction } from "./actions";

export const dynamic = "force-dynamic";

type PurchaseRow = {
  id: string;
  title: string;
  supplier_name: string | null;
  status: PurchaseStatus;
  expected_date: string | null;
  received_date: string | null;
  notes: string | null;
};

type ItemRow = {
  id: string;
  description: string;
  quantity: string | number;
  unit: string | null;
  unit_price: string | number;
  tax_rate: string | number;
  sort_order: number;
};

export default async function EditPurchasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; purchaseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id: projectId, purchaseId } = await params;
  const { error } = await searchParams;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar pedido</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para editar un pedido.
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
          href={`/app/projects/${projectId}/purchases/${purchaseId}`}
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver al pedido
        </Link>
        <EmptyState title="Acceso denegado" description="No tienes permisos para editar pedidos." />
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

  const { data: purchase } = await supabase
    .from("project_purchases")
    .select("id, title, supplier_name, status, expected_date, received_date, notes")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId)
    .maybeSingle();

  if (!purchase) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href={`/app/projects/${projectId}/purchases`}
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a compras
        </Link>
        <EmptyState
          title="Pedido no encontrado"
          description="No hemos encontrado este pedido dentro de tu organización."
        />
      </section>
    );
  }

  const { data: items } = await supabase
    .from("project_purchase_items")
    .select("id, description, quantity, unit, unit_price, tax_rate, sort_order")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("purchase_id", purchaseId)
    .order("sort_order", { ascending: true });

  const p = purchase as unknown as PurchaseRow;
  const itemRows = (items ?? []) as ItemRow[];
  const initialItems: PurchaseItemInput[] =
    itemRows.length > 0
      ? itemRows.map((i) => ({
          id: i.id,
          description: i.description,
          quantity: Number(i.quantity),
          unit: i.unit ?? "",
          unitPrice: Number(i.unit_price),
          taxRate: Number(i.tax_rate),
          sortOrder: i.sort_order,
        }))
      : [{ description: "", quantity: 1, unit: "ud", unitPrice: 0, taxRate: 21, sortOrder: 1 }];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}/purchases/${purchaseId}`}
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver al pedido
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Editar pedido · {project.name}</h1>

        <form action={updateProjectPurchaseAction} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="purchaseId" value={purchaseId} />

          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {error}
            </p>
          ) : null}

          <PurchaseEditorClient
            mode="edit"
            initialTitle={p.title}
            initialSupplierName={p.supplier_name ?? ""}
            initialStatus={p.status}
            initialExpectedDate={p.expected_date ?? ""}
            initialReceivedDate={p.received_date ?? ""}
            initialNotes={p.notes ?? ""}
            initialItems={initialItems}
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-tertiary)]">La organización y la obra se validan en servidor.</p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
