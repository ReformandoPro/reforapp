import type { CreateProjectFieldErrors } from "@/lib/services/project-create";

export type CreateProjectActionState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: CreateProjectFieldErrors;
};

export const INITIAL_CREATE_PROJECT_STATE: CreateProjectActionState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};
