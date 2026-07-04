import type { SupabaseClient } from "@supabase/supabase-js";

import type { Organization } from "@/lib/types/reformando";

type OrganizationRow = {
  id: string;
  name: string;
  slug: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type OrganizationReadResult =
  | { ok: true; organization: Organization }
  | { ok: false; reason: "not_found" | "query_failed" };

function mapOrganizationRow(row: OrganizationRow): Organization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrganizationById(
  supabase: SupabaseClient,
  organizationId: string
): Promise<OrganizationReadResult> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, created_at, updated_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    return { ok: false, reason: "query_failed" };
  }

  if (!data) {
    return { ok: false, reason: "not_found" };
  }

  return { ok: true, organization: mapOrganizationRow(data as OrganizationRow) };
}
