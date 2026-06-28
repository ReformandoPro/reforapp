import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProjectStatus } from "@/lib/domain/projects/status";
import { isProjectStatus } from "@/lib/domain/projects/status";
import { formatMoneyEUR } from "@/lib/services/budgets-basic";
import { computeCostTotals } from "@/lib/services/costs";
import { computePurchaseTotals } from "@/lib/services/purchases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

type AppProjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

const statusLabels: Record<ProjectStatus, string> = {
  lead: "Lead",
  budgeting: "Presupuestando",
  approved: "Aprobada",
  scheduled: "Planificado",
  in_progress: "En curso",
  paused: "En pausa",
  completed: "Completado",
  delivered: "Entregada",
  closed: "Cerrada",
  cancelled: "Cancelado",
};

const statusTones: Record<
  ProjectStatus,
  "neutral" | "success" | "warning" | "danger" | "info"
> = {
  lead: "neutral",
  budgeting: "info",
  approved: "success",
  scheduled: "info",
  in_progress: "info",
  paused: "warning",
  completed: "success",
  delivered: "success",
  closed: "neutral",
  cancelled: "danger",
};

type ProjectDetailRow = {
  id: string;
  name: string;
  status: string;
  address: string;
  type: string;
  progress: number;
  updated_at: string | null;
  client:
    | {
        display_name: string;
      }
    | { display_name: string }[]
    | null;
};

function normalizeJoinedClient(client: ProjectDetailRow["client"]) {
  if (Array.isArray(client)) {
    return client[0] ?? null;
  }
  return client;
}

