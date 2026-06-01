import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 text-[var(--text-primary)] shadow-sm ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}
