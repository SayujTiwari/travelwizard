"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateTrip(tripId: string, formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim();
  const startDateValue = formData.get("startDate")?.toString();
  const endDateValue = formData.get("endDate")?.toString();

  if (!title || !description || !startDateValue || !endDateValue) {
    throw new Error("All fields are required.");
  }

  const startDate = new Date(startDateValue);
  const endDate = new Date(endDateValue);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate < startDate
  ) {
    throw new Error("Enter a valid date range.");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: { id: true },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  await prisma.trip.update({
    where: { id: trip.id },
    data: {
      title: title.slice(0, 100),
      description: description.slice(0, 2000),
      startDate,
      endDate,
    },
  });

  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/trips");
  redirect(`/trips/${tripId}`);
}
