"use client";

import { useMemo, useState } from "react";

import { deleteTaskCommentAction, updateTaskCommentAction } from "./actions";

export type TaskCommentListItem = {
  id: string;
  authorLabel: string;
  authorUserId: string;
  createdAtLabel: string;
  body: string;
  canManage: boolean;
};

type TaskCommentsClientProps = {
  projectId: string;
  taskId: string;
  comments: TaskCommentListItem[];
};

export function TaskCommentsClient({ projectId, taskId, comments }: TaskCommentsClientProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const initialBodyById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of comments) map.set(c.id, c.body);
    return map;
  }, [comments]);

  return (
    <div className="mt-4 grid gap-3">
      {comments.map((comment) => {
        const isEditing = editingId === comment.id;

        return (
          <div
            key={comment.id}
            className="rounded-xl border border-subtle bg-bg-raised px-4 py-3"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-content-primary">
                  {comment.authorLabel}
                </p>
                <p className="mt-0.5 text-xs text-content-tertiary">
                  {comment.createdAtLabel}
                </p>
              </div>

              {comment.canManage ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-content-primary hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    onClick={() => {
                      setEditingId((prev) => (prev === comment.id ? null : comment.id));
                    }}
                  >
                    {isEditing ? "Cancelar" : "Editar"}
                  </button>

                  <form
                    action={deleteTaskCommentAction}
                    onSubmit={(event) => {
                      if (!confirm("¿Eliminar este comentario?")) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="projectId" value={projectId} />
                    <input type="hidden" name="taskId" value={taskId} />
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-9 items-center justify-center rounded-xl border border-subtle bg-bg-surface px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              ) : null}
            </div>

            {isEditing ? (
              <form action={updateTaskCommentAction} className="mt-3 space-y-3">
                <input type="hidden" name="projectId" value={projectId} />
                <input type="hidden" name="taskId" value={taskId} />
                <input type="hidden" name="commentId" value={comment.id} />

                <textarea
                  name="body"
                  rows={4}
                  required
                  defaultValue={initialBodyById.get(comment.id) ?? comment.body}
                  className="w-full rounded-xl border border-subtle bg-bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-500 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    Guardar
                  </button>
                </div>
              </form>
            ) : (
              <p className="mt-2 whitespace-pre-wrap text-sm text-content-primary">
                {comment.body}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
