import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateTrip } from "@/lib/actions/update-trip";
import { prisma } from "@/lib/prisma";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/config";

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function EditTripPage({
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
  });

  if (!trip) {
    notFound();
  }

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href={`/trips/${trip.id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to trip
        </Link>
        <Card className="shadow-lg">
          <CardHeader>
            <h1 className="text-2xl font-bold text-slate-900">Edit trip</h1>
            <p className="text-sm text-slate-500">
              Update the trip details without changing your saved destinations.
            </p>
          </CardHeader>
          <CardContent>
            <form
              action={updateTrip.bind(null, trip.id)}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="title"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  defaultValue={trip.title}
                  required
                  maxLength={100}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={trip.description}
                  required
                  maxLength={2000}
                  rows={5}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="startDate"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Start date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    defaultValue={formatDateInput(trip.startDate)}
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endDate"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    End date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    defaultValue={formatDateInput(trip.endDate)}
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                Save changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