function formatUpdatedAt(value: string | null): string {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export const dynamic = "force-dynamic";

export default async function AppProjectDetailPage({
  params,
}: AppProjectDetailPageProps) {
  const { id } = await params;
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar la obra
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            {ctx.reason === "missing_membership"
              ? "Tu usuario no tiene acceso a ninguna organización todavía."
              : "Inicia sesión e inténtalo de nuevo."}
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      status,
      address,
      type,
      progress,
      updated_at,
      client:clients (
        display_name
      )
    `
    )
    .eq("organization_id", ctx.organizationId)
    .eq("id", id)
    .maybeSingle();

  const taskCounts =
    data && !error
      ? await (async () => {
          const [total, pending, inProgress, blocked, done, mine, documents, lastProgress, budgetsCount, lastBudget, costsCount, costsRows, purchasesCount, lastPurchase, purchaseItemsRows, phasesCount, currentPhase, nextPlannedPhase] = await Promise.all([
            supabase
              .from("project_tasks")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_tasks")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .eq("status", "pending"),
            supabase
              .from("project_tasks")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .eq("status", "in_progress"),
            supabase
              .from("project_tasks")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .eq("status", "blocked"),
            supabase
              .from("project_tasks")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .eq("status", "done"),
            supabase
              .from("project_tasks")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .eq("assignee_user_id", ctx.user.id),
            supabase
              .from("project_documents")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_progress_updates")
              .select("progress, note, created_at", { head: false })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("project_budgets")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_budgets")
              .select("id, title, status, updated_at")
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("project_costs")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_costs")
              .select("amount, tax_rate")
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_purchases")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_purchases")
              .select("id, title, status, supplier_name, updated_at")
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .order("updated_at", { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("project_purchase_items")
              .select("quantity, unit_price, tax_rate")
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_phases")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id),
            supabase
              .from("project_phases")
              .select("id, title, start_date")
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .eq("status", "in_progress")
              .order("sort_order", { ascending: true })
              .limit(1)
              .maybeSingle(),
            supabase
              .from("project_phases")
              .select("id, title, start_date")
              .eq("organization_id", ctx.organizationId)
              .eq("project_id", id)
              .eq("status", "planned")
              .order("start_date", { ascending: true, nullsFirst: false })
              .order("sort_order", { ascending: true })
              .limit(1)
              .maybeSingle(),
          ]);

          const costTotals = computeCostTotals(
            (costsRows.data ?? []).map((r: { amount: string | number; tax_rate: string | number }) => ({
              amount: Number(r.amount),
              taxRate: Number(r.tax_rate),
            }))
          );

          const purchaseTotals = computePurchaseTotals(
            (purchaseItemsRows.data ?? []).map(
              (r: { quantity: string | number; unit_price: string | number; tax_rate: string | number }) => ({
                quantity: Number(r.quantity),
                unitPrice: Number(r.unit_price),
                taxRate: Number(r.tax_rate),
              })
            )
          );

          return {
            total: total.count ?? 0,
            pending: pending.count ?? 0,
            inProgress: inProgress.count ?? 0,
            blocked: blocked.count ?? 0,
            done: done.count ?? 0,
            mine: mine.count ?? 0,
            documents: documents.count ?? 0,
            lastProgress: lastProgress.data ?? null,
            budgetsCount: budgetsCount.count ?? 0,
            lastBudget: lastBudget.data ?? null,
            costsCount: costsCount.count ?? 0,
            costsTotal: costTotals.total,
            purchasesCount: purchasesCount.count ?? 0,
            purchasesTotal: purchaseTotals.total,
            lastPurchase: lastPurchase.data ?? null,
            phasesCount: phasesCount.count ?? 0,
            currentPhase: currentPhase.data ?? null,
            nextPlannedPhase: nextPlannedPhase.data ?? null,
          };
        })()
      : null;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link
        href="/app/projects"
        className="inline-flex text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      >
        ← Volver a obras
      </Link>

      {error ? (
        <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            No pudimos cargar la obra
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Revisa tu conexión e inténtalo de nuevo.
          </p>
          <div className="mt-4">
            <Link
              href={`/app/projects/${id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition-colors border border-subtle bg-bg-surface text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Reintentar
            </Link>
          </div>
        </Card>
      ) : !data ? (
        <EmptyState
          title="Obra no encontrada"
          description="No hemos encontrado una obra con este identificador dentro de tu organización."
        />
      ) : (() => {
          const row = data as unknown as ProjectDetailRow;
          const joinedClient = normalizeJoinedClient(row.client);
          const status = isProjectStatus(row.status) ? row.status : null;

          const canWrite = ctx.role === "owner" || ctx.role === "admin";

          return (
            <>
              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {row.name}
                    </h1>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
                      Cliente: {joinedClient?.display_name ?? "—"}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    {status ? (
                      <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>
                    ) : (
                      <Badge tone="neutral">Estado inválido</Badge>
                    )}

                    {canWrite ? (
                      <Link
                        href={`/app/projects/${id}/edit`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Editar obra
                      </Link>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Dirección
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{row.address}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Tipo
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{row.type}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Progreso
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">{row.progress}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
                      Actualizado
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                      {formatUpdatedAt(row.updated_at)}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Tareas</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {taskCounts ? (
                        <>
                          Total: <span className="font-medium">{taskCounts.total}</span> ·
                          Pendientes: <span className="font-medium">{taskCounts.pending}</span> ·
                          En curso: <span className="font-medium">{taskCounts.inProgress}</span> ·
                          Bloqueadas: <span className="font-medium">{taskCounts.blocked}</span> ·
                          Completadas: <span className="font-medium">{taskCounts.done}</span>
                          {taskCounts.mine > 0 ? (
                            <>
                              {" "}· Mis tareas: <span className="font-medium">{taskCounts.mine}</span>
                            </>
                          ) : null}
                        </>
                      ) : (
                        "Resumen no disponible."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/app/projects/${id}/tasks`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Ver tareas
                    </Link>
                    {canWrite ? (
                      <Link
                        href={`/app/projects/${id}/tasks/new`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Nueva tarea
                      </Link>
                    ) : null}
                  </div>
                </div>

                {taskCounts && taskCounts.total === 0 ? (
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Aún no hay tareas para esta obra.
                  </p>
                ) : null}
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Planificación</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {taskCounts ? (
                        taskCounts.currentPhase ? (
                          <>
                            Fases: <span className="font-medium">{taskCounts.phasesCount}</span> ·
                            Actual: <span className="font-medium">{taskCounts.currentPhase.title}</span>
                            {taskCounts.nextPlannedPhase ? (
                              <>
                                {" "}· Próxima: <span className="font-medium">{taskCounts.nextPlannedPhase.title}</span>
                              </>
                            ) : null}
                          </>
                        ) : taskCounts.nextPlannedPhase ? (
                          <>
                            Fases: <span className="font-medium">{taskCounts.phasesCount}</span> ·
                            Próxima: <span className="font-medium">{taskCounts.nextPlannedPhase.title}</span>
                          </>
                        ) : (
                          <>
                            Fases: <span className="font-medium">{taskCounts.phasesCount}</span> ·
                            Aún no hay fases.
                          </>
                        )
                      ) : (
                        "Resumen no disponible."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/app/projects/${id}/phases`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Ver planificación
                    </Link>
                    {canWrite ? (
                      <Link
                        href={`/app/projects/${id}/phases/new`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        Nueva fase
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Documentos</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {taskCounts ? (
                        <>
                          Total: <span className="font-medium">{taskCounts.documents}</span>
                        </>
                      ) : (
                        "Resumen no disponible."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/app/projects/${id}/documents`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Ver documentos
                    </Link>
                  </div>
                </div>

                {taskCounts && taskCounts.documents === 0 ? (
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Aún no hay documentos para esta obra.
                  </p>
                ) : null}
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Avances</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {taskCounts ? (
                        taskCounts.lastProgress ? (
                          <>
                            Último: <span className="font-medium">{taskCounts.lastProgress.progress}%</span> ·
                            <span className="font-medium">{taskCounts.lastProgress.note}</span> ·
                            {formatUpdatedAt(taskCounts.lastProgress.created_at)}
                          </>
                        ) : (
                          "Aún no hay avances registrados."
                        )
                      ) : (
                        "Resumen no disponible."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/app/projects/${id}/progress`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Ver avances
                    </Link>
                  </div>
                </div>

                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Progreso actual: <span className="font-medium">{row.progress}%</span>
                </p>
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Presupuestos</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {taskCounts ? (
                        taskCounts.lastBudget ? (
                          <>
                            Total: <span className="font-medium">{taskCounts.budgetsCount}</span> ·
                            Último: <span className="font-medium">{taskCounts.lastBudget.title}</span> ·
                            {taskCounts.lastBudget.status} · {formatUpdatedAt(taskCounts.lastBudget.updated_at)}
                          </>
                        ) : (
                          <>
                            Total: <span className="font-medium">{taskCounts.budgetsCount}</span> ·
                            Aún no hay presupuestos.
                          </>
                        )
                      ) : (
                        "Resumen no disponible."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/app/projects/${id}/budgets`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Ver presupuestos
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Costes</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {taskCounts ? (
                        <>
                          Total: <span className="font-medium">{taskCounts.costsCount}</span> ·
                          Costes (con IVA): <span className="font-medium">{formatMoneyEUR(taskCounts.costsTotal)}</span>
                        </>
                      ) : (
                        "Resumen no disponible."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/app/projects/${id}/costs`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Ver costes
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight">Compras</h2>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                      {taskCounts ? (
                        taskCounts.lastPurchase ? (
                          <>
                            Total: <span className="font-medium">{taskCounts.purchasesCount}</span> ·
                            Compras (con IVA): <span className="font-medium">{formatMoneyEUR(taskCounts.purchasesTotal)}</span> ·
                            Último: <span className="font-medium">{taskCounts.lastPurchase.title}</span>
                          </>
                        ) : (
                          <>
                            Total: <span className="font-medium">{taskCounts.purchasesCount}</span> ·
                            Aún no hay pedidos.
                          </>
                        )
                      ) : (
                        "Resumen no disponible."
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Link
                      href={`/app/projects/${id}/purchases`}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Ver compras
                    </Link>
                  </div>
                </div>
              </Card>
            </>
          );
        })()}
    </section>
  );
}

