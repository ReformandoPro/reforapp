type ErrorStateProps = {
  title?: string;
  description: string;
};

export function ErrorState({
  title = "No se pudo cargar la vista",
  description,
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
      <h3 className="text-base font-semibold text-rose-800">{title}</h3>
      <p className="mt-2 text-sm text-rose-700">{description}</p>
    </div>
  );
}
