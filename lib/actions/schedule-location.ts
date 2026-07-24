"use server";

import { auth } from "@/auth";
import { getTripDayCount } from "@/lib/date-format";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function scheduleLocation(
  tripId: string,
  locationId: string,
  targetDayIndex: number | null
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: {
      startDate: true,
      endDate: true,
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

  const dayCount = getTripDayCount(trip.startDate, trip.endDate);
  if (
    targetDayIndex !== null &&
    (!Number.isInteger(targetDayIndex) ||
      targetDayIndex < 0 ||
      targetDayIndex >= dayCount)
  ) {
    throw new Error("Select a valid trip day");
  }

  if (location.dayIndex === targetDayIndex) {
    return;
  }

  const destinationCount = trip.locations.filter(
    ({ dayIndex }) => dayIndex === targetDayIndex
  ).length;
  const previousDayIds = trip.locations
    .filter(
      ({ id, dayIndex }) =>
        id !== locationId && dayIndex === location.dayIndex
    )
    .map(({ id }) => id);

  await prisma.$transaction([
    prisma.location.update({
      where: { id: locationId },
      data: { dayIndex: targetDayIndex, order: destinationCount },
    }),
    prisma.budgetItem.updateMany({
      where: { locationId },
      data: { dayIndex: targetDayIndex },
    }),
    ...previousDayIds.map((id, order) =>
      prisma.location.update({
        where: { id },
        data: { order },
      })
    ),
  ]);

  revalidatePath(`/trips/${tripId}`);
}
