import Link from "next/link";
import { redirect } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { formatMoneyEUR } from "@/lib/services/budgets-basic";
import { computeCostTotals } from "@/lib/services/costs";
import { computePurchaseTotals } from "@/lib/services/purchases";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

export default async function AppDashboardPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    if (ctx.reason === "missing_membership") {
      redirect("/app/onboarding");
    }

    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Panel</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión e inténtalo de nuevo.
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const [
    activeProjectsCount,
    openTasksCount,
    docsCount,
    progressLast,
    acceptedBudgets,
    costsRows,
    purchasesPending,
    pendingPurchaseItemsRows,
    phasesInProgress,
    profileRow,
    membersCount,
    invitationsCount,
    projectsTotal,
    latestProjectRow,
    phasesTotal,
    tasksTotal,
  ] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId)
        .in("status", [
          "lead",
          "budgeting",
          "approved",
          "scheduled",
          "in_progress",
          "paused",
          "completed",
          "delivered",
        ]),
      supabase
        .from("project_tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId)
        .in("status", ["pending", "in_progress", "blocked"]),
      supabase
        .from("project_documents")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("project_progress_updates")
        .select("project_id, progress, note, created_at")
        .eq("organization_id", ctx.organizationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_budgets")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId)
        .eq("status", "accepted"),
      supabase
        .from("project_costs")
        .select("amount, tax_rate")
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("project_purchases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId)
        .in("status", ["planned", "ordered"]),
      supabase
        .from("project_purchase_items")
        .select(
          `
          quantity,
          unit_price,
          tax_rate,
          purchase:project_purchases (
            status
          )
        `
        )
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("project_phases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId)
        .eq("status", "in_progress"),
      supabase
        .from("profiles")
        .select("user_id, display_name, phone")
        .eq("user_id", ctx.user.id)
        .maybeSingle(),
      supabase
        .from("memberships")
        .select("user_id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("organization_invitations")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("projects")
        .select("id")
        .eq("organization_id", ctx.organizationId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("project_phases")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId),
      supabase
        .from("project_tasks")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.organizationId),
    ]);

  const costsTotals = computeCostTotals(
    (costsRows.data ?? []).map((r: { amount: string | number; tax_rate: string | number }) => ({
      amount: Number(r.amount),
      taxRate: Number(r.tax_rate),
    }))
  );

  const pendingPurchaseItems = (pendingPurchaseItemsRows.data ?? []) as Array<{
    quantity: string | number;
    unit_price: string | number;
    tax_rate: string | number;
    purchase: { status: string } | { status: string }[] | null;
  }>;

  const purchasesTotals = computePurchaseTotals(
    pendingPurchaseItems
      .filter((r) => {
        const purchase = Array.isArray(r.purchase) ? r.purchase[0] : r.purchase;
        return purchase?.status === "planned" || purchase?.status === "ordered";
      })
      .map((r) => ({
        quantity: Number(r.quantity),
        unitPrice: Number(r.unit_price),
        taxRate: Number(r.tax_rate),
      }))
  );

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

  const onboarding = (() => {
    type ProfileData = { display_name: string | null; phone: string | null };
    type LatestProjectData = { id: string };

    const empresaCreada = true; // by reaching /app, ctx.ok implies membership/org exists

    const profileData = (profileRow.data ?? null) as ProfileData | null;
    const displayName = String(profileData?.display_name ?? "").trim();
    const perfilCompletado = displayName.length > 0;

    const primerMiembroInvitado = (invitationsCount.count ?? 0) > 0 || (membersCount.count ?? 0) > 1;

    const primeraObraCreada = (projectsTotal.count ?? 0) > 0;

    const plantillaAplicada = (phasesTotal.count ?? 0) > 0;

    const primeraTareaCreada = (tasksTotal.count ?? 0) > 0;

    const latestProjectId = ((latestProjectRow.data ?? null) as LatestProjectData | null)?.id;

    const checklist = [
      {
        key: "empresa",
        label: "Empresa creada",
        done: empresaCreada,
        ctaLabel: null as string | null,
        ctaHref: null as string | null,
      },
      {
        key: "perfil",
        label: "Perfil completado",
        done: perfilCompletado,
        ctaLabel: "Completar perfil",
        ctaHref: "/app/profile",
      },
      {
        key: "equipo",
        label: "Primer miembro invitado",
        done: primerMiembroInvitado,
        ctaLabel: "Invitar equipo",
        ctaHref: "/app/onboarding",
      },
      {
        key: "obra",
        label: "Primera obra creada",
        done: primeraObraCreada,
        ctaLabel: "Crear primera obra",
        ctaHref: "/app/onboarding/first-project",
      },
      {
        key: "plantilla",
        label: "Plantilla aplicada",
        done: plantillaAplicada,
        ctaLabel: latestProjectId ? "Aplicar plantilla" : "Crear obra",
        ctaHref: latestProjectId ? `/app/projects/${latestProjectId}/phases` : "/app/onboarding/first-project",
      },
      {
        key: "tarea",
        label: "Primera tarea creada",
        done: primeraTareaCreada,
        ctaLabel: latestProjectId ? "Ir a la obra" : "Ver obras",
        ctaHref: latestProjectId ? `/app/projects/${latestProjectId}` : "/app/projects",
      },
    ];

    const allDone = checklist.every((i) => i.done);

    const nextBest =
      checklist.find((i) => !i.done && i.ctaHref && i.ctaLabel) ?? null;

    return { checklist, allDone, nextBest };
  })();

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        title="Panel"
        description="Resumen rápido de tu organización."
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge tone="neutral">Obras activas: {activeProjectsCount.count ?? 0}</Badge>
            <Badge tone="neutral">Tareas abiertas: {openTasksCount.count ?? 0}</Badge>
            <Badge tone="neutral">Docs: {docsCount.count ?? 0}</Badge>
          </div>
        }
      />

      {!onboarding.allDone ? (
        <Card className="p-6 shadow-none">
          <div className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Primeros pasos</h2>
            <p className="text-sm text-content-secondary">
              Un checklist rápido para terminar la implantación.
            </p>
          </div>

          <div className="mt-4 grid gap-2 text-sm">
            {onboarding.checklist.map((item) => (
              <div key={item.key} className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-content-secondary">{item.label}</span>
                  {item.done ? <Badge tone="success">Completado</Badge> : <Badge tone="neutral">Pendiente</Badge>}
                </div>
                {!item.done && item.ctaHref && item.ctaLabel ? (
                  <Link
                    href={item.ctaHref}
                    className="inline-flex min-h-10 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {item.ctaLabel}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>

          {onboarding.nextBest ? (
            <div className="mt-6 rounded-xl border border-subtle bg-bg-raised p-4">
              <p className="text-sm font-semibold">Tu siguiente paso</p>
              <p className="mt-1 text-sm text-content-secondary">{onboarding.nextBest.label}</p>
              <div className="mt-3">
                <Link
                  href={onboarding.nextBest.ctaHref ?? "/app"}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {onboarding.nextBest.ctaLabel}
                </Link>
              </div>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card className="p-6 shadow-none">
          <h2 className="text-lg font-semibold tracking-tight">¡Todo listo! Ya puedes gestionar tus obras.</h2>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-6 shadow-none">
          <h2 className="text-lg font-semibold tracking-tight">Economía</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Presupuestos aceptados</span>
              <span className="font-medium">{acceptedBudgets.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Costes reales (con IVA)</span>
              <span className="font-medium">{formatMoneyEUR(costsTotals.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Compras pendientes (con IVA)</span>
              <span className="font-medium">{formatMoneyEUR(purchasesTotals.total)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-none">
          <h2 className="text-lg font-semibold tracking-tight">Operaciones</h2>
          <div className="mt-4 grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Compras pendientes</span>
              <span className="font-medium">{purchasesPending.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Fases en curso</span>
              <span className="font-medium">{phasesInProgress.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-content-secondary">Último avance</span>
              <span className="font-medium">
                {progressLast.data
                  ? `${progressLast.data.progress}% · ${formatDateTime(progressLast.data.created_at)}`
                  : "—"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 shadow-none">
        <h2 className="text-lg font-semibold tracking-tight">Atajos</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/app/projects"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Ver obras
          </Link>
          <Link
            href="/app/clients"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Ver clientes
          </Link>
          <Link
            href="/app/team"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Ver equipo
          </Link>
        </div>
      </Card>
    </section>
  );
}
