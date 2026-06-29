import { Card } from "./Card";
import { cn } from "./cn";

type PageHeaderProps = {
  backLink?: React.ReactNode;
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  backLink,
  eyebrow,
  title,
  description,
  meta,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {backLink ? <div>{backLink}</div> : null}

      <Card padding="lg" shadow="none" className="shadow-none">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {eyebrow ? <div className="mb-2">{eyebrow}</div> : null}
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            {description ? (
              <p className="mt-2 text-sm text-content-secondary sm:text-base">{description}</p>
            ) : null}
            {meta ? <div className="mt-3">{meta}</div> : null}
          </div>

          {actions ? <div className="flex shrink-0 flex-col gap-2 sm:items-end">{actions}</div> : null}
        </div>
      </Card>
    </div>
  );
}
