import type { ReactNode } from "react";

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actions,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={[
        "rounded-lg border border-dashed bg-bg-surface p-6 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="text-base font-semibold text-content-primary">{title}</h3>
      {description ? <p className="mt-2 text-sm text-content-secondary">{description}</p> : null}
      {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
