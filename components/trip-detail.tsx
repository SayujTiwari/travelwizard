"use client";

import { Location, Trip } from "@/app/generated/prisma";
import BudgetPanel, { type TripBudgetData } from "@/components/budget-panel";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useState, useTransition } from "react";
import Map from "@/components/map";
import SortableItinerary from "./sortable-itinerary";
import { deleteTrip } from "@/lib/actions/delete-trip";
import {
  formatTripDate,
  formatTripDayDate,
  getTripDayCount,
  getTripDayDate,
} from "@/lib/date-format";
import { formatBudgetAmount } from "@/lib/budget";

export type TripWithLocation = Trip & {
  locations: Location[];
  budget: TripBudgetData | null;
};

type MainTripTab = "overview" | "itinerary" | "budget" | "map";

interface TripDetailClientProps {
  trip: TripWithLocation;
  initialTab?: MainTripTab;
  initialDayIndex?: number;
}

export default function TripDetailClient({
  trip,
  initialTab = "overview",
  initialDayIndex = 0,
}: TripDetailClientProps) {
  const dayCount = getTripDayCount(trip.startDate, trip.endDate);
  const tripDays = Array.from({ length: dayCount }, (_, dayIndex) => ({
    dayIndex,
    date: getTripDayDate(trip.startDate, dayIndex),
  }));
  const validInitialDayIndex =
    initialDayIndex >= 0 && initialDayIndex < dayCount ? initialDayIndex : 0;
  const [activeTab, setActiveTab] = useState<MainTripTab>(initialTab);
  const [activeItineraryDay, setActiveItineraryDay] = useState(
    String(validInitialDayIndex)
  );
  const [isDeleting, startDeleteTransition] = useTransition();
  const activeScheduledDay =
    activeItineraryDay === "unscheduled"
      ? 0
      : Number(activeItineraryDay);
  const addLocationHref = `/trips/${trip.id}/itinerary/new?day=${activeScheduledDay}`;
  const dayOptions = [
    ...tripDays.map(({ dayIndex }) => ({
      label: `Day ${dayIndex + 1}`,
      value: String(dayIndex),
    })),
    { label: "Unscheduled", value: "unscheduled" },
  ];

  const handleDeleteTrip = () => {
    if (
      !window.confirm(
        `Delete “${trip.title}” and all of its destinations? This cannot be undone.`
      )
    ) {
      return;
    }

    startDeleteTransition(() => deleteTrip(trip.id));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {" "}
      {trip.imageUrl && (
        <div className="w-full h-72 md:h-96 overflow-hidden rounded-xl shadow-lg relative">
          {" "}
          <Image
            src={trip.imageUrl}
            alt={trip.title}
            className="object-cover"
            fill
            priority
          />
        </div>
      )}
      <div className="bg-white p-6 shadow rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            {" "}
            {trip.title}
          </h1>

          <div className="flex items-center text-gray-500 mt-2">
            <Calendar className="h-5 w-5 mr-2" />
            <span className="text-lg">
              {formatTripDate(trip.startDate)} - {formatTripDate(trip.endDate)}
            </span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 md:mt-0">
          <Link href={`/trips/${trip.id}/edit`}>
            <Button variant="outline">
              <Pencil aria-hidden="true" />
              Edit trip
            </Button>
          </Link>
          <Link href={addLocationHref}>
            <Button>
              <Plus className="mr-2 h-5 w-5" /> Add Location
            </Button>
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={handleDeleteTrip}
            disabled={isDeleting}
            className="text-red-700 hover:bg-red-50 hover:text-red-800"
          >
            <Trash2 aria-hidden="true" />
            {isDeleting ? "Deleting..." : "Delete trip"}
          </Button>
        </div>
      </div>
      <div className="bg-white p-6 shadow rounded-lg">
        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (
              value === "overview" ||
              value === "itinerary" ||
              value === "budget" ||
              value === "map"
            ) {
              setActiveTab(value);
            }
          }}
        >
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="text-lg">
              Overview
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="text-lg">
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-lg">
              Budget
            </TabsTrigger>
            <TabsTrigger value="map" className="text-lg">
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4"> Trip Summary</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <Calendar className="h-6 w-6 mr-3 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-700"> Dates</p>
                      <p className="text-sm text-gray-500">
                        {formatTripDate(trip.startDate)} -{" "}
                        {formatTripDate(trip.endDate)}
                        <br />
                        {`${dayCount} ${dayCount === 1 ? "day" : "days"}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-6 w-6 mr-3 text-gray-500" />
                    <div>
                      <p> Destinations</p>
                      <p>
                        {" "}
                        {trip.locations.length}{" "}
                        {trip.locations.length === 1 ? "location" : "locations"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="h-72 rounded-lg overflow-hidden shadow">
                <Map itineraries={trip.locations} showRoute={false} />
              </div>
              {trip.locations.length === 0 && (
                <div className="text-center p-4">
                  <p>Add locations to see them on the map.</p>
                  <Link href={addLocationHref}>
                    <Button>
                      {" "}
                      <Plus className="mr-2 h-5 w-5" /> Add Location
                    </Button>
                  </Link>
                </div>
              )}

              <div>
                <p className="text-gray-600 leading-relaxed">
                  {trip.description}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="itinerary" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Daily itinerary</h2>
              <p className="mt-1 text-sm text-slate-500">
                Plan and optimize each day independently.
              </p>
            </div>

            <Tabs
              value={activeItineraryDay}
              onValueChange={setActiveItineraryDay}
            >
              <TabsList className="mb-5 h-auto w-full justify-start overflow-x-auto bg-slate-100 p-1">
                {tripDays.map(({ dayIndex, date }) => {
                  const locationCount = trip.locations.filter(
                    (location) => location.dayIndex === dayIndex
                  ).length;

                  return (
                    <TabsTrigger
                      key={dayIndex}
                      value={String(dayIndex)}
                      className="h-auto flex-none px-4 py-2"
                    >
                      <span>Day {dayIndex + 1}</span>
                      <span className="text-xs font-normal text-slate-500">
                        {formatTripDate(date).replace(
                          `, ${date.getUTCFullYear()}`,
                          ""
                        )}
                      </span>
                      <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                        {locationCount}
                      </span>
                    </TabsTrigger>
                  );
                })}
                <TabsTrigger
                  value="unscheduled"
                  className="h-auto flex-none px-4 py-2"
                >
                  Unscheduled
                  <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600">
                    {
                      trip.locations.filter(
                        (location) => location.dayIndex === null
                      ).length
                    }
                  </span>
                </TabsTrigger>
              </TabsList>

              {tripDays.map(({ dayIndex, date }) => {
                const dayLocations = trip.locations.filter(
                  (location) => location.dayIndex === dayIndex
                );
                const dayPlannedAmount =
                  trip.budget?.items
                    .filter((item) => item.dayIndex === dayIndex)
                    .reduce(
                      (total, item) => total + item.plannedAmount,
                      0
                    ) ?? 0;

                return (
                  <TabsContent
                    key={dayIndex}
                    value={String(dayIndex)}
                    className="space-y-5"
                  >
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Day {dayIndex + 1}
                        </p>
                        <p className="text-sm text-slate-500">
                          {formatTripDayDate(date)}
                        </p>
                        {trip.budget && (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700">
                            <WalletCards className="h-3.5 w-3.5" />
                            {formatBudgetAmount(
                              dayPlannedAmount,
                              trip.budget.currency
                            )}{" "}
                            planned
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/trips/${trip.id}/itinerary/new?day=${dayIndex}`}
                      >
                        <Button>
                          <Plus className="mr-2 h-5 w-5" /> Add Location
                        </Button>
                      </Link>
                    </div>

                    {dayLocations.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                        <MapPin className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-3 font-medium text-slate-700">
                          No destinations planned for this day
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Add a location and it will be scheduled here
                          automatically.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="h-64 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                          <Map itineraries={dayLocations} />
                        </div>
                        <SortableItinerary
                          key={`${dayIndex}-${dayLocations
                            .map(({ id }) => id)
                            .join("-")}`}
                          locations={dayLocations}
                          tripId={trip.id}
                          dayIndex={dayIndex}
                          dayOptions={dayOptions}
                        />
                      </>
                    )}
                  </TabsContent>
                );
              })}

              <TabsContent value="unscheduled" className="space-y-5">
                {trip.locations.some(
                  (location) => location.dayIndex === null
                ) ? (
                  <SortableItinerary
                    key={`unscheduled-${trip.locations
                      .filter((location) => location.dayIndex === null)
                      .map(({ id }) => id)
                      .join("-")}`}
                    locations={trip.locations.filter(
                      (location) => location.dayIndex === null
                    )}
                    tripId={trip.id}
                    dayIndex={null}
                    dayOptions={dayOptions}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 px-6 py-12 text-center">
                    <p className="font-medium text-slate-700">
                      Everything is scheduled
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Locations without a day assignment will appear here.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <BudgetPanel
              tripId={trip.id}
              startDate={trip.startDate}
              endDate={trip.endDate}
              budget={trip.budget}
            />
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <div className="h-72 rounded-lg overflow-hidden shadow">
              <Map itineraries={trip.locations} showRoute={false} />
            </div>
            {trip.locations.length === 0 && (
              <div className="text-center p-4">
                <p>Add locations to see them on the map.</p>
                <Link href={addLocationHref}>
                  <Button>
                    {" "}
                    <Plus className="mr-2 h-5 w-5" /> Add Location
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <div className="text-center">
        <Link href={`/trips`}>
          <Button> Back to Trips</Button>
        </Link>
      </div>
    </div>
  );
}
