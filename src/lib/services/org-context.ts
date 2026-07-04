import type { User } from "@supabase/supabase-js";

import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export type MembershipRole = "owner" | "admin" | "member";

type MembershipRow = {
  organization_id: string;
  role: MembershipRole;
};

export type OrganizationContextResult =
  | {
      ok: true;
      user: User;
      organizationId: string;
      role: MembershipRole;
    }
  | {
      ok: false;
      reason: "not_authenticated" | "missing_membership" | "query_failed";
    };

function pickPrimaryMembership(rows: MembershipRow[]): MembershipRow | null {
  const rank: Record<MembershipRole, number> = { owner: 0, admin: 1, member: 2 };
  return (
    rows
      .slice()
      .sort((a, b) => {
        const roleDiff = rank[a.role] - rank[b.role];
        if (roleDiff !== 0) return roleDiff;

        return a.organization_id.localeCompare(b.organization_id);
      })[0] ??
    null
  );
}

export async function getOrganizationContextForRequest(): Promise<OrganizationContextResult> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, reason: "not_authenticated" };
  }

  const { data, error } = await supabase
    .from("memberships")
    .select("organization_id, role")
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, reason: "query_failed" };
  }

  const rows = (data ?? []) as MembershipRow[];
  const primary = pickPrimaryMembership(rows);

  if (!primary) {
    return { ok: false, reason: "missing_membership" };
  }

  return {
    ok: true,
    user,
    organizationId: primary.organization_id,
    role: primary.role,
  };
}

