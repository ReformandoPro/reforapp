import type { ShowcaseTone } from "@/lib/showcase/types";

import { cn } from "@/components/ui/cn";

type ShowcaseChipProps = {
  label: string;
  tone?: ShowcaseTone;
  className?: string;
};

function toneStyles(tone: ShowcaseTone) {
  switch (tone) {
    case "primary":
      return "border-[var(--primary-700)] bg-[var(--primary-900)] text-[var(--primary-100)]";
    case "success":
      return "border-[var(--success-700)] bg-[var(--success-900)] text-[var(--success-100)]";
    case "warning":
      return "border-[var(--warning-700)] bg-[var(--warning-900)] text-[var(--warning-100)]";
    case "danger":
      return "border-[var(--danger-700)] bg-[var(--danger-900)] text-[var(--danger-100)]";
    case "neutral":
    default:
      return "border-[var(--guild-border)] bg-[var(--guild-bg)] text-[var(--guild-text)]";
  }
}

export function ShowcaseChip({
  label,
  tone = "neutral",
  className,
}: ShowcaseChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[7px] border px-[9px] py-[4px] text-[10px] font-semibold uppercase tracking-[0.04em]",
        toneStyles(tone),
        className
      )}
    >
      {label}
    </span>
  );
}

