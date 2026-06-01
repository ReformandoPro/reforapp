import type { HTMLAttributes, ReactNode } from "react";

type ListItemTone = "neutral" | "info" | "success" | "warning" | "danger";

type ListItemProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description?: string;
  eyebrow?: string;
  trailing?: ReactNode;
  tone?: ListItemTone;
};

const accentClasses: Record<ListItemTone, string> = {
  neutral: "before:bg-[var(--border-subtle)]",
  info: "before:bg-[var(--primary-500)]",
  success: "before:bg-[var(--success-500)]",
  warning: "before:bg-[var(--warning-500)]",
  danger: "before:bg-[var(--danger-500)]",
};

const eyebrowClasses: Record<ListItemTone, string> = {
  neutral: "text-[var(--text-tertiary)]",
  info: "text-[var(--primary-100)]",
  success: "text-[var(--success-100)]",
  warning: "text-[var(--warning-100)]",
  danger: "text-[var(--danger-100)]",
};

export function ListItem({
  title,
  description,
  eyebrow,
  trailing,
  tone = "neutral",
  className = "",
  ...props
}: ListItemProps) {
  return (
    <div
      className={[
        "relative overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 shadow-none before:absolute before:inset-y-0 before:left-0 before:w-1",
        accentClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p
              className={[
                "text-[11px] font-medium uppercase tracking-[0.14em]",
                eyebrowClasses[tone],
              ].join(" ")}
            >
              {eyebrow}
            </p>
          ) : null}
          <p className="font-semibold text-[var(--text-primary)]">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}
