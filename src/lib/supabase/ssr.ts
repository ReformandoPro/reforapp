import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { getSupabaseConfig } from "@/lib/env";

export async function createServerSupabaseClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase is not configured");
  }

  const cookieStore = await cookies();

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // setAll can be called from a Server Component where cookies are read-only.
          // In that case, we rely on middleware to refresh the session.
        }
      },
    },
  });
}

