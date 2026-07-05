import type { MembershipRole } from "@/lib/services/org-context";

export type InvitationRole = "admin" | "member";

export function isMembershipRole(value: string): value is MembershipRole {
  return value === "owner" || value === "admin" || value === "member";
}

export function isInvitationRole(value: string): value is InvitationRole {
  return value === "admin" || value === "member";
}

export function canViewTeam(role: MembershipRole): boolean {
  return role === "owner" || role === "admin";
}

export function canChangeMemberRole(params: {
  actorRole: MembershipRole;
  actorUserId: string;
  targetUserId: string;
  targetCurrentRole: MembershipRole;
  nextRole: MembershipRole;
}): { ok: true } | { ok: false; message: string } {
  const { actorRole, actorUserId, targetUserId, targetCurrentRole, nextRole } = params;

  if (actorRole !== "owner" && actorRole !== "admin") {
    return { ok: false, message: "No tienes permisos para gestionar el equipo." };
  }

  if (actorUserId === targetUserId) {
    return { ok: false, message: "No puedes cambiar tu propio rol." };
  }

  if (targetCurrentRole === "owner" || nextRole === "owner") {
    return { ok: false, message: "No se puede modificar el rol owner desde el MVP." };
  }

  if (actorRole === "admin") {
    if (nextRole !== "member") {
      return { ok: false, message: "Un admin solo puede asignar el rol member." };
    }

    if (targetCurrentRole !== "member") {
      return { ok: false, message: "Un admin no puede modificar a otros admins." };
    }
  }

  return { ok: true };
}

