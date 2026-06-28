import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export type OrgMember = {
  label: string;
  userId: string;
  role: "owner" | "admin" | "member";
};

type MembershipRow = {
  user_id: string;
  role: "owner" | "admin" | "member";
};

export async function listOrganizationMembers(organizationId: string): Promise<OrgMember[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("user_id, role")
    .eq("organization_id", organizationId)
    .order("role", { ascending: true });

  if (error) {
    return [];
  }

  const rows = (data ?? []) as MembershipRow[];

  return rows.map((row) => {
    const userId = String(row.user_id);
    return {
      userId,
      role: row.role,
      label: userId,
    };
  });
}
