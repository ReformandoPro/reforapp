import type { ShowcaseProject } from "@/lib/showcase/types";


function toneDotClass(tone: NonNullable<ShowcaseProject["metrics"][number]["tone"]>) {
  switch (tone) {
    case "primary":
      return "bg-[var(--primary-500)]";
    case "success":
      return "bg-[var(--success-500)]";
    case "warning":
      return "bg-[var(--warning-500)]";
    case "danger":
      return "bg-[var(--danger-500)]";
    case "neutral":
    default:
      return "bg-[rgba(255,255,255,0.16)]";
  }
}

type ShowcaseMetricBlockProps = {
  metric: ShowcaseProject["metrics"][number];
};

export function ShowcaseMetricBlock({ metric }: ShowcaseMetricBlockProps) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
          {metric.label}
        </p>
        {metric.tone ? (
          <span
            aria-hidden="true"
            className={`mt-[3px] h-2 w-2 rounded-full ${toneDotClass(metric.tone)}`}
          />
        ) : null}
      </div>
      <p className="m-0 mt-2 font-[var(--font-num)] text-[26px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
        {metric.value}
      </p>
      {metric.helper ? (
        <p className="m-0 mt-2 text-[13px] text-[var(--text-secondary)]">
          {metric.helper}
        </p>
      ) : null}
    </div>
  );
}
