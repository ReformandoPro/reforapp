import { PhoneFrame } from "@/components/showcase/PhoneFrame";
import { ShowcaseProjectScreen } from "@/components/screens/showcase/ShowcaseProjectScreen";
import { getShowcaseProjectBySlug } from "@/lib/showcase/projects";

export default function DesignReferencePage() {
  const project = getShowcaseProjectBySlug("obra-centro");

  return (
    <section className="showcasePage">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <header className="rounded-[16px] border border-[var(--b-subtle)] bg-[var(--bg-surface)] p-6">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--primary-300)]">
            Design System Playground
          </p>
          <h1 className="m-0 mt-3 text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            Referencia viva del sistema
          </h1>
          <p className="m-0 mt-2 max-w-[70ch] text-[15px] leading-[1.65] text-[var(--text-secondary)]">
            Esta página renderiza componentes reales del Design System (Showcase) usando la gramática visual S01
            ({"\"Nuevo Presupuesto\""}) como referencia. No usa datos operativos.
          </p>
        </header>

        <div className="flex flex-col items-center gap-3">
          <PhoneFrame>
            {project ? (
              <ShowcaseProjectScreen project={project} variant="compact" />
            ) : (
              <div className="p-6 text-[var(--text-secondary)]">Showcase mock no encontrado.</div>
            )}
          </PhoneFrame>
          {project ? (
            <p className="m-0 text-center text-[12px] text-[var(--text-tertiary)]">
              Live components · /showcase/projects/{project.slug}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
