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
  neutral: "before:bg-content-tertiary",
  info: "before:bg-primary-500",
  success: "before:bg-success-500",
  warning: "before:bg-warning-500",
  danger: "before:bg-danger-500",
};

const eyebrowClasses: Record<ListItemTone, string> = {
  neutral: "text-content-tertiary",
  info: "text-primary-100",
  success: "text-success-100",
  warning: "text-warning-100",
  danger: "text-danger-100",
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
        "relative overflow-hidden rounded-lg border border-subtle bg-bg-base p-4 shadow-none before:absolute before:inset-y-0 before:left-0 before:w-1",
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
          <p className="font-semibold text-content-primary">{title}</p>
          {description ? <p className="mt-1 text-sm text-content-secondary">{description}</p> : null}
        </div>
        {trailing ? <div className="shrink-0">{trailing}</div> : null}
      </div>
    </div>
  );
}
