import NewLocationClient from "@/components/new-location";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/config";

export default async function NewLocation({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  if (!isAuthConfigured()) {
    redirect("/trips");
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const trip = await prisma.trip.findFirst({
    where: { id: tripId, userId: session.user.id },
    select: { id: true, title: true },
  });

  if (!trip) {
    notFound();
  }

  return <NewLocationClient tripId={tripId} tripTitle={trip.title} />;
}
