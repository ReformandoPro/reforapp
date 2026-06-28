"use client";

import { useTransition } from "react";

import { archiveProject, restoreProject } from "@/app/app/projects/[id]/archive-actions";

export function ArchiveProjectButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => {
        const ok = window.confirm(
          "¿Archivar esta obra? Seguirá existiendo, pero no aparecerá en el listado principal."
        );
        if (!ok) return;
        startTransition(async () => {
          await archiveProject(projectId);
        });
      }}
    >
      {isPending ? "Archivando…" : "Archivar obra"}
    </button>
  );
}

export function RestoreProjectButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-4 py-2 text-sm font-medium text-content-primary hover:bg-bg-raised disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => {
        const ok = window.confirm("¿Restaurar esta obra al listado principal?");
        if (!ok) return;
        startTransition(async () => {
          await restoreProject(projectId);
        });
      }}
    >
      {isPending ? "Restaurando…" : "Restaurar obra"}
    </button>
  );
}

