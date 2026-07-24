import NewLocationClient from "@/components/new-location";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/config";
import {
  formatTripDayDate,
  getTripDayCount,
  getTripDayDate,
} from "@/lib/date-format";

export default async function NewLocation({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  const { tripId } = await params;
  const { day } = await searchParams;

  if (!isAuthConfigured()) {
    redirect("/trips");
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      budget: { select: { currency: true } },
    },
  });

  if (!trip) {
    notFound();
  }

  const requestedDayIndex = Number(day);
  const dayCount = getTripDayCount(trip.startDate, trip.endDate);
  const dayIndex =
    Number.isInteger(requestedDayIndex) &&
    requestedDayIndex >= 0 &&
    requestedDayIndex < dayCount
      ? requestedDayIndex
      : 0;
  const dayDate = getTripDayDate(trip.startDate, dayIndex);

  return (
    <NewLocationClient
      tripId={tripId}
      tripTitle={trip.title}
      dayIndex={dayIndex}
      dayLabel={`Day ${dayIndex + 1} · ${formatTripDayDate(dayDate)}`}
      budgetCurrency={trip.budget?.currency ?? null}
    />
  );
}
