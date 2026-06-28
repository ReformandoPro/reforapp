import { createServerSupabaseClient } from "@/lib/supabase/ssr";

export type DocumentCategory =
  | "general"
  | "budget"
  | "invoice"
  | "photo"
  | "license"
  | "plan"
  | "report";

export const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "budget", label: "Presupuesto" },
  { value: "invoice", label: "Factura" },
  { value: "photo", label: "Foto" },
  { value: "license", label: "Licencia" },
  { value: "plan", label: "Plano" },
  { value: "report", label: "Parte / informe" },
];

export function safeFilename(input: string): string {
  // Very small sanitizer: keep letters/numbers/.-_ and replace others with '-'.
  const trimmed = input.trim() || "document";
  const safe = trimmed
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return safe.length > 0 ? safe.slice(0, 120) : "document";
}

export async function createSignedDocumentUrl(params: {
  bucket: string;
  filePath: string;
  expiresInSeconds?: number;
}): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.storage
    .from(params.bucket)
    .createSignedUrl(params.filePath, params.expiresInSeconds ?? 300);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
