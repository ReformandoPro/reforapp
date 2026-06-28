import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatMoneyEUR } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { computePurchaseTotals, PURCHASE_STATUSES, type PurchaseStatus } from "@/lib/services/purchases";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { PurchaseActionsClient } from "./PurchaseActionsClient";

export const dynamic = "force-dynamic";

type PurchaseRow = {
  id: string;
  title: string;
  supplier_name: string | null;
  status: PurchaseStatus;
  expected_date: string | null;
  received_date: string | null;
  notes: string | null;
  updated_at: string;
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

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return value;
  }
}

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

export default async function PurchaseDetailPage({
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
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Pedido</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver este pedido.
          </p>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  const supabase = await createServerSupabaseClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("organization_id", ctx.organizationId)
    .eq("id", projectId)
    .maybeSingle();

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

  const { data: purchase, error: purchaseError } = await supabase
    .from("project_purchases")
    .select("id, title, supplier_name, status, expected_date, received_date, notes, updated_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("id", purchaseId)
    .maybeSingle();

  if (purchaseError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState title="No pudimos cargar el pedido" description="Revisa tu conexión e inténtalo." />
      </section>
    );
  }

  if (!purchase) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Link
          href={`/app/projects/${projectId}/purchases`}
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
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

  const { data: items, error: itemsError } = await supabase
    .from("project_purchase_items")
    .select("id, description, quantity, unit, unit_price, tax_rate, sort_order")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .eq("purchase_id", purchaseId)
    .order("sort_order", { ascending: true });

  if (itemsError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState title="No pudimos cargar las líneas" description="Revisa tu conexión e inténtalo." />
      </section>
    );
  }

  const p = purchase as unknown as PurchaseRow;
  const itemRows = (items ?? []) as ItemRow[];

  const totals = computePurchaseTotals(
    itemRows.map((i) => ({
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      taxRate: Number(i.tax_rate),
    }))
  );

  const statusLabel = PURCHASE_STATUSES.find((s) => s.value === p.status)?.label ?? p.status;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}/purchases`}
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver a compras
      </Link>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{p.title}</h1>
            <p className="mt-2 text-sm text-content-secondary sm:text-base">
              {project.name} · {formatDateTime(p.updated_at)}
              {p.supplier_name ? ` · ${p.supplier_name}` : ""}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="neutral">Estado: {statusLabel}</Badge>
              <Badge tone="neutral">Total: {formatMoneyEUR(totals.total)}</Badge>
              <Badge tone="neutral">Prevista: {formatDate(p.expected_date)}</Badge>
              <Badge tone="neutral">Recibida: {formatDate(p.received_date)}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            {canWrite ? (
              <>
                <Link
                  href={`/app/projects/${projectId}/purchases/${purchaseId}/edit`}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Editar
                </Link>

                <PurchaseActionsClient
                  projectId={projectId}
                  purchaseId={purchaseId}
                  currentStatus={p.status}
                />
              </>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="mt-5 rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
            {error}
          </p>
        ) : null}

        {p.notes ? (
          <p className="mt-5 whitespace-pre-wrap text-sm text-content-primary">{p.notes}</p>
        ) : null}
      </Card>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Líneas</h2>

        {itemRows.length === 0 ? (
          <p className="mt-4 text-sm text-content-secondary">Sin líneas.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {itemRows.map((line) => {
              const qty = Number(line.quantity);
              const unit = Number(line.unit_price);
              const taxRate = Number(line.tax_rate);
              const subtotal = qty * unit;
              const tax = subtotal * (taxRate / 100);
              const total = subtotal + tax;

              return (
                <div
                  key={line.id}
                  className="rounded-xl border border-subtle bg-bg-raised px-4 py-3"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-content-primary">{line.description}</p>
                      <p className="mt-1 text-xs text-content-tertiary">
                        {qty} {line.unit ?? ""} × {formatMoneyEUR(unit)} · IVA {taxRate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-content-primary">{formatMoneyEUR(total)}</p>
                      <p className="mt-1 text-xs text-content-tertiary">
                        Base {formatMoneyEUR(subtotal)} · IVA {formatMoneyEUR(tax)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">Subtotal</span>
            <span className="font-medium">{formatMoneyEUR(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-secondary">IVA</span>
            <span className="font-medium">{formatMoneyEUR(totals.tax)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-content-primary font-semibold">Total</span>
            <span className="font-semibold">{formatMoneyEUR(totals.total)}</span>
          </div>
        </div>
      </Card>
    </section>
  );
}
