"use client";

export default function ProjectsError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="rounded-xl border border-subtle bg-bg-surface p-6">
        <h1 className="text-2xl font-semibold">No pudimos cargar las obras</h1>
        <p className="mt-2 text-sm text-content-secondary">
          Revisa la conexión e inténtalo de nuevo.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 rounded-xl bg-primary-500 px-4 py-2 text-sm font-medium text-white"
        >
          Reintentar
        </button>
      </div>
    </section>
  );
}
