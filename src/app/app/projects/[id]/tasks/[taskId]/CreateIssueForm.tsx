"use client";

import { useFormStatus } from "react-dom";
import { useState } from "react";

import { ISSUE_DESCRIPTION_MAX_LENGTH } from "@/lib/services/project-task-issues";

import { createTaskIssueAction } from "./actions";

function SubmitIssueButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      {pending ? "Registrando…" : "Registrar"}
    </button>
  );
}

export function CreateIssueForm({
  projectId,
  taskId,
  error,
}: {
  projectId: string;
  taskId: string;
  error?: string;
}) {
  const [description, setDescription] = useState("");

  return (
    <form action={createTaskIssueAction} className="mt-6 space-y-4">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="taskId" value={taskId} />

      {error ? (
        <p
          id="issue-description-error"
          role="alert"
          className="rounded-xl border border-subtle bg-bg-raised px-3 py-2 text-sm text-content-secondary"
        >
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
          value={description}
          onChange={(event) => {
            const nextValue = Array.from(event.target.value)
              .slice(0, ISSUE_DESCRIPTION_MAX_LENGTH)
              .join("");
            setDescription(nextValue);
          }}
          aria-describedby="issue-description-error"
          aria-invalid={Boolean(error)}
          className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          placeholder="Describe el problema…"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-content-tertiary">Solo visible para miembros de la organización.</p>
        <SubmitIssueButton />
      </div>
    </form>
  );
}
