import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { createFirstProjectFromOnboardingAction } from "./actions";

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  display_name: string;
};

type TemplateRow = {
  id: string;
  organization_id: string | null;
  name: string;
  description: string | null;
  is_default: boolean;
};

type TemplatePhaseRow = {
  id: string;
  template_id: string;
};

type TemplateTaskRow = {
  template_phase_id: string;
};

export default async function FirstProjectOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Crear tu primera obra</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para continuar.
          </p>
          <div className="mt-4">
            <Link
              href="/login?redirectTo=/app/onboarding/first-project"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Ir a login
            </Link>
          </div>
        </Card>
      </section>
    );
  }

  const canWrite = ctx.role === "owner" || ctx.role === "admin";
  if (!canWrite) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <Link
          href="/app/onboarding"
          className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
        >
          ← Volver al onboarding
        </Link>

        <EmptyState
          title="Solo lectura"
          description="Pide a un administrador que cree la primera obra."
        />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", ctx.organizationId)
    .order("display_name");

  const clientRows = ((clients ?? []) as ClientRow[]) ?? [];

  const { count: projectsCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", ctx.organizationId);

  const { data: templatesRaw } = await supabase
    .from("project_templates")
    .select("id, organization_id, name, description, is_default")
    .or(`organization_id.is.null,organization_id.eq.${ctx.organizationId}`)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  const templates = ((templatesRaw ?? []) as TemplateRow[]) ?? [];

  const templateIds = templates.map((t) => t.id);

  let phases: TemplatePhaseRow[] = [];
  if (templateIds.length > 0) {
    const { data: phasesRaw } = await supabase
      .from("project_template_phases")
      .select("id, template_id")
      .in("template_id", templateIds);
    phases = ((phasesRaw ?? []) as TemplatePhaseRow[]) ?? [];
  }

  const phaseIds = phases.map((p) => p.id);

  let tasks: TemplateTaskRow[] = [];
  if (phaseIds.length > 0) {
    const { data: tasksRaw } = await supabase
      .from("project_template_tasks")
      .select("template_phase_id")
      .in("template_phase_id", phaseIds);
    tasks = ((tasksRaw ?? []) as TemplateTaskRow[]) ?? [];
  }

  const phasesCountByTemplate = new Map<string, number>();
  for (const p of phases) {
    phasesCountByTemplate.set(p.template_id, (phasesCountByTemplate.get(p.template_id) ?? 0) + 1);
  }

  const phaseToTemplate = new Map<string, string>();
  for (const p of phases) {
    phaseToTemplate.set(p.id, p.template_id);
  }

  const tasksCountByTemplate = new Map<string, number>();
  for (const t of tasks) {
    const tid = phaseToTemplate.get(t.template_phase_id);
    if (tid) {
      tasksCountByTemplate.set(tid, (tasksCountByTemplate.get(tid) ?? 0) + 1);
    }
  }

  const defaultTemplateId = templates.find((t) => t.is_default)?.id ?? "";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <Link
        href="/app/onboarding"
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver al onboarding
      </Link>

      <Card className="p-6 shadow-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Crear tu primera obra</h1>
          <p className="text-sm text-content-secondary sm:text-base">
            Te guiamos con lo mínimo: datos de obra y cliente.
          </p>
        </div>

        {typeof projectsCount === "number" && projectsCount > 0 ? (
          <p className="mt-4 rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
            Ya tienes obras creadas, pero puedes crear otra desde este asistente.
          </p>
        ) : null}

        <form action={createFirstProjectFromOnboardingAction} className="mt-6 space-y-6">
          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Plantilla inicial</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="templateId">
                Plantilla
              </label>
              <select
                id="templateId"
                name="templateId"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                defaultValue={defaultTemplateId || "none"}
              >
                <option value="none">Sin plantilla</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.is_default ? " (recomendada)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-content-tertiary">
                Si eliges una plantilla, se crearán fases y tareas base automáticamente.
              </p>
            </div>

            <div className="rounded-xl border border-subtle bg-bg-raised p-4">
              <p className="text-sm font-medium">Preview</p>
              <ul className="mt-2 space-y-3 text-sm text-content-secondary">
                <li>
                  <span className="font-medium text-content-primary">Sin plantilla</span>
                  <div className="text-xs text-content-tertiary">
                    0 fases · 0 tareas
                  </div>
                </li>
                {templates.map((t) => (
                  <li key={t.id}>
                    <div className="font-medium text-content-primary">{t.name}</div>
                    {t.description ? (
                      <div className="text-xs text-content-tertiary">{t.description}</div>
                    ) : null}
                    <div className="text-xs text-content-tertiary">
                      {(phasesCountByTemplate.get(t.id) ?? 0).toString()} fases · {(tasksCountByTemplate.get(t.id) ?? 0).toString()} tareas
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-content-tertiary">
                Nota: el preview es informativo. La plantilla se aplica al enviar el formulario.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Datos de obra</h2>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="name">
                Nombre
              </label>
              <input
                id="name"
                name="name"
                required
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                name="address"
                required
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="type">
                Tipo
              </label>
              <input
                id="type"
                name="type"
                required
                placeholder="Ej: Reforma integral"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Cliente</h2>

            {clientsError ? (
              <p className="text-sm text-content-secondary">
                No pudimos cargar clientes. Inténtalo de nuevo.
              </p>
            ) : null}

            <div className="space-y-1">
              <label className="text-sm font-medium" htmlFor="clientId">
                Cliente existente
              </label>
              <select
                id="clientId"
                name="clientId"
                className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                defaultValue=""
              >
                <option value="">— Selecciona un cliente —</option>
                {clientRows.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.display_name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-content-tertiary">
                Debes seleccionar un cliente o crear uno nuevo.
              </p>
            </div>

            <details className="rounded-xl border border-subtle bg-bg-raised p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Crear cliente rápido
              </summary>
              <div className="mt-4 space-y-4">
                <input type="hidden" name="quickClientEnabled" value="" />
                <div className="flex items-center gap-2">
                  <input id="quickClientEnabled" name="quickClientEnabled" type="checkbox" className="h-4 w-4" />
                  <label htmlFor="quickClientEnabled" className="text-sm">
                    Crear un cliente nuevo ahora
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="quickClientDisplayName">
                      Nombre del cliente
                    </label>
                    <input
                      id="quickClientDisplayName"
                      name="quickClientDisplayName"
                      className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      placeholder="Ej: María García"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium" htmlFor="quickClientEmail">
                      Email (opcional)
                    </label>
                    <input
                      id="quickClientEmail"
                      name="quickClientEmail"
                      type="email"
                      className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="quickClientPhone">
                    Teléfono (opcional)
                  </label>
                  <input
                    id="quickClientPhone"
                    name="quickClientPhone"
                    className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  />
                </div>

                <p className="text-xs text-content-tertiary">
                  Este cliente se creará dentro de tu organización.
                </p>
              </div>
            </details>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Crear obra
            </button>
          </div>
        </form>
      </Card>
    </section>
  );
}
