import type { ShowcaseProject } from "@/lib/showcase/types";

import { cn } from "@/components/ui/cn";

type ShowcaseTimelineProps = {
  items: ShowcaseProject["timeline"]; 
};

function dotClass(status: ShowcaseProject["timeline"][number]["status"]) {
  switch (status) {
    case "done":
      return "bg-[var(--success-500)]";
    case "current":
      return "border-2 border-[var(--primary-500)] bg-transparent";
    case "pending":
    default:
      return "bg-[rgba(255,255,255,0.10)]";
  }
}

export function ShowcaseTimeline({ items }: ShowcaseTimelineProps) {
  return (
    <ol className="m-0 mt-4 list-none p-0">
      {items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <li key={`${it.title}-${it.date}`} className="relative flex gap-4 pb-6">
            <div className="relative flex w-6 flex-col items-center">
              <div
                className={cn(
                  "mt-[2px] h-[14px] w-[14px] rounded-full",
                  dotClass(it.status)
                )}
                aria-hidden="true"
              />
              {!isLast ? (
                <div
                  className="mt-2 h-full w-[2px] bg-[var(--b-strong)] opacity-70"
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p
                  className={cn(
                    "m-0 text-[15px] font-semibold",
                    it.status === "current" ? "text-[var(--primary-300)]" : "text-[var(--text-primary)]"
                  )}
                >
                  {it.title}
                </p>
                <p className="m-0 text-[12px] text-[var(--text-tertiary)]">
                  {it.date}
                </p>
              </div>
              <p className="m-0 mt-2 text-[12px] italic leading-[1.55] text-[var(--text-tertiary)]">
                {it.description}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

