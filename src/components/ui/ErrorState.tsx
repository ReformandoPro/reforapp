type ErrorStateProps = {
  title?: string;
  description: string;
};

export function ErrorState({
  title = "No se pudo cargar la vista",
  description,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-[var(--danger-500)] bg-[var(--danger-900)] p-6 text-center">
      <h3 className="text-base font-semibold text-[var(--danger-100)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--danger-100)]/80">{description}</p>
    </div>
  );
}
