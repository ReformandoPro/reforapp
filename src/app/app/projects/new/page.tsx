import { redirect } from "next/navigation";

import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { canCreateProjects } from "@/lib/services/project-operational-permissions";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { CreateProjectForm } from "./CreateProjectForm";

export const dynamic = "force-dynamic";

type ClientRow = {
  id?: unknown;
  display_name?: unknown;
};

export function mapClientRowsToOptions(rows: unknown): Array<{ id: string; displayName: string }> {
  if (!Array.isArray(rows)) return [];

  return rows.flatMap((row: ClientRow) => {
    if (typeof row?.id !== "string" || typeof row.display_name !== "string") return [];
    const displayName = row.display_name.trim();
    return displayName ? [{ id: row.id, displayName }] : [];
  });
}

export default async function NewProjectPage() {
  const context = await getOrganizationContextForRequest();

  if (!context.ok) {
    if (context.reason === "missing_membership") redirect("/app/onboarding");
    redirect("/login?redirectTo=/app/projects/new");
  }

  if (!canCreateProjects(context.role)) {
    return (
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <BackLink href="/app/projects">← Volver a obras</BackLink>
        <EmptyState title="Acceso denegado" description="No tienes permisos para crear obras." />
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, display_name")
    .eq("organization_id", context.organizationId)
    .order("display_name");

  if (error) {
    throw new Error("Unable to load clients from Supabase", { cause: error });
  }

  const clients = mapClientRowsToOptions(data);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <BackLink href="/app/projects">← Volver a obras</BackLink>
      <Card className="p-6 shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Nueva obra</h1>
        <p className="mt-2 text-sm text-content-secondary sm:text-base">
          Crea la obra con los datos mínimos. Podrás completar el resto más adelante.
        </p>
        <CreateProjectForm clients={clients} />
      </Card>
    </section>
  );
}
