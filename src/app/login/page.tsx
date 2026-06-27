import { Card } from "@/components/ui/Card";
import { loginWithPassword } from "./actions";

type LoginPageProps = {
  searchParams: Promise<{ redirectTo?: string; error?: string }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { redirectTo, error } = await searchParams;
  const safeRedirectTo = redirectTo?.startsWith("/app")
    ? redirectTo
    : "/app/projects";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center px-4 py-10">
      <Card className="w-full border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)] shadow-none">
        <h1 className="text-2xl font-semibold tracking-tight">Acceder</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Inicia sesión para acceder a tu zona privada.
        </p>

        <form action={loginWithPassword} className="mt-6 space-y-4">
          {error ? (
            <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-raised)] px-3 py-2 text-sm text-[var(--text-secondary)]">
              Credenciales inválidas o usuario no confirmado.
            </p>
          ) : null}
          <input type="hidden" name="redirectTo" value={safeRedirectTo} />

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            />
          </div>

          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Entrar
          </button>

          <p className="text-xs text-[var(--text-tertiary)]">
            Si aún no tienes usuario, créalo en Supabase Auth y asígnate una
            membership (owner/admin/member) para tu organización.
          </p>
        </form>
      </Card>
    </main>
  );
}

