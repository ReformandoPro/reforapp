import type { TaskPriority } from "@/lib/domain/tasks/priority";
import type { TaskStatus } from "@/lib/domain/tasks/status";

export type ProjectTaskListItem = {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeName?: string;
  dueDate?: string;
  isDelayed: boolean;
  isBlocked: boolean;
  blockedReason?: string;
  sectionLabel?: string;
};
