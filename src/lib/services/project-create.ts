export const PROJECT_NAME_MIN_LENGTH = 2;
export const PROJECT_NAME_MAX_LENGTH = 160;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 2_000;

export type CreateProjectFieldErrors = Partial<
  Record<"name" | "clientId" | "description" | "startDate" | "expectedEndDate", string>
>;

export type CreateProjectInput = {
  name: string;
  clientId: string | null;
  description: string | null;
  startDate: string | null;
  expectedEndDate: string | null;
};

export type CreateProjectValidationResult =
  | { ok: true; input: CreateProjectInput }
  | { ok: false; fieldErrors: CreateProjectFieldErrors };

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateCreateProjectForm(formData: FormData): CreateProjectValidationResult {
  const fieldErrors: CreateProjectFieldErrors = {};
  const name = readText(formData, "name");
  const clientIdValue = readText(formData, "client_id");
  const descriptionValue = readText(formData, "description");
  const startDateValue = readText(formData, "start_date");
  const expectedEndDateValue = readText(formData, "expected_end_date");

  if (name.length < PROJECT_NAME_MIN_LENGTH) {
    fieldErrors.name = `El nombre debe tener al menos ${PROJECT_NAME_MIN_LENGTH} caracteres.`;
  } else if (name.length > PROJECT_NAME_MAX_LENGTH) {
    fieldErrors.name = `El nombre no puede superar ${PROJECT_NAME_MAX_LENGTH} caracteres.`;
  }

  if (clientIdValue && !isUuid(clientIdValue)) {
    fieldErrors.clientId = "Selecciona un cliente válido.";
  }

  if (descriptionValue.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    fieldErrors.description = `La descripción no puede superar ${PROJECT_DESCRIPTION_MAX_LENGTH} caracteres.`;
  }

  if (startDateValue && !isIsoDate(startDateValue)) {
    fieldErrors.startDate = "Introduce una fecha de inicio válida.";
  }

  if (expectedEndDateValue && !isIsoDate(expectedEndDateValue)) {
    fieldErrors.expectedEndDate = "Introduce una fecha fin prevista válida.";
  }

  if (
    !fieldErrors.startDate &&
    !fieldErrors.expectedEndDate &&
    startDateValue &&
    expectedEndDateValue &&
    expectedEndDateValue < startDateValue
  ) {
    fieldErrors.expectedEndDate = "La fecha fin prevista no puede ser anterior al inicio.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return {
    ok: true,
    input: {
      name,
      clientId: clientIdValue || null,
      description: descriptionValue || null,
      startDate: startDateValue || null,
      expectedEndDate: expectedEndDateValue || null,
    },
  };
}
