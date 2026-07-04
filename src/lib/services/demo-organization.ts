import { mockOrganization } from "@/lib/mock/reformando";
import type { Organization } from "@/lib/types/reformando";

export async function getDemoOrganization(): Promise<Organization> {
  // TODO: replace mock adapter with Supabase organization context when staging is ready.
  return mockOrganization;
}
