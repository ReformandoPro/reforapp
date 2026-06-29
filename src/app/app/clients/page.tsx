import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardLinkRow } from "@/components/ui/CardLinkRow";
import { BackLink } from "@/components/ui/BackLink";
import { LinkButton } from "@/components/ui/LinkButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { getOrganizationContextForRequest } from "@/lib/services/org-context";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export const dynamic = "force-dynamic";

type ClientRow = {
  id: string;
  display_name: string;
  phone: string | null;
  email: string | null;
};

export default async function AppClientsPage() {
  const ctx = await getOrganizationContextForRequest();

  if (!ctx.ok) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="p-6 shadow-none">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Clientes</h1>
          <p className="mt-2 text-sm text-content-secondary sm:text-base">
            Inicia sesión para ver clientes.
          </p>
        </Card>
      </section>
    );
  }

  const supabase = await createServerSupabaseClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, display_name, phone, email")
    .eq("organization_id", ctx.organizationId)
    .order("display_name", { ascending: true });

  if (error) {
    return (
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <EmptyState
          title="No pudimos cargar los clientes"
          description="Revisa tu conexión e inténtalo de nuevo."
        />
      </section>
    );
  }

  const rows = (clients ?? []) as ClientRow[];

  const canWrite = ctx.role === "owner" || ctx.role === "admin";

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <BackLink
        href="/app"
        className="inline-flex text-sm font-medium text-content-secondary hover:text-content-primary"
      >
        ← Volver al panel
      </BackLink>

      <PageHeader
        title="Clientes"
        description="Clientes de tu organización."
        actions={
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <Badge tone="neutral">Total: {rows.length}</Badge>
            {canWrite ? <LinkButton href="/app/clients/new">Nuevo cliente</LinkButton> : null}
          </div>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Sin clientes"
          description={
            canWrite
              ? "Crea tu primer cliente para asociar obras."
              : "Aún no hay clientes en tu organización."
          }
          actions={canWrite ? <LinkButton href="/app/clients/new">Nuevo cliente</LinkButton> : null}
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((c) => (
            <CardLinkRow
              key={c.id}
              href={`/app/clients/${c.id}`}
              heading={c.display_name}
              description={
                <>
                  {c.email ? `Email: ${c.email}` : ""}
                  {c.email && c.phone ? " · " : ""}
                  {c.phone ? `Tel: ${c.phone}` : ""}
                  {!c.email && !c.phone ? "—" : ""}
                </>
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
