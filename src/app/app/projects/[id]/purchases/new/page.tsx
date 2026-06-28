import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { PURCHASE_STATUSES, type PurchaseItemInput } from "@/lib/services/purchases";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { PurchaseEditorClient } from "../PurchaseEditorClient";
import { createProjectPurchaseAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewProjectPurchasePage({
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo pedido</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Inicia sesión para crear un pedido.
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
          href={`/app/projects/${projectId}/purchases`}
          className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          ← Volver a compras
        </Link>
        <EmptyState title="Acceso denegado" description="No tienes permisos para crear pedidos." />
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

  const initialItems: PurchaseItemInput[] = [
    { description: "", quantity: 1, unit: "ud", unitPrice: 0, taxRate: 21, sortOrder: 1 },
  ];

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href={`/app/projects/${projectId}/purchases`}
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a compras
      </Link>

      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nuevo pedido · {project.name}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
          Crea un pedido de materiales con líneas e IVA.
        </p>

        <form action={createProjectPurchaseAction} className="mt-6 space-y-6">
          <input type="hidden" name="projectId" value={projectId} />

          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              {error}
            </p>
          ) : null}

          <PurchaseEditorClient
            mode="new"
            initialTitle="Pedido"
            initialSupplierName=""
            initialStatus={PURCHASE_STATUSES[0].value}
            initialExpectedDate=""
            initialReceivedDate=""
            initialNotes=""
            initialItems={initialItems}
          />

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-[var(--text-tertiary)]">La organización y la obra se validan en servidor.</p>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear pedido
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
