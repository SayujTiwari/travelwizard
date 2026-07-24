"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteLocation(tripId: string, locationId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: {
      locations: {
        orderBy: { order: "asc" },
        select: { id: true, dayIndex: true },
      },
    },
  });

  const location = trip?.locations.find(({ id }) => id === locationId);

  if (!trip || !location) {
    throw new Error("Location not found");
  }

  const remainingIds = trip.locations
    .filter(
      ({ id, dayIndex }) =>
        id !== locationId && dayIndex === location.dayIndex
    )
    .map(({ id }) => id);

  await prisma.$transaction([
    prisma.location.delete({ where: { id: locationId } }),
    ...remainingIds.map((id, order) =>
      prisma.location.update({
        where: { id },
        data: { order },
      })
    ),
  ]);

  revalidatePath(`/trips/${tripId}`);
}
