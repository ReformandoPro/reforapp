import type { CreateProjectTaskFieldErrors } from "@/lib/services/project-task-create";

export type CreateProjectTaskActionState = {
  status: "idle" | "error" | "success";
  message: string | null;
  fieldErrors: CreateProjectTaskFieldErrors;
};

export const INITIAL_CREATE_PROJECT_TASK_STATE: CreateProjectTaskActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
