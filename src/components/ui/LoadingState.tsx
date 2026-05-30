type LoadingStateProps = {
  title?: string;
  description?: string;
};

export function LoadingState({
  title = "Cargando",
  description = "Estamos preparando la información para esta vista.",
}: LoadingStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
      <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
