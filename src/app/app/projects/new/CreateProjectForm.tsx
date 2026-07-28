"use client";

import { useActionState } from "react";

import {
  createProjectAction,
  INITIAL_CREATE_PROJECT_STATE,
  type CreateProjectActionState,
} from "@/app/app/projects/new/actions";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  PROJECT_NAME_MIN_LENGTH,
} from "@/lib/services/project-create";

type ClientOption = {
  id: string;
  displayName: string;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} role="alert" className="text-sm text-danger-100">{message}</p>;
}

export function CreateProjectFields({
  clients,
  pending,
  state,
}: {
  clients: ClientOption[];
  pending: boolean;
  state: CreateProjectActionState;
}) {
  return (
    <>
      {state.message ? (
        <p role="alert" className="rounded-xl border border-danger-500/20 bg-danger-500/10 px-3 py-2 text-sm text-danger-100">
          {state.message}
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="project-name">Nombre</label>
        <input
          id="project-name"
          name="name"
          required
          minLength={PROJECT_NAME_MIN_LENGTH}
          maxLength={PROJECT_NAME_MAX_LENGTH}
          aria-invalid={Boolean(state.fieldErrors.name)}
          aria-describedby={state.fieldErrors.name ? "project-name-error" : undefined}
          className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <FieldError id="project-name-error" message={state.fieldErrors.name} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="project-client">Cliente <span className="text-content-tertiary">(opcional)</span></label>
        <select
          id="project-client"
          name="client_id"
          defaultValue=""
          aria-invalid={Boolean(state.fieldErrors.clientId)}
          aria-describedby={state.fieldErrors.clientId ? "project-client-error" : undefined}
          className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          <option value="">Sin cliente asignado</option>
          {clients.map((client) => <option key={client.id} value={client.id}>{client.displayName}</option>)}
        </select>
        <FieldError id="project-client-error" message={state.fieldErrors.clientId} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="project-description">Descripción <span className="text-content-tertiary">(opcional)</span></label>
        <textarea
          id="project-description"
          name="description"
          rows={4}
          maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
          aria-invalid={Boolean(state.fieldErrors.description)}
          aria-describedby={state.fieldErrors.description ? "project-description-error" : undefined}
          className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
        <FieldError id="project-description-error" message={state.fieldErrors.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="project-start-date">Fecha inicio <span className="text-content-tertiary">(opcional)</span></label>
          <input
            id="project-start-date"
            name="start_date"
            type="date"
            aria-invalid={Boolean(state.fieldErrors.startDate)}
            aria-describedby={state.fieldErrors.startDate ? "project-start-date-error" : undefined}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <FieldError id="project-start-date-error" message={state.fieldErrors.startDate} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="project-end-date">Fecha fin prevista <span className="text-content-tertiary">(opcional)</span></label>
          <input
            id="project-end-date"
            name="expected_end_date"
            type="date"
            aria-invalid={Boolean(state.fieldErrors.expectedEndDate)}
            aria-describedby={state.fieldErrors.expectedEndDate ? "project-end-date-error" : undefined}
            className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          <FieldError id="project-end-date-error" message={state.fieldErrors.expectedEndDate} />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creando obra…" : "Crear obra"}
        </button>
      </div>
    </>
  );
}

export function CreateProjectForm({ clients }: { clients: ClientOption[] }) {
  const [state, action, pending] = useActionState(
    createProjectAction,
    INITIAL_CREATE_PROJECT_STATE
  );

  return (
    <form action={action} className="mt-6 space-y-5">
      <CreateProjectFields clients={clients} pending={pending} state={state} />
    </form>
  );
}
