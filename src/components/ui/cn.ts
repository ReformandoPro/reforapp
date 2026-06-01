type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean>
  | ClassValue[];

function flatten(input: ClassValue, acc: string[]) {
  if (!input) return;

  if (typeof input === "string" || typeof input === "number") {
    acc.push(String(input));
    return;
  }

  if (Array.isArray(input)) {
    for (const value of input) {
      flatten(value, acc);
    }
    return;
  }

  if (typeof input === "object") {
    for (const [key, enabled] of Object.entries(input)) {
      if (enabled) acc.push(key);
    }
  }
}

/**
 * Minimal `cn` helper (no external deps).
 *
 * Compatible with typical className patterns from external component libraries.
 */
export function cn(...values: ClassValue[]): string {
  const acc: string[] = [];
  for (const value of values) {
    flatten(value, acc);
  }
  return acc.join(" ").trim();
}
