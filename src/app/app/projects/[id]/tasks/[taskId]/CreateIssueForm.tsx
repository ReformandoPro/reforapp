import { createTaskIssueAction } from "./actions";

export function CreateIssueForm({
  projectId,
  taskId,
  error,
}: {
  projectId: string;
  taskId: string;
  error?: string;
}) {
  return (
    <form action={createTaskIssueAction} className="mt-6 space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />

      {error ? (
        <p className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary">
          {error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="description">
          Añadir incidencia
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          required
          className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          placeholder="Describe el problema…"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-content-tertiary">Solo visible para miembros de la organización.</p>
        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Registrar
        </button>
      </div>
    </form>
  );
}

