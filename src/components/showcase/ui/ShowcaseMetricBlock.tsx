import type { ShowcaseProject } from "@/lib/showcase/types";

import { ShowcaseChip } from "./ShowcaseChip";

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
        {metric.tone ? <ShowcaseChip label={metric.tone} tone={metric.tone} /> : null}
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

