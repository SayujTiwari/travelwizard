"use server";

import { auth } from "@/auth";
import { prisma } from "../prisma";
import { revalidatePath } from "next/cache";

export async function reorderItinerary(tripId: string, newOrder: string[]) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: {
      locations: {
        select: { id: true },
      },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const currentIds = new Set(trip.locations.map(({ id }) => id));
  const newIds = new Set(newOrder);

  if (
    currentIds.size !== newOrder.length ||
    newIds.size !== newOrder.length ||
    newOrder.some((locationId) => !currentIds.has(locationId))
  ) {
    throw new Error("The itinerary order is invalid");
  }

  await prisma.$transaction(
    newOrder.map((locationId: string, key: number) =>
      prisma.location.update({
        where: { id: locationId },
        data: { order: key },
      })
    )
  );

  revalidatePath(`/trips/${tripId}`);
}
