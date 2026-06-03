import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfig } from "@/lib/env";

export function createOptionalSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createClient(config.url, config.anonKey);
}

export function isSupabaseClientAvailable(): boolean {
  return createOptionalSupabaseClient() !== null;
}
