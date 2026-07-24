"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function deleteTrip(tripId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: { id: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  await prisma.$transaction([
    prisma.location.deleteMany({ where: { tripId } }),
    prisma.trip.delete({ where: { id: tripId } }),
  ]);

  redirect("/trips");
}
