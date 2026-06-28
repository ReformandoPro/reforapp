import Link from "next/link";

import { cn } from "@/components/ui/cn";

type ShowcasePrimaryCTAProps = {
  label: string;
  href: string;
  className?: string;
};

export function ShowcasePrimaryCTA({
  label,
  href,
  className,
}: ShowcasePrimaryCTAProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-[12px] bg-[var(--primary-500)] px-4 py-[14px] text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(45,127,249,0.35)] transition-colors hover:bg-[var(--primary-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-300)]",
        className
      )}
    >
      {label}
    </Link>
  );
}

