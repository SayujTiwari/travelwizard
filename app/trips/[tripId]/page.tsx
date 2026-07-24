import { auth } from "@/auth";
import TripDetailClient from "@/components/trip-detail";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/config";

export default async function TripDetail({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ tab?: string; day?: string }>;
}) {
  const { tripId } = await params;
  const { tab, day } = await searchParams;

  if (!isAuthConfigured()) {
    redirect("/trips");
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    include: {
      locations: { orderBy: { order: "asc" } },
      budget: {
        include: {
          allocations: true,
          items: {
            orderBy: { createdAt: "desc" },
            include: {
              location: {
                select: {
                  id: true,
                  locationTitle: true,
                  dayIndex: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!trip) {
    return <div> Trip not found.</div>;
  }

  const parsedDay = Number(day);

  return (
    <TripDetailClient
      trip={trip}
      initialTab={tab === "itinerary" ? "itinerary" : "overview"}
      initialDayIndex={
        Number.isInteger(parsedDay) && parsedDay >= 0 ? parsedDay : 0
      }
    />
  );
}
