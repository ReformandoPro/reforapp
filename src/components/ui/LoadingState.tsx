type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = "Cargando",
  description = "Estamos preparando la información para esta vista.",
}: LoadingStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--border-default)] bg-[var(--bg-surface)] p-6 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[var(--border-default)] border-t-[var(--primary-300)]" />
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{description}</p>
    </div>
  );
}
