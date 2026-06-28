import Link from "next/link";

import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const COPY: Record<string, { title: string; description: string }> = {
  invalid: {
    title: "Enlace inválido",
    description: "Este enlace no existe o no es válido.",
  },
  expired: {
    title: "Invitación expirada",
    description: "La invitación ha expirado. Pide que te envíen una nueva.",
  },
  used: {
    title: "Invitación ya utilizada",
    description: "Esta invitación ya se aceptó o ya perteneces a la empresa.",
  },
  revoked: {
    title: "Invitación revocada",
    description: "La invitación fue revocada por un administrador.",
  },
  forbidden: {
    title: "Email no coincide",
    description: "Inicia sesión con el email invitado y vuelve a intentarlo.",
  },
  error: {
    title: "No se pudo aceptar la invitación",
    description: "Ha ocurrido un error. Inténtalo de nuevo o pide una nueva invitación.",
  },
};

export default async function InviteStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string }>;
}) {
  const { s } = await searchParams;
  const status = s ?? "error";
  const copy = COPY[status] ?? COPY.error;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <Card className="border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.title}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] sm:text-base">{copy.description}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/app"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-5 py-2 text-sm font-medium text-content-secondary"
          >
            Ir al panel
          </Link>
        </div>
      </Card>
    </section>
  );
}
