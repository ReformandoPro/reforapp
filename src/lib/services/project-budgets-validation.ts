import { BUDGET_STATUSES, type BudgetLineInput, type BudgetStatus } from "./budgets-basic";

export type BudgetValidationResult =
  | {
      ok: true;
      title: string;
      status: BudgetStatus;
      notes: string | null;
      lines: BudgetLineInput[];
    }
  | { ok: false; message: string };

function asNonEmptyString(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

function asFiniteNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function validateBudgetStatus(raw: unknown): BudgetStatus | null {
  const value = asNonEmptyString(raw) ?? "draft";
  return BUDGET_STATUSES.some((s) => s.value === value) ? (value as BudgetStatus) : null;
}

export function validateBudgetLineInput(
  raw: unknown,
  index: number
): { ok: true; line: BudgetLineInput } | { ok: false; message: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: `Línea ${index + 1}: formato inválido.` };
  }

  const candidate = raw as Record<string, unknown>;
  const description = asNonEmptyString(candidate.description);
  if (!description) {
    return { ok: false, message: `Línea ${index + 1}: el concepto es obligatorio.` };
  }

  const quantity = asFiniteNumber(candidate.quantity);
  if (quantity === null || quantity <= 0) {
    return { ok: false, message: `Línea ${index + 1}: la cantidad debe ser > 0.` };
  }

  const unitPrice = asFiniteNumber(candidate.unitPrice);
  if (unitPrice === null || unitPrice < 0) {
    return { ok: false, message: `Línea ${index + 1}: el precio unitario debe ser ≥ 0.` };
  }

  const taxRate = asFiniteNumber(candidate.taxRate);
  if (taxRate === null || taxRate < 0) {
    return { ok: false, message: `Línea ${index + 1}: el IVA debe ser ≥ 0.` };
  }

  const rawSortOrder =
    candidate.sortOrder === null ||
    candidate.sortOrder === undefined ||
    candidate.sortOrder === ""
      ? null
      : asFiniteNumber(candidate.sortOrder);
  const sortOrder = rawSortOrder === null ? index + 1 : rawSortOrder;

  const idValue = candidate.id === undefined || candidate.id === null ? undefined : String(candidate.id);

  return {
    ok: true,
    line: {
      id: idValue,
      description,
      quantity,
      unitPrice,
      taxRate,
      sortOrder,
    },
  };
}

export function validateBudgetLines(raw: unknown): { ok: true; lines: BudgetLineInput[] } | { ok: false; message: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, message: "Debe existir al menos una línea válida." };
  }

  const normalized: BudgetLineInput[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const result = validateBudgetLineInput(raw[index], index);
    if (!result.ok) return result;
    normalized.push(result.line);
  }

  return { ok: true, lines: normalized };
}

export function validateProjectBudgetFormPayload(input: {
  title: unknown;
  status: unknown;
  notes: unknown;
  linesJson: unknown;
}): BudgetValidationResult {
  const title = asNonEmptyString(input.title);
  if (!title) return { ok: false, message: "Título es obligatorio." };

  const status = validateBudgetStatus(input.status);
  if (!status) return { ok: false, message: "Estado inválido." };

  const notesRaw = asNonEmptyString(input.notes);
  const notes = notesRaw ? notesRaw : null;

  const rawLinesJson = asNonEmptyString(input.linesJson);
  if (!rawLinesJson) return { ok: false, message: "Faltan líneas." };

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawLinesJson);
  } catch {
    return { ok: false, message: "Líneas inválidas." };
  }

  const linesResult = validateBudgetLines(parsed);
  if (!linesResult.ok) return linesResult;

  return { ok: true, title, status, notes, lines: linesResult.lines };
}
