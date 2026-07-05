import { describe, expect, it } from "vitest";

import {
  validateBudgetLineInput,
  validateBudgetLines,
  validateBudgetStatus,
  validateProjectBudgetFormPayload,
} from "../../src/lib/services/project-budgets-validation";

describe("project-budgets-validation", () => {
  it("accepts a valid line", () => {
    const result = validateBudgetLineInput(
      { description: "Alicatado", quantity: 2, unitPrice: 10, taxRate: 21, sortOrder: 1 },
      0
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.line).toEqual({
        id: undefined,
        description: "Alicatado",
        quantity: 2,
        unitPrice: 10,
        taxRate: 21,
        sortOrder: 1,
      });
    }
  });

  it("rejects a line without description", () => {
    const result = validateBudgetLineInput(
      { description: "   ", quantity: 1, unitPrice: 0, taxRate: 21, sortOrder: 1 },
      0
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("concepto");
    }
  });

  it("rejects quantity 0 or negative", () => {
    expect(
      validateBudgetLineInput(
        { description: "X", quantity: 0, unitPrice: 0, taxRate: 0, sortOrder: 1 },
        0
      ).ok
    ).toBe(false);

    expect(
      validateBudgetLineInput(
        { description: "X", quantity: -1, unitPrice: 0, taxRate: 0, sortOrder: 1 },
        0
      ).ok
    ).toBe(false);
  });

  it("rejects negative unitPrice", () => {
    const result = validateBudgetLineInput(
      { description: "X", quantity: 1, unitPrice: -0.01, taxRate: 0, sortOrder: 1 },
      0
    );

    expect(result.ok).toBe(false);
  });

  it("rejects negative taxRate", () => {
    const result = validateBudgetLineInput(
      { description: "X", quantity: 1, unitPrice: 0, taxRate: -1, sortOrder: 1 },
      0
    );

    expect(result.ok).toBe(false);
  });

  it("rejects non-numeric values", () => {
    expect(
      validateBudgetLineInput(
        { description: "X", quantity: "nope", unitPrice: 0, taxRate: 0, sortOrder: 1 },
        0
      ).ok
    ).toBe(false);

    expect(
      validateBudgetLineInput(
        { description: "X", quantity: 1, unitPrice: "nope", taxRate: 0, sortOrder: 1 },
        0
      ).ok
    ).toBe(false);

    expect(
      validateBudgetLineInput(
        { description: "X", quantity: 1, unitPrice: 0, taxRate: "nope", sortOrder: 1 },
        0
      ).ok
    ).toBe(false);
  });

  it("rejects empty lists", () => {
    const result = validateBudgetLines([]);
    expect(result.ok).toBe(false);
  });

  it("normalizes sortOrder to index+1 when missing", () => {
    const result = validateBudgetLines([
      { description: "A", quantity: 1, unitPrice: 0, taxRate: 0 },
      { description: "B", quantity: 1, unitPrice: 0, taxRate: 0, sortOrder: null },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lines[0]?.sortOrder).toBe(1);
      expect(result.lines[1]?.sortOrder).toBe(2);
    }
  });

  it("validates status against BUDGET_STATUSES", () => {
    expect(validateBudgetStatus("draft")).toBe("draft");
    expect(validateBudgetStatus("")).toBe("draft");
    expect(validateBudgetStatus("nope")).toBeNull();
  });

  it("validates full payload and returns normalized values", () => {
    const result = validateProjectBudgetFormPayload({
      title: "Presupuesto",
      status: "sent",
      notes: "  nota  ",
      linesJson: JSON.stringify([{ description: "X", quantity: "2", unitPrice: "10", taxRate: "21" }]),
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.title).toBe("Presupuesto");
      expect(result.status).toBe("sent");
      expect(result.notes).toBe("nota");
      expect(result.lines).toEqual([
        {
          id: undefined,
          description: "X",
          quantity: 2,
          unitPrice: 10,
          taxRate: 21,
          sortOrder: 1,
        },
      ]);
    }
  });
});

