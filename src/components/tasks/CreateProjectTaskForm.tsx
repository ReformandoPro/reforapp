"use client";

import { useActionState, useEffect, useRef } from "react";

import { createProjectTaskAction } from "@/app/projects/[id]/actions";
import {
  INITIAL_CREATE_PROJECT_TASK_STATE,
  type CreateProjectTaskActionState,
} from "@/app/projects/[id]/state";
import type { ProjectPhase } from "@/lib/data/projects";
import {
  PROJECT_TASK_DESCRIPTION_MAX_LENGTH,
  PROJECT_TASK_TITLE_MAX_LENGTH,
  PROJECT_TASK_TITLE_MIN_LENGTH,
} from "@/lib/services/project-task-create";

type CreateProjectTaskFormProps = {
  projectId: string;
  phases: ProjectPhase[];
};

type CreateProjectTaskFieldsProps = {
  state: CreateProjectTaskActionState;
  phases: ProjectPhase[];
  pending: boolean;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="text-sm text-danger-100">
      {message}
    </p>
  );
}

export function CreateProjectTaskFields({
  state,
  phases,
  pending,
}: CreateProjectTaskFieldsProps) {
  const errors = state.fieldErrors;

  return (
    <>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900" htmlFor="task-title">
          Título
        </label>
        <input
          id="task-title"
          name="title"
          required
          minLength={PROJECT_TASK_TITLE_MIN_LENGTH}
          maxLength={PROJECT_TASK_TITLE_MAX_LENGTH}
          disabled={pending}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "task-title-error" : undefined}
          className={`w-full rounded-xl border bg-bg-surface px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${errors.title ? "border-danger-500/70" : "border-subtle"}`}
          placeholder="Ej. Revisar mediciones"
        />
        <FieldError id="task-title-error" message={errors.title} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900" htmlFor="task-description">
          Descripción <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={3}
          maxLength={PROJECT_TASK_DESCRIPTION_MAX_LENGTH}
          disabled={pending}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "task-description-error" : undefined}
          className={`w-full rounded-xl border bg-bg-surface px-3 py-2 text-sm text-content-primary placeholder:text-content-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${errors.description ? "border-danger-500/70" : "border-subtle"}`}
          placeholder="Añade contexto para el equipo (opcional)"
        />
        <FieldError id="task-description-error" message={errors.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-900" htmlFor="task-phase">
            Fase <span className="font-normal text-slate-500">(opcional)</span>
          </label>
          <select
            id="task-phase"
            name="phase_id"
            defaultValue=""
            disabled={pending}
            aria-invalid={Boolean(errors.phaseId)}
            aria-describedby={errors.phaseId ? "task-phase-error" : undefined}
            className={`w-full rounded-xl border bg-bg-surface px-3 py-2 text-sm text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${errors.phaseId ? "border-danger-500/70" : "border-subtle"}`}
          >
            <option value="">Sin fase</option>
            {phases.map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.title}
              </option>
            ))}
          </select>
          <FieldError id="task-phase-error" message={errors.phaseId} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-900" htmlFor="task-priority">
            Prioridad
          </label>
          <select
            id="task-priority"
            name="priority"
            defaultValue="medium"
            required
            disabled={pending}
            aria-invalid={Boolean(errors.priority)}
            aria-describedby={errors.priority ? "task-priority-error" : undefined}
            className={`w-full rounded-xl border bg-bg-surface px-3 py-2 text-sm text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${errors.priority ? "border-danger-500/70" : "border-subtle"}`}
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
          <FieldError id="task-priority-error" message={errors.priority} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-900" htmlFor="task-due-date">
          Fecha límite <span className="font-normal text-slate-500">(opcional)</span>
        </label>
        <input
          id="task-due-date"
          name="due_date"
          type="date"
          disabled={pending}
          aria-invalid={Boolean(errors.dueDate)}
          aria-describedby={errors.dueDate ? "task-due-date-error" : undefined}
          className={`w-full rounded-xl border bg-bg-surface px-3 py-2 text-sm text-content-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${errors.dueDate ? "border-danger-500/70" : "border-subtle"}`}
        />
        <FieldError id="task-due-date-error" message={errors.dueDate} />
      </div>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={state.status === "error" ? "text-sm text-danger-100" : "text-sm text-emerald-700"}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">La tarea se creará con estado Pendiente.</p>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creando…" : "Crear tarea"}
        </button>
      </div>
    </>
  );
}

export function CreateProjectTaskForm({ projectId, phases }: CreateProjectTaskFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const createForProject = createProjectTaskAction.bind(null, projectId);
  const [state, formAction, pending] = useActionState(
    createForProject,
    INITIAL_CREATE_PROJECT_TASK_STATE
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state.status]);

  return (
    <details className="rounded-xl border border-subtle bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
        Nueva tarea
      </summary>
      <form ref={formRef} action={formAction} className="mt-4 space-y-4">
        <CreateProjectTaskFields state={state} phases={phases} pending={pending} />
      </form>
    </details>
  );
}
