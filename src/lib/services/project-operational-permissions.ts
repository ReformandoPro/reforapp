import type { MembershipRole } from "./org-context";

export function canWriteProjectPhases(role: MembershipRole): boolean {
  return role === "owner" || role === "admin";
}

export function canWriteProjectTasks(role: MembershipRole): boolean {
  return role === "owner" || role === "admin";
}
