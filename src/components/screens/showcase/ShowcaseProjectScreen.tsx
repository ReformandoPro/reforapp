import type { ShowcaseProject } from "@/lib/showcase/types";

import { ShowcaseChip } from "@/components/showcase/ui/ShowcaseChip";
import { ShowcaseDividerRow } from "@/components/showcase/ui/ShowcaseDividerRow";
import { ShowcaseHeaderBar } from "@/components/showcase/ui/ShowcaseHeaderBar";
import { ShowcaseMetricBlock } from "@/components/showcase/ui/ShowcaseMetricBlock";
import { ShowcasePrimaryCTA } from "@/components/showcase/ui/ShowcasePrimaryCTA";
import { ShowcaseProgressBar } from "@/components/showcase/ui/ShowcaseProgressBar";
import { ShowcaseSurface } from "@/components/showcase/ui/ShowcaseSurface";
import { ShowcaseTimeline } from "@/components/showcase/ui/ShowcaseTimeline";

import styles from "./ShowcaseProjectScreen.module.css";

export type ShowcaseProjectScreenVariant = "page" | "compact";

type ShowcaseProjectScreenProps = {
  project: ShowcaseProject;
  variant: ShowcaseProjectScreenVariant;
};

function toneToChipVariant(
  tone: ShowcaseProject["status"]["tone"]
): "neutral" | "primary" | "success" | "warning" | "danger" {
  return tone;
}

export function ShowcaseProjectScreen({
  project,
  variant,
}: ShowcaseProjectScreenProps) {
  return (
    <section className={styles.pageBg}>
      <div className={styles.pageShell}>
        <div className={styles.root} data-variant={variant}>
          <ShowcaseHeaderBar
            title={project.title}
            subtitle={`${project.subtitle} · ${project.location}`}
            rightSlot={
              <ShowcaseChip
                label={project.status.label}
                tone={toneToChipVariant(project.status.tone)}
              />
            }
          />

          <div className={styles.hero}>
            <p className={styles.heroEyebrow}>{project.hero.eyebrow}</p>
            <h1 className={styles.heroHeadline}>{project.hero.headline}</h1>
            <p className={styles.heroDescription}>{project.hero.description}</p>
            <div className={styles.heroCtaRow}>
              <ShowcasePrimaryCTA
                label={project.hero.ctaLabel}
                href="#timeline"
              />
            </div>
          </div>

          <div className={styles.metricsRow}>
            {project.metrics.map((metric) => (
              <ShowcaseSurface key={metric.label} className={styles.metricSurface}>
                <ShowcaseMetricBlock metric={metric} />
              </ShowcaseSurface>
            ))}
          </div>

          <div className={styles.mainGrid}>
            <div className={styles.col}>
              <ShowcaseSurface>
                <div className={styles.sectionHeadRow}>
                  <p className={styles.sectionTitle}>{project.progress.label}</p>
                  <p className={styles.sectionValue}>
                    <span className={styles.num}>{project.progress.value}%</span>
                  </p>
                </div>
                <ShowcaseProgressBar value={project.progress.value} />
                {project.progress.helper ? (
                  <p className={styles.helper}>{project.progress.helper}</p>
                ) : null}
              </ShowcaseSurface>

              <ShowcaseSurface id="timeline">
                <div className={styles.sectionHeadRow}>
                  <p className={styles.sectionTitle}>Planificación</p>
                  <ShowcaseChip label="S01" tone="neutral" />
                </div>
                <ShowcaseTimeline items={project.timeline} />
              </ShowcaseSurface>
            </div>

            <div className={styles.col}>
              <ShowcaseSurface>
                <p className={styles.sectionTitle}>Economía</p>
                <div className={styles.budgetGrid}>
                  <div className={styles.budgetRow}>
                    <p className={styles.budgetLabel}>Estimado</p>
                    <p className={styles.budgetValue}>
                      <span className={styles.num}>{project.budget.estimated}</span>
                    </p>
                  </div>
                  <ShowcaseDividerRow />
                  <div className={styles.budgetRow}>
                    <p className={styles.budgetLabel}>Gastado</p>
                    <p className={styles.budgetValue}>
                      <span className={styles.num}>{project.budget.spent}</span>
                    </p>
                  </div>
                  <ShowcaseDividerRow />
                  <div className={styles.budgetRow}>
                    <p className={styles.budgetLabel}>Restante</p>
                    <p className={styles.budgetValue}>
                      <span className={styles.num}>{project.budget.remaining}</span>
                    </p>
                  </div>
                </div>

                <div className={styles.budgetDeviation}>
                  <p className={styles.budgetDeviationLabel}>Desviación</p>
                  <ShowcaseChip
                    label={project.budget.deviationLabel}
                    tone={project.budget.deviationTone}
                  />
                </div>
              </ShowcaseSurface>

              <ShowcaseSurface>
                <div className={styles.sectionHeadRow}>
                  <p className={styles.sectionTitle}>Gremios</p>
                  <ShowcaseChip
                    label={`${project.guilds.length} activos`}
                    tone="neutral"
                  />
                </div>
                <div className={styles.guildsRow}>
                  {project.guilds.map((g) => (
                    <ShowcaseChip
                      key={g.name}
                      label={`${g.name} · ${g.statusLabel}`}
                      tone={g.tone ?? "neutral"}
                    />
                  ))}
                </div>
              </ShowcaseSurface>

              <ShowcaseSurface>
                <p className={styles.sectionTitle}>Destacados</p>
                <div className={styles.highlightsGrid}>
                  {project.highlights.map((h) => (
                    <ShowcaseSurface key={h.title} className={styles.highlightItem}>
                      <p className={styles.highlightTitle}>{h.title}</p>
                      <p className={styles.highlightDescription}>{h.description}</p>
                    </ShowcaseSurface>
                  ))}
                </div>
              </ShowcaseSurface>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

