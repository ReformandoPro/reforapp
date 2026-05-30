export function computeSalePriceFromMargin(
  estimatedCost: number,
  targetMarginRate: number
): number {
  if (targetMarginRate >= 1) {
    throw new Error("targetMarginRate must be lower than 1");
  }

  if (targetMarginRate < 0) {
    throw new Error("targetMarginRate cannot be negative");
  }

  return estimatedCost / (1 - targetMarginRate);
}

export function computeActualMargin(
  salePrice: number,
  estimatedCost: number
): number {
  if (salePrice <= 0) {
    throw new Error("salePrice must be greater than 0");
  }

  return (salePrice - estimatedCost) / salePrice;
}

export function computeProfit(
  salePrice: number,
  estimatedCost: number
): number {
  return salePrice - estimatedCost;
}

export function computePricePerSquareMeter(
  salePrice: number,
  surfaceSquareMeters: number
): number {
  if (surfaceSquareMeters <= 0) {
    throw new Error("surfaceSquareMeters must be greater than 0");
  }

  return salePrice / surfaceSquareMeters;
}

export function computeCostPerSquareMeter(
  estimatedCost: number,
  surfaceSquareMeters: number
): number {
  if (surfaceSquareMeters <= 0) {
    throw new Error("surfaceSquareMeters must be greater than 0");
  }

  return estimatedCost / surfaceSquareMeters;
}

export function computeMaxAllowedCost(
  salePrice: number,
  targetMarginRate: number
): number {
  if (targetMarginRate >= 1) {
    throw new Error("targetMarginRate must be lower than 1");
  }

  if (targetMarginRate < 0) {
    throw new Error("targetMarginRate cannot be negative");
  }

  return salePrice * (1 - targetMarginRate);
}
