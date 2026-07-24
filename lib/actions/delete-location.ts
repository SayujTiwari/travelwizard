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
        select: { id: true },
      },
    },
  });

  if (!trip || !trip.locations.some(({ id }) => id === locationId)) {
    throw new Error("Location not found");
  }

  const remainingIds = trip.locations
    .filter(({ id }) => id !== locationId)
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
