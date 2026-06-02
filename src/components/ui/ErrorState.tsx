type ErrorStateProps = {
  title?: string;
  description: string;
};

export function ErrorState({
  title = "No se pudo cargar la vista",
  description,
}: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-danger-500 bg-danger-900 p-6 text-center">
      <h3 className="text-base font-semibold text-danger-100">{title}</h3>
      <p className="mt-2 text-sm text-danger-100/80">{description}</p>
    </div>
  );
}
