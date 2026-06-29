import { BackLink } from "@/components/ui/BackLink";

import { Card } from "@/components/ui/Card";
import { FormActions } from "@/components/ui/FormActions";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { updateMyProfileAction } from "./actions";

export const dynamic = "force-dynamic";

type ProfileRow = {
  user_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
};

export default async function AppProfilePage({
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
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Perfil</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver tu perfil.
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data, error: loadError } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone")
    .eq("user_id", ctx.user.id)
    .maybeSingle();

  if (loadError) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar tu perfil"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const row = (data ?? {
    user_id: ctx.user.id,
    display_name: "",
    email: ctx.user.email ?? null,
    phone: null,
  }) as ProfileRow;

  const email = row.email ?? ctx.user.email ?? "—";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href="/app">← Volver al panel</BackLink>

      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mi perfil</h1>
        <p className="mt-2 text-sm text-content-secondary sm:text-base">
          Configura tu nombre visible para asignaciones de tareas.
        </p>

        <form action={updateMyProfileAction} className="mt-6 space-y-6">
          {error ? (
            <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="display_name">
              Nombre visible
            </label>
            <input
              id="display_name"
              name="display_name"
              defaultValue={row.display_name ?? ""}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              placeholder="Ej: Marta López"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              value={email}
              readOnly
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm opacity-80"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="phone">
              Teléfono (opcional)
            </label>
            <input
              id="phone"
              name="phone"
              defaultValue={row.phone ?? ""}
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              placeholder="Ej: +34 600 000 000"
            />
          </div>

          <FormActions layout="end">
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Guardar
            </button>
          </FormActions>
        </form>
      </Card>
    </section>
  );
}
