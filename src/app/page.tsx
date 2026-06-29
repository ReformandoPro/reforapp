import type { ReactNode } from "react";
import type { Metadata } from "next";

const CTA_HREF =
  "mailto:hola@reformando.pro?subject=Acceso%20beta%20Reformando";

export const metadata: Metadata = {
  title: "Reformando.app — Gestión integral de reformas",
  description:
    "Reformando centraliza obras, presupuestos, tareas, fases, costes, compras, documentos y comunicación para empresas de reformas, jefes de obra y arquitectos.",
};

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-2 text-center">
      <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="text-pretty text-sm text-content-secondary sm:text-base">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      {children}
    </a>
  );
}

function SecondaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold tracking-tight text-white">
              Reformando.app
            </p>
            <p className="text-sm text-content-secondary">
              Gestión integral de reformas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PrimaryButton href={CTA_HREF}>Solicitar acceso beta</PrimaryButton>
          </div>
        </header>

        <section className="rounded-3xl border border-subtle bg-bg-surface p-8 shadow-sm sm:p-12">
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <p className="text-xs font-medium uppercase tracking-wide text-content-tertiary">
                Beta privada
              </p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                Gestiona tus reformas de principio a fin desde una sola plataforma
              </h1>
              <p className="text-pretty text-sm text-content-secondary sm:text-lg">
                Reformando centraliza obras, presupuestos, tareas, fases, costes,
                compras, documentos y comunicación para empresas de reformas,
                jefes de obra y arquitectos.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PrimaryButton href={CTA_HREF}>Solicitar acceso beta</PrimaryButton>
              <SecondaryButton href="#modulos">Ver módulos</SecondaryButton>
            </div>

            <p className="text-xs text-content-tertiary">
              Acceso por invitación. Sin login público. Estamos recogiendo feedback
              inicial.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <SectionHeading
            title="Las reformas se gestionan hoy con demasiadas herramientas desconectadas"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "presupuestos en hojas de cálculo;",
              "planificación en herramientas separadas;",
              "comunicación por WhatsApp;",
              "compras sin trazabilidad;",
              "cambios de alcance mal documentados;",
              "poca visibilidad sobre costes, plazos y responsables.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-subtle bg-bg-surface p-5"
              >
                <p className="text-sm text-content-secondary">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <SectionHeading
            title="Un sistema operativo para empresas de reformas"
            description="Reformando conecta la gestión comercial, técnica, económica y operativa de cada obra en un único flujo de trabajo."
          />
        </section>

        <section id="modulos" className="flex scroll-mt-24 flex-col gap-8">
          <SectionHeading title="Módulos" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Clientes y obras", desc: "Base operativa por cliente y proyecto." },
              { title: "Presupuestos", desc: "Control de márgenes, estados y revisiones." },
              { title: "Tareas y fases", desc: "Ejecución y planificación en el mismo lugar." },
              { title: "Costes y compras", desc: "Visibilidad real de costes y proveedores." },
              { title: "Documentos y avances", desc: "Evidencias, progreso y trazabilidad." },
              { title: "Roles y permisos", desc: "Accesos claros por equipo y responsabilidad." },
              { title: "Comunicación con equipo y cliente", desc: "Contexto y decisiones vinculadas a la obra." },
              { title: "Reporting operativo", desc: "Indicadores accionables sin perder detalle." },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-subtle bg-bg-surface p-5"
              >
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-content-secondary">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-8">
          <SectionHeading title="Para quién es" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {
              [
                "Empresas de reformas",
                "Jefes de proyecto",
                "Jefes de obra",
                "Arquitectos",
                "Administración",
                "Clientes finales",
              ].map((label) => (
                <div
                  key={label}
                  className="rounded-2xl border border-subtle bg-bg-surface p-5"
                >
                  <p className="text-sm font-medium text-white">{label}</p>
                </div>
              ))
            }
          </div>
        </section>

        <section className="flex flex-col gap-6 rounded-3xl border border-subtle bg-bg-surface p-8 sm:p-10">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Estado beta
          </h2>
          <p className="text-pretty text-sm text-content-secondary sm:text-base">
            Reformando está en fase beta privada. Estamos validando el producto con
            profesionales del sector antes de abrir el acceso general.
          </p>
        </section>

        <section className="flex flex-col items-center gap-6 rounded-3xl border border-subtle bg-bg-surface p-8 text-center sm:p-12">
          <h2 className="text-balance text-2xl font-semibold tracking-tight text-white sm:text-4xl">
            ¿Quieres probar Reformando o darnos feedback?
          </h2>
          <PrimaryButton href={CTA_HREF}>Solicitar acceso beta</PrimaryButton>
          <p className="max-w-2xl text-pretty text-sm text-content-secondary sm:text-base">
            Estamos buscando empresas y profesionales de reformas que quieran
            ayudarnos a validar el producto.
          </p>
        </section>

        <footer className="pb-4 text-center">
          <p className="text-xs text-content-tertiary">
            © {new Date().getFullYear()} Reformando.app
          </p>
        </footer>
      </div>
    </main>
  );
}
