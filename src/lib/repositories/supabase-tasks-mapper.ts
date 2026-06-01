import { isTaskStatus, type TaskStatus } from "@/lib/domain/tasks/status";
import type { ProjectTaskListItem } from "@/lib/types";

type MapSupabaseTaskRowOptions = {
  /**
   * Used to deterministically compute derived flags (e.g. isDelayed) in tests.
   * Defaults to `new Date()`.
   */
  now?: Date;
};

/**
 * Internal row shape expected by the future SupabaseTasksRepository.
 *
 * This type is repository-internal and must not leak to UI.
 */
export type SupabaseTaskRow = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: ProjectTaskListItem["priority"];
  assignee_name: string | null;
  due_date: string | null; // ISO date (YYYY-MM-DD)
  blocked_reason: string | null;
  section_label: string | null;
};

function normalizeDateInput(date: Date): Date {
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function isIsoDateBefore(isoDate: string, now: Date): boolean {
  // Lexicographical compare works for YYYY-MM-DD.
  const todayIso = now.toISOString().slice(0, 10);
  return isoDate < todayIso;
}

function deriveIsBlocked(status: TaskStatus, blockedReason?: string): boolean {
  return status === "blocked" || Boolean(blockedReason);
}

function deriveIsDelayed(
  status: TaskStatus,
  dueDate?: string,
  now: Date = new Date()
): boolean {
  if (!dueDate) return false;
  if (status === "done" || status === "cancelled") return false;

  return isIsoDateBefore(dueDate, now);
}

/**
 * Maps a Supabase `tasks` row into the stable `ProjectTaskListItem` UI contract.
 */
export function mapSupabaseTaskRowToProjectTaskListItem(
  row: SupabaseTaskRow,
  options?: MapSupabaseTaskRowOptions
): ProjectTaskListItem {
  if (!isTaskStatus(row.status)) {
    throw new Error(`Invalid task status: ${row.status}`);
  }

  const status: TaskStatus = row.status;
  const now = normalizeDateInput(options?.now ?? new Date());
  const blockedReason = row.blocked_reason ?? undefined;
  const dueDate = row.due_date ?? undefined;

  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status,
    priority: row.priority,
    assigneeName: row.assignee_name ?? undefined,
    dueDate,
    isBlocked: deriveIsBlocked(status, blockedReason),
    isDelayed: deriveIsDelayed(status, dueDate, now),
    blockedReason,
    sectionLabel: row.section_label ?? undefined,
  };
}
