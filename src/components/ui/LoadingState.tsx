type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = "Cargando",
  description = "Estamos preparando la información para esta vista.",
}: LoadingStateProps) {
  return (
    <div className="rounded-lg border border-dashed bg-bg-surface p-6 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-subtle border-t-primary-300" />
      <h3 className="text-base font-semibold text-content-primary">{title}</h3>
      <p className="mt-2 text-sm text-content-secondary">{description}</p>
    </div>
  );
}
