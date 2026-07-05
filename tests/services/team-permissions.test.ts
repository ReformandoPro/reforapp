import { describe, expect, it } from "vitest";

import { canChangeMemberRole, canViewTeam } from "../../src/lib/services/team-permissions";

describe("team-permissions", () => {
  it("canViewTeam is restricted to owner/admin", () => {
    expect(canViewTeam("owner")).toBe(true);
    expect(canViewTeam("admin")).toBe(true);
    expect(canViewTeam("member")).toBe(false);
  });

  it("prevents non-admin roles from managing the team", () => {
    expect(
      canChangeMemberRole({
        actorRole: "member",
        actorUserId: "u1",
        targetUserId: "u2",
        targetCurrentRole: "member",
        nextRole: "member",
      })
    ).toEqual({ ok: false, message: "No tienes permisos para gestionar el equipo." });
  });

  it("prevents changing your own role", () => {
    const result = canChangeMemberRole({
      actorRole: "owner",
      actorUserId: "u1",
      targetUserId: "u1",
      targetCurrentRole: "member",
      nextRole: "admin",
    });

    expect(result.ok).toBe(false);
  });

  it("prevents modifying owner role in MVP", () => {
    expect(
      canChangeMemberRole({
        actorRole: "owner",
        actorUserId: "u1",
        targetUserId: "u2",
        targetCurrentRole: "owner",
        nextRole: "member",
      }).ok
    ).toBe(false);

    expect(
      canChangeMemberRole({
        actorRole: "owner",
        actorUserId: "u1",
        targetUserId: "u2",
        targetCurrentRole: "member",
        nextRole: "owner",
      }).ok
    ).toBe(false);
  });

  it("allows owner to change member/admin roles (except owner)", () => {
    expect(
      canChangeMemberRole({
        actorRole: "owner",
        actorUserId: "u1",
        targetUserId: "u2",
        targetCurrentRole: "member",
        nextRole: "admin",
      })
    ).toEqual({ ok: true });
  });

  it("restricts admin role changes to demoting members to member", () => {
    expect(
      canChangeMemberRole({
        actorRole: "admin",
        actorUserId: "u1",
        targetUserId: "u2",
        targetCurrentRole: "member",
        nextRole: "admin",
      }).ok
    ).toBe(false);

    expect(
      canChangeMemberRole({
        actorRole: "admin",
        actorUserId: "u1",
        targetUserId: "u2",
        targetCurrentRole: "admin",
        nextRole: "member",
      }).ok
    ).toBe(false);

    expect(
      canChangeMemberRole({
        actorRole: "admin",
        actorUserId: "u1",
        targetUserId: "u2",
        targetCurrentRole: "member",
        nextRole: "member",
      })
    ).toEqual({ ok: true });
  });
});

