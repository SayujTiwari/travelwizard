import { auth } from "@/auth";
import AuthButton from "@/components/auth-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { isAuthConfigured } from "@/lib/config";
import { formatTripDate } from "@/lib/date-format";
import Link from "next/link";

export default async function TripsPage() {
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await auth() : null;

  if (!session?.user?.id) {
    return (
      <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-50 px-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>
              {authConfigured
                ? "Sign in to see your trips"
                : "Finish setup to start planning"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-slate-600">
            <p>
              {authConfigured
                ? "Your itinerary, saved destinations, and optimized routes are tied to your account."
                : "Copy .env.example to .env.local, add the database and GitHub OAuth values, then restart the app."}
            </p>
            {authConfigured && (
              <AuthButton
                isLoggedIn={false}
                className="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                Sign in with GitHub
              </AuthButton>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  const trips = await prisma.trip.findMany({
    where: { userId: session.user.id },
  });

  const sortedTrips = [...trips].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingTrips = sortedTrips.filter(
    (trip) => new Date(trip.startDate) >= today
  );

  return (
    <div className="space-y-6 container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight"> Dashboard</h1>
        <Link href="/trips/new">
          <Button>New Trip</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle> Welcome back, {session.user?.name} </CardTitle>
        </CardHeader>

        <CardContent>
          <p>
            {" "}
            {trips.length === 0
              ? "Start planning your first trip by clicking the button above."
              : `You have ${trips.length} ${
                  trips.length === 1 ? "trip" : "trips"
                } planned. ${
                  upcomingTrips.length > 0
                    ? `${upcomingTrips.length} upcoming.`
                    : ""
                } `}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-xl font-semibold mb-4"> Your Recent Trips</h2>
        {trips.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <h3 className="text-xl font-medium mb-2"> No trips yet.</h3>
              <p className="text-center mb-4 max-w-md">
                Start planning your adventure by creating your first trip.
              </p>
              <Link href="/trips/new">
                <Button>Create Trip</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedTrips.slice(0, 6).map((trip) => (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{trip.title}</CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm line-clamp-2 mb-2">
                      {trip.description}
                    </p>
                    <div className="text-sm">
                      {" "}
                      {formatTripDate(trip.startDate)} -{" "}
                      {formatTripDate(trip.endDate)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
