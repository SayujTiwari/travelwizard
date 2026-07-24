"use server";

import { auth } from "@/auth";
import { getDrivingTimeMatrix } from "@/lib/google-route-matrix";
import { prisma } from "@/lib/prisma";
import { optimizeRouteWithTwoOpt } from "@/lib/route-optimizer";

export type OptimizeItineraryResult =
  | {
      ok: true;
      orderedLocationIds: string[];
      originalDurationSeconds: number;
      optimizedDurationSeconds: number;
      savingsSeconds: number;
      savingsPercent: number;
    }
  | {
      ok: false;
      error: string;
    };

export async function optimizeItinerary(
  tripId: string
): Promise<OptimizeItineraryResult> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { ok: false, error: "Please sign in to optimize this itinerary." };
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: {
      locations: {
        orderBy: { order: "asc" },
        select: { id: true, lat: true, lng: true },
      },
    },
  });

  if (!trip) {
    return { ok: false, error: "Trip not found." };
  }

  if (trip.locations.length < 4) {
    return {
      ok: false,
      error:
        "Add at least four stops to optimize while keeping the first and last fixed.",
    };
  }

  try {
    const matrix = await getDrivingTimeMatrix(
      trip.locations.map(({ lat, lng }) => ({ lat, lng }))
    );
    const optimization = optimizeRouteWithTwoOpt(matrix);
    const savingsSeconds = Math.max(
      0,
      optimization.originalDurationSeconds -
        optimization.optimizedDurationSeconds
    );

    return {
      ok: true,
      orderedLocationIds: optimization.order.map(
        (index) => trip.locations[index].id
      ),
      originalDurationSeconds: optimization.originalDurationSeconds,
      optimizedDurationSeconds: optimization.optimizedDurationSeconds,
      savingsSeconds,
      savingsPercent:
        optimization.originalDurationSeconds > 0
          ? (savingsSeconds / optimization.originalDurationSeconds) * 100
          : 0,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Route optimization failed. Please try again.",
    };
  }
}
