import type { ComponentProps, ReactNode } from "react";

import Link from "next/link";

import { Card } from "./Card";
import { cn } from "./cn";

type CardLinkRowProps = Omit<ComponentProps<typeof Link>, "className"> & {
  heading: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  meta?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function CardLinkRow({
  heading,
  description,
  eyebrow,
  leading,
  trailing,
  meta,
  className,
  contentClassName,
  ...props
}: CardLinkRowProps) {
  return (
    <Card className={cn("p-0 shadow-none", className)}>
      <Link
        className={cn(
          "block p-5 transition-colors hover:bg-bg-raised",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          contentClassName
        )}
        {...props}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            {leading ? <div className="shrink-0">{leading}</div> : null}

            <div className="min-w-0 flex-1">
              {eyebrow ? (
                <p className="text-xs font-medium text-content-tertiary">{eyebrow}</p>
              ) : null}

              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight text-content-primary">
                  {heading}
                </p>
                {description ? (
                  <p className="mt-1 text-sm text-content-secondary">{description}</p>
                ) : null}
                {meta ? <div className="mt-2 text-xs text-content-tertiary">{meta}</div> : null}
              </div>
            </div>
          </div>

          {trailing ? <div className="shrink-0">{trailing}</div> : null}
        </div>
      </Link>
    </Card>
  );
}
