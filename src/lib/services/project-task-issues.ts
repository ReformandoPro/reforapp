import type { MembershipRole } from "./org-context";
import { canWriteProjectTasks } from "./project-operational-permissions";

export const ISSUE_DESCRIPTION_MAX_LENGTH = 2000;

// B16 contract: only these Unicode code points are trimmed at the edges.
const ISSUE_EDGE_WHITESPACE =
  /^[\u0009-\u000D\u0020\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+|[\u0009-\u000D\u0020\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]+$/gu;

export function trimIssueWhitespace(value: string): string {
  return value.replace(ISSUE_EDGE_WHITESPACE, "");
}

export type IssueDescriptionValidation =
  | { ok: true; value: string }
  | { ok: false; message: string };

export function validateIssueDescription(value: unknown): IssueDescriptionValidation {
  if (typeof value !== "string") {
    return { ok: false, message: "La incidencia tiene un formato inválido." };
  }

  const normalized = trimIssueWhitespace(value);

  if (!normalized) {
    return { ok: false, message: "Incidencia es obligatorio." };
  }

  if (Array.from(normalized).length > ISSUE_DESCRIPTION_MAX_LENGTH) {
    return {
      ok: false,
      message: `La incidencia no puede superar los ${ISSUE_DESCRIPTION_MAX_LENGTH} caracteres.`,
    };
  }

  return { ok: true, value: normalized };
}

export function canCreateTaskIssue(role: MembershipRole): boolean {
  return canWriteProjectTasks(role);
}

export function isTaskIssueContextValid(params: {
  organizationId: string;
  projectId: string;
  taskId: string;
  task: { id: string; organization_id: string; project_id: string } | null;
}): boolean {
  const { organizationId, projectId, taskId, task } = params;

  return Boolean(
    task &&
      task.id === taskId &&
      task.organization_id === organizationId &&
      task.project_id === projectId
  );
}

export function buildTaskIssuePayload(params: {
  organizationId: string;
  projectId: string;
  taskId: string;
  reporterUserId: string;
  description: string;
}) {
  return {
    organization_id: params.organizationId,
    project_id: params.projectId,
    task_id: params.taskId,
    reporter_user_id: params.reporterUserId,
    description: params.description,
  };
}

export function sanitizeTaskIssueInsertError(error: unknown): {
  code: string;
  message: string;
} {
  const candidate = error as { code?: unknown; message?: unknown } | null;
  const code = typeof candidate?.code === "string" ? candidate.code.slice(0, 80) : "unknown";
  const rawMessage = typeof candidate?.message === "string" ? candidate.message : "unknown";
  const message = rawMessage
    .replace(/bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/(token|secret|cookie|authorization)=\S+/gi, "$1=[redacted]")
    .replace(/\s+/g, " ")
    .slice(0, 240);

  return { code, message };
}
