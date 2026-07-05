import { describe, expect, it } from "vitest";

import { computeProjectMargin } from "../../src/lib/services/project-margin";

describe("project-margin", () => {
  it("marks healthy when marginPercent >= 20", () => {
    expect(computeProjectMargin({ budgetTotal: 100, realCostTotal: 60, budgetKind: "accepted" })).toEqual({
      budgetTotal: 100,
      realCostTotal: 60,
      marginAmount: 40,
      marginPercent: 40,
      status: "healthy",
    });
  });

  it("marks risk when marginPercent is between 0 and 20", () => {
    expect(computeProjectMargin({ budgetTotal: 100, realCostTotal: 90, budgetKind: "accepted" })).toEqual({
      budgetTotal: 100,
      realCostTotal: 90,
      marginAmount: 10,
      marginPercent: 10,
      status: "risk",
    });
  });

  it("marks loss when marginAmount < 0", () => {
    expect(computeProjectMargin({ budgetTotal: 100, realCostTotal: 110, budgetKind: "accepted" })).toEqual({
      budgetTotal: 100,
      realCostTotal: 110,
      marginAmount: -10,
      marginPercent: -10,
      status: "loss",
    });
  });

  it("returns unknown when there is no accepted budget", () => {
    expect(computeProjectMargin({ budgetTotal: 100, realCostTotal: 50, budgetKind: "fallback" })).toEqual({
      budgetTotal: 100,
      realCostTotal: 50,
      marginAmount: 50,
      marginPercent: null,
      status: "unknown",
    });
  });

  it("returns unknown when budgetTotal <= 0 even if accepted", () => {
    expect(computeProjectMargin({ budgetTotal: 0, realCostTotal: 10, budgetKind: "accepted" })).toEqual({
      budgetTotal: 0,
      realCostTotal: 10,
      marginAmount: -10,
      marginPercent: null,
      status: "unknown",
    });
  });

  it("handles realCostTotal 0", () => {
    expect(computeProjectMargin({ budgetTotal: 100, realCostTotal: 0, budgetKind: "accepted" })).toEqual({
      budgetTotal: 100,
      realCostTotal: 0,
      marginAmount: 100,
      marginPercent: 100,
      status: "healthy",
    });
  });

  it("rounds marginPercent to 2 decimals", () => {
    expect(computeProjectMargin({ budgetTotal: 3, realCostTotal: 2, budgetKind: "accepted" }).marginPercent).toBe(33.33);
  });

  it("normalizes invalid numeric values to 0", () => {
    expect(computeProjectMargin({ budgetTotal: Number.NaN, realCostTotal: Number.POSITIVE_INFINITY, budgetKind: "accepted" })).toEqual({
      budgetTotal: 0,
      realCostTotal: 0,
      marginAmount: 0,
      marginPercent: null,
      status: "unknown",
    });
  });
});

