import Link from "next/link";

import { cn } from "./cn";

type BackLinkProps = React.ComponentProps<typeof Link> & {
  children?: React.ReactNode;
  className?: string;
};

export function BackLink({ children, className, ...props }: BackLinkProps) {
  return (
    <Link
      className={cn(
        "inline-flex text-sm font-medium text-content-secondary transition-colors hover:text-content-primary",
        className
      )}
      {...props}
    >
      {children ?? "← Volver"}
    </Link>
  );
}
