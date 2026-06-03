export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : undefined;
}

export function getSupabaseConfig(): SupabasePublicConfig | null {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey) {
    return null;
  }

  return {
    url,
    anonKey,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
