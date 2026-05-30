import { describe, expect, it } from "vitest";

import {
  computeActualMargin,
  computeCostPerSquareMeter,
  computeMaxAllowedCost,
  computePricePerSquareMeter,
  computeProfit,
  computeSalePriceFromMargin,
} from "../../src/lib/engine/budget";

describe("budget engine", () => {
  describe("computeSalePriceFromMargin", () => {
    it("calculates sale price from target margin over sale", () => {
      expect(computeSalePriceFromMargin(60000, 0.3)).toBeCloseTo(85714.2857, 4);
    });

    it("returns zero when estimated cost is zero", () => {
      expect(computeSalePriceFromMargin(0, 0.3)).toBe(0);
    });

    it("rejects a margin rate greater than or equal to 1", () => {
      expect(() => computeSalePriceFromMargin(1000, 1)).toThrow(
        "targetMarginRate must be lower than 1"
      );
    });

    it("rejects a negative margin rate", () => {
      expect(() => computeSalePriceFromMargin(1000, -0.01)).toThrow(
        "targetMarginRate cannot be negative"
      );
    });

    it("uses margin over sale instead of margin over cost", () => {
      const estimatedCost = 60000;
      const targetMarginRate = 0.3;

      const correctSalePrice = computeSalePriceFromMargin(
        estimatedCost,
        targetMarginRate
      );
      const incorrectMarginOverCostPrice = estimatedCost * (1 + targetMarginRate);

      expect(correctSalePrice).toBeCloseTo(85714.2857, 4);
      expect(incorrectMarginOverCostPrice).toBe(78000);
      expect(correctSalePrice).toBeGreaterThan(incorrectMarginOverCostPrice);
    });
  });

  describe("computeActualMargin", () => {
    it("calculates actual margin over sale", () => {
      expect(computeActualMargin(100000, 70000)).toBeCloseTo(0.3, 6);
    });

    it("allows a negative actual margin when cost exceeds sale price", () => {
      expect(computeActualMargin(80000, 90000)).toBeCloseTo(-0.125, 6);
    });

    it("rejects a sale price equal to zero", () => {
      expect(() => computeActualMargin(0, 1000)).toThrow(
        "salePrice must be greater than 0"
      );
    });
  });

  describe("computeProfit", () => {
    it("calculates profit", () => {
      expect(computeProfit(100000, 70000)).toBe(30000);
    });

    it("returns negative profit when cost is higher than sale price", () => {
      expect(computeProfit(70000, 90000)).toBe(-20000);
    });
  });

  describe("computePricePerSquareMeter", () => {
    it("calculates price per square meter", () => {
      expect(computePricePerSquareMeter(90000, 100)).toBe(900);
    });

    it("rejects zero square meters", () => {
      expect(() => computePricePerSquareMeter(90000, 0)).toThrow(
        "surfaceSquareMeters must be greater than 0"
      );
    });

    it("rejects negative square meters", () => {
      expect(() => computePricePerSquareMeter(90000, -2)).toThrow(
        "surfaceSquareMeters must be greater than 0"
      );
    });
  });

  describe("computeCostPerSquareMeter", () => {
    it("calculates cost per square meter", () => {
      expect(computeCostPerSquareMeter(60000, 100)).toBe(600);
    });

    it("rejects zero square meters", () => {
      expect(() => computeCostPerSquareMeter(60000, 0)).toThrow(
        "surfaceSquareMeters must be greater than 0"
      );
    });

    it("rejects negative square meters", () => {
      expect(() => computeCostPerSquareMeter(60000, -2)).toThrow(
        "surfaceSquareMeters must be greater than 0"
      );
    });
  });

  describe("computeMaxAllowedCost", () => {
    it("calculates max allowed cost from sale price and target margin", () => {
      expect(computeMaxAllowedCost(100000, 0.3)).toBe(70000);
    });

    it("supports zero margin as a valid boundary", () => {
      expect(computeMaxAllowedCost(100000, 0)).toBe(100000);
    });

    it("rejects a margin rate greater than or equal to 1", () => {
      expect(() => computeMaxAllowedCost(1000, 1)).toThrow(
        "targetMarginRate must be lower than 1"
      );
    });

    it("rejects a negative margin rate", () => {
      expect(() => computeMaxAllowedCost(1000, -0.01)).toThrow(
        "targetMarginRate cannot be negative"
      );
    });
  });
});
