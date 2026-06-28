import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

type ShowcaseHeaderBarProps = {
  title: string;
  subtitle: string;
  rightSlot?: ReactNode;
  className?: string;
};

export function ShowcaseHeaderBar({
  title,
  subtitle,
  rightSlot,
  className,
}: ShowcaseHeaderBarProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 rounded-[18px] border border-[var(--b-strong)] bg-[var(--bg-base)] px-[18px] py-[16px]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="m-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-300)]">
            Showcase
          </p>
          <p className="m-0 mt-2 truncate text-[18px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
            {title}
          </p>
          <p className="m-0 mt-1 text-[13px] text-[var(--text-secondary)]">
            {subtitle}
          </p>
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </header>
  );
}

