"use server";

import { auth } from "@/auth";
import {
  isBudgetCategory,
  parseBudgetAmountToCents,
} from "@/lib/budget";
import { getTripDayCount } from "@/lib/date-format";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function geocodeAddress(address: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps is not configured.");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("The address could not be looked up.");
  }

  const data = await response.json();
  if (data.status !== "OK" || !data.results?.[0]) {
    throw new Error(
      data.status === "ZERO_RESULTS"
        ? "No location was found for that address."
        : "The address could not be looked up."
    );
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng };
}

export async function addLocation(formData: FormData, tripId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Not authenticated");
  }

  const address = formData.get("address")?.toString().trim();
  const locationTitle = formData.get("locationTitle")?.toString().trim();
  if (!address || !locationTitle) {
    throw new Error("Select a place from the search suggestions.");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      budget: { select: { id: true } },
    },
  });

  if (!trip) {
    throw new Error("Trip not found");
  }

  const dayIndex = Number(formData.get("dayIndex"));
  const dayCount = getTripDayCount(trip.startDate, trip.endDate);

  if (
    !Number.isInteger(dayIndex) ||
    dayIndex < 0 ||
    dayIndex >= dayCount
  ) {
    throw new Error("Select a valid trip day.");
  }

  const rawLat = formData.get("lat")?.toString().trim();
  const rawLng = formData.get("lng")?.toString().trim();
  const submittedLat = Number(rawLat);
  const submittedLng = Number(rawLng);
  const hasValidCoordinates =
    Boolean(rawLat) &&
    Boolean(rawLng) &&
    Number.isFinite(submittedLat) &&
    Number.isFinite(submittedLng) &&
    submittedLat >= -90 &&
    submittedLat <= 90 &&
    submittedLng >= -180 &&
    submittedLng <= 180;

  const { lat, lng } = hasValidCoordinates
    ? { lat: submittedLat, lng: submittedLng }
    : await geocodeAddress(address);

  const count = await prisma.location.count({
    where: { tripId, dayIndex },
  });

  const plannedAmount = parseBudgetAmountToCents(
    formData.get("plannedAmount")
  );
  const budgetCategory = formData.get("budgetCategory")?.toString() ?? "";

  if (
    formData.get("plannedAmount")?.toString().trim() &&
    plannedAmount === null
  ) {
    throw new Error("Enter a valid estimated cost.");
  }

  if (plannedAmount && !isBudgetCategory(budgetCategory)) {
    throw new Error("Select a valid budget category.");
  }

  await prisma.$transaction(async (transaction) => {
    const location = await transaction.location.create({
      data: {
        locationTitle,
        lat,
        lng,
        tripId: trip.id,
        dayIndex,
        order: count,
      },
    });

    if (trip.budget && plannedAmount) {
      await transaction.budgetItem.create({
        data: {
          budgetId: trip.budget.id,
          locationId: location.id,
          name: locationTitle,
          category: budgetCategory,
          plannedAmount,
          dayIndex,
        },
      });
    }
  });

  redirect(`/trips/${tripId}?tab=itinerary&day=${dayIndex}`);
}
