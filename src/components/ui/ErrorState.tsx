import type { ReactNode } from "react";

type ErrorStateProps = {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function ErrorState({
  title = "No se pudo cargar la vista",
  description,
  actions,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      className={[
        "rounded-lg border border-danger-500 bg-danger-900 p-6 text-center",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="text-base font-semibold text-danger-100">{title}</h3>
      {description ? <p className="mt-2 text-sm text-danger-100/80">{description}</p> : null}
      {actions ? <div className="mt-4 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
