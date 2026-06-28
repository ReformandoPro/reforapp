import { redirect } from "next/navigation";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/ssr";

import { acceptInvitationAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent(`/invite/${token}`)}`);
  }

  // We do not validate token here (would require hashing). The server action handles it.
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Aceptar invitación</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">
            Estás a punto de unirte a la empresa. Si confías en el remitente, confirma para continuar.
          </p>
        </div>

        <form action={acceptInvitationAction} className="mt-6 space-y-4">
          <input type="hidden" name="token" value={token} />

          <button
            type="submit"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Aceptar invitación
          </button>

          <p className="text-xs text-[var(--text-tertiary)]">
            Nota: todavía no enviamos emails automáticos. Este enlace es temporal.
          </p>
        </form>
      </Card>

      <EmptyState
        title="¿Tienes problemas?"
        description="Si el enlace es inválido, está expirado o ya se utilizó, verás un mensaje claro al intentar aceptarlo."
      />
    </section>
  );
}
