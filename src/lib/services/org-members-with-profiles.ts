import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export type OrgMemberWithProfile = {
  userId: string;
  role: "owner" | "admin" | "member";
  joinedAt: string | null;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  label: string;
};

type MembershipRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
  created_at: string | null;
};

type ProfileRow = {
  user_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
};

function buildLabel(profile: ProfileRow | undefined, userId: string): string {
  const displayName = profile?.display_name?.trim();
  if (displayName) return displayName;

  const email = profile?.email?.trim();
  if (email) return email;

  return userId;
}

export async function getOrgMembersWithProfiles(
  organizationId: string
): Promise<OrgMemberWithProfile[]> {
  const supabase = await createServerSupabaseClient();

  const { data: memberships, error: membershipsError } = await supabase
    .from("memberships")
    .select("user_id, role, created_at")
    .eq("organization_id", organizationId);

  if (membershipsError) return [];

  const memberRows = (memberships ?? []) as MembershipRow[];
  const userIds = memberRows.map((m) => m.user_id);

  if (userIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, display_name, email, phone")
    .in("user_id", userIds);

  if (profilesError) return [];

  const profileRows = (profiles ?? []) as ProfileRow[];
  const byUserId = new Map(profileRows.map((p) => [p.user_id, p] as const));

  return memberRows
    .map((m) => {
      const profile = byUserId.get(m.user_id);
      const displayName = profile?.display_name?.trim() || null;
      const email = profile?.email ?? null;
      const phone = profile?.phone ?? null;

      return {
        userId: m.user_id,
        role: m.role,
        joinedAt: m.created_at ?? null,
        displayName,
        email,
        phone,
        label: buildLabel(profile, m.user_id),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "es"));
}
