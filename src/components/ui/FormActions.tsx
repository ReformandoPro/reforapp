import type { ReactNode } from "react";

import { cn } from "@/components/ui/cn";

export type FormActionsProps = {
  note?: ReactNode;
  children: ReactNode;
  layout?: "end" | "between" | "betweenResponsive";
  className?: string;
};

export function FormActions({
  note,
  children,
  layout = "end",
  className,
}: FormActionsProps) {
  const layoutClassName =
    layout === "between"
      ? "flex items-center justify-between gap-4"
      : layout === "betweenResponsive"
        ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        : "flex justify-end";

  return (
    <div className={cn(layoutClassName, className)}>
      {note ? <p className="text-xs text-content-tertiary">{note}</p> : null}
      {children}
    </div>
  );
}
