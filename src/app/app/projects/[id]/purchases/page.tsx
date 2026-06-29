import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardLinkRow } from "@/components/ui/CardLinkRow";
import { BackLink } from "@/components/ui/BackLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoneyEUR } from "@/lib/services/budgets-basic";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { computePurchaseTotals, PURCHASE_STATUSES, type PurchaseStatus } from "@/lib/services/purchases";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type PurchaseRow = {
  id: string;
  title: string;
  supplier_name: string | null;
  status: PurchaseStatus;
  expected_date: string | null;
  updated_at: string;
};

type ItemRow = {
  purchase_id: string;
  quantity: string | number;
  unit_price: string | number;
  tax_rate: string | number;
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
    return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value)
    );
  } catch {
    return value;
  }
}

export default async function AppProjectPurchasesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;

  const ctx = await getOrganizationContextForRequest();
  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Compras</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver compras.
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

  const { data: purchases, error: purchasesError } = await supabase
    .from("project_purchases")
    .select("id, title, supplier_name, status, expected_date, updated_at")
    .eq("organization_id", ctx.organizationId)
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (purchasesError) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState title="No pudimos cargar las compras" description="Revisa tu conexión e inténtalo." />
      </section>
    );
  }

  const rows = (purchases ?? []) as PurchaseRow[];
  const ids = rows.map((r) => r.id);

  const { data: items } = ids.length
    ? await supabase
        .from("project_purchase_items")
        .select("purchase_id, quantity, unit_price, tax_rate")
        .eq("organization_id", ctx.organizationId)
        .eq("project_id", projectId)
        .in("purchase_id", ids)
    : { data: [] as unknown[] };

  const itemRows = (items ?? []) as ItemRow[];
  const itemsByPurchase = new Map<string, ItemRow[]>();
  for (const item of itemRows) {
    const list = itemsByPurchase.get(item.purchase_id) ?? [];
    list.push(item);
    itemsByPurchase.set(item.purchase_id, list);
  }

  const totalAll = rows.reduce((acc, r) => {
    const list = itemsByPurchase.get(r.id) ?? [];
    const totals = computePurchaseTotals(
      list.map((i) => ({
        quantity: Number(i.quantity),
        unitPrice: Number(i.unit_price),
        taxRate: Number(i.tax_rate),
      }))
    );
    return acc + totals.total;
  }, 0);

  const totalAllRounded = Math.round((totalAll + Number.EPSILON) * 100) / 100;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        backLink={<BackLink href={`/app/projects/${projectId}`}>← Volver a la obra</BackLink>}
        title={<>Compras · {project.name}</>}
        description="Pedidos de materiales con líneas e IVA."
        actions={
          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Badge tone="neutral">Pedidos: {rows.length}</Badge>
              <Badge tone="neutral">Total: {formatMoneyEUR(totalAllRounded)}</Badge>
            </div>
            {canWrite ? (
              <LinkButton href={`/app/projects/${projectId}/purchases/new`}>Nuevo pedido</LinkButton>
            ) : null}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Sin compras"
          description={
            canWrite
              ? "Crea el primer pedido de materiales para esta obra."
              : "Aún no hay pedidos para esta obra."
          }
          actions={
            canWrite ? (
              <LinkButton href={`/app/projects/${projectId}/purchases/new`}>Nuevo pedido</LinkButton>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((purchase) => {
            const statusLabel =
              PURCHASE_STATUSES.find((s) => s.value === purchase.status)?.label ?? purchase.status;

            const list = itemsByPurchase.get(purchase.id) ?? [];
            const totals = computePurchaseTotals(
              list.map((i) => ({
                quantity: Number(i.quantity),
                unitPrice: Number(i.unit_price),
                taxRate: Number(i.tax_rate),
              }))
            );

            return (
              <CardLinkRow
                key={purchase.id}
                href={`/app/projects/${projectId}/purchases/${purchase.id}`}
                heading={purchase.title}
                description={
                  <>
                    {statusLabel}
                    {purchase.supplier_name ? ` · ${purchase.supplier_name}` : ""} · Prevista:{" "}
                    {formatDate(purchase.expected_date)} · Actualizado: {formatDateTime(purchase.updated_at)}
                  </>
                }
                trailing={<Badge tone="neutral">Total: {formatMoneyEUR(totals.total)}</Badge>}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}
