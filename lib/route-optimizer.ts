export interface RouteOptimization {
  order: number[];
  originalDurationSeconds: number;
  optimizedDurationSeconds: number;
}

export function calculateRouteDuration(
  order: number[],
  travelTimes: number[][]
) {
  return order.slice(0, -1).reduce((total, origin, index) => {
    const destination = order[index + 1];
    const duration = travelTimes[origin]?.[destination];

    if (!Number.isFinite(duration)) {
      throw new Error("The travel-time matrix is incomplete.");
    }

    return total + duration;
  }, 0);
}

/**
 * Improves an open route with 2-opt while keeping the first and last stops fixed.
 * Route matrices can be asymmetric, so candidates are scored in full instead of
 * using the symmetric-distance shortcut.
 */
export function optimizeRouteWithTwoOpt(
  travelTimes: number[][]
): RouteOptimization {
  const stopCount = travelTimes.length;

  if (
    stopCount < 2 ||
    travelTimes.some((row) => row.length !== stopCount)
  ) {
    throw new Error("A square travel-time matrix is required.");
  }

  let bestOrder = Array.from({ length: stopCount }, (_, index) => index);
  const originalDurationSeconds = calculateRouteDuration(
    bestOrder,
    travelTimes
  );
  let bestDurationSeconds = originalDurationSeconds;
  let improved = true;

  while (improved) {
    improved = false;

    // Index 0 and the final index are deliberately excluded from reversals.
    for (let start = 1; start < stopCount - 2; start += 1) {
      for (let end = start + 1; end < stopCount - 1; end += 1) {
        const candidate = [
          ...bestOrder.slice(0, start),
          ...bestOrder.slice(start, end + 1).reverse(),
          ...bestOrder.slice(end + 1),
        ];
        const candidateDuration = calculateRouteDuration(
          candidate,
          travelTimes
        );

        if (candidateDuration < bestDurationSeconds) {
          bestOrder = candidate;
          bestDurationSeconds = candidateDuration;
          improved = true;
        }
      }
    }
  }

  return {
    order: bestOrder,
    originalDurationSeconds,
    optimizedDurationSeconds: bestDurationSeconds,
  };
}
