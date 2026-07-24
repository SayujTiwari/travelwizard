"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { Button } from "./ui/button";
import { addLocation } from "@/lib/actions/add-location";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CalendarDays,
  LoaderCircle,
  MapPin,
  Search,
  Star,
} from "lucide-react";
import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";
import { BUDGET_CATEGORIES } from "@/lib/budget";

interface SelectedPlace {
  placeId: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  type?: string;
}

type PlaceSelectionEvent = Event & {
  place?: google.maps.places.Place;
  placePrediction?: {
    toPlace: () => google.maps.places.Place;
  };
};

function SelectedPlaceMap({ place }: { place: SelectedPlace }) {
  const position = { lat: place.lat, lng: place.lng };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <MapPin className="h-4 w-4 text-teal-700" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold text-slate-900">Confirm on map</p>
          <p className="text-xs text-slate-500">
            Make sure the marker is at the place you intended.
          </p>
        </div>
      </div>
      <div className="h-64 w-full">
        <GoogleMap
          key={place.placeId}
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={position}
          zoom={16}
          options={{
            clickableIcons: false,
            fullscreenControl: true,
            mapTypeControl: false,
            streetViewControl: false,
          }}
        >
          <Marker position={position} title={place.title} />
        </GoogleMap>
      </div>
    </div>
  );
}

function PlaceSearch({
  onSelect,
}: {
  onSelect: (place: SelectedPlace | null) => void;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadMessage, setLoadMessage] = useState<string | null>(null);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  useEffect(() => {
    if (!isLoaded || !containerRef.current) {
      return;
    }

    let disposed = false;
    let autocomplete: google.maps.places.PlaceAutocompleteElement | null = null;

    const initializeAutocomplete = async () => {
      try {
        const placesLibrary = await google.maps.importLibrary("places");
        const { PlaceAutocompleteElement } = placesLibrary as unknown as {
          PlaceAutocompleteElement: typeof google.maps.places.PlaceAutocompleteElement;
        };

        if (disposed || !containerRef.current) {
          return;
        }

        const autocompleteElement = new PlaceAutocompleteElement({});
        autocomplete = autocompleteElement;
        autocompleteElement.setAttribute(
          "placeholder",
          "Search Universal Studios Florida, a restaurant, or an address"
        );
        autocompleteElement.style.width = "100%";

        const handleSelection = async (event: Event) => {
          const selectionEvent = event as PlaceSelectionEvent;
          const place =
            selectionEvent.placePrediction?.toPlace() ?? selectionEvent.place;

          if (!place) {
            return;
          }

          onSelect(null);
          setLoadMessage(null);

          try {
            await place.fetchFields({
              fields: [
                "id",
                "displayName",
                "formattedAddress",
                "location",
                "primaryTypeDisplayName",
                "rating",
              ],
            });

            const lat = place.location?.lat();
            const lng = place.location?.lng();

            if (
              !place.displayName ||
              !place.formattedAddress ||
              lat === undefined ||
              lng === undefined
            ) {
              throw new Error("The selected place is missing location details.");
            }

            onSelect({
              placeId: place.id,
              title: place.displayName,
              address: place.formattedAddress,
              lat,
              lng,
              rating: place.rating ?? undefined,
              type: place.primaryTypeDisplayName ?? undefined,
            });
          } catch {
            setLoadMessage(
              "We could not load details for that place. Try selecting it again."
            );
          }
        };

        // Google renamed this event as the new widget became generally
        // available. Listening for both keeps the form compatible across
        // Maps JavaScript API release channels.
        autocompleteElement.addEventListener("gmp-select", handleSelection);
        autocompleteElement.addEventListener(
          "gmp-placeselect",
          handleSelection
        );

        containerRef.current.replaceChildren(autocompleteElement);
      } catch {
        setLoadMessage(
          "Place search could not load. Enable Places API (New) for your browser Google Maps key."
        );
      }
    };

    void initializeAutocomplete();

    return () => {
      disposed = true;
      autocomplete?.remove();
    };
  }, [isLoaded, onSelect]);

  if (!apiKey) {
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to use place search.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
        Place search could not load. Check the browser Google Maps key.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        {!isLoaded && (
          <div className="flex h-12 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading place search...
          </div>
        )}
        <div ref={containerRef} className={isLoaded ? "min-h-12" : "hidden"} />
      </div>
      {loadMessage && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {loadMessage}
        </p>
      )}
    </div>
  );
}

export default function NewLocationClient({
  tripId,
  tripTitle,
  dayIndex,
  dayLabel,
  budgetCurrency,
}: {
  tripId: string;
  tripTitle: string;
  dayIndex: number;
  dayLabel: string;
  budgetCurrency: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null
  );

  const handlePlaceSelection = useCallback((place: SelectedPlace | null) => {
    setSelectedPlace(place);
    setError(null);
  }, []);

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        <Link
          href={`/trips/${tripId}`}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to trip
        </Link>
        <div className="rounded-2xl border bg-white p-8 shadow-lg">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Add a destination
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Search for the next stop on {tripTitle}, then choose a suggestion
            to confirm the exact place.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            Adding to {dayLabel}
          </div>

          <form
            className="mt-7 space-y-6"
            action={(formData: FormData) => {
              setError(null);
              startTransition(async () => {
                try {
                  await addLocation(formData, tripId);
                } catch {
                  setError(
                    "That destination could not be added. Check the address and try again."
                  );
                }
              });
            }}
          >
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Search className="h-4 w-4" aria-hidden="true" />
                Search for a place
              </label>
              <PlaceSearch onSelect={handlePlaceSelection} />
              <p className="mt-2 text-xs text-slate-500">
                Select one of the Google suggestions so the correct location
                and coordinates are saved.
              </p>
            </div>

            {selectedPlace && (
              <div className="space-y-4">
                <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
                      <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {selectedPlace.title}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-slate-600">
                        {selectedPlace.address}
                      </p>
                      {(selectedPlace.type || selectedPlace.rating) && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-600">
                          {selectedPlace.type && (
                            <span>{selectedPlace.type}</span>
                          )}
                          {selectedPlace.rating && (
                            <span className="inline-flex items-center gap-1">
                              <Star
                                className="h-3.5 w-3.5 fill-amber-400 text-amber-500"
                                aria-hidden="true"
                              />
                              {selectedPlace.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <SelectedPlaceMap place={selectedPlace} />
                {budgetCurrency && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <h2 className="font-semibold text-slate-900">
                      Estimated cost
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Optional. This creates a linked item in the trip budget.
                    </p>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Category
                        </label>
                        <select
                          name="budgetCategory"
                          defaultValue="activities"
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {BUDGET_CATEGORIES.map(({ key, label }) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700">
                          Planned amount ({budgetCurrency})
                        </label>
                        <input
                          name="plannedAmount"
                          type="number"
                          min="0"
                          max="20000000"
                          step="0.01"
                          placeholder="0.00"
                          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <input
              type="hidden"
              name="locationTitle"
              value={selectedPlace?.title ?? ""}
            />
            <input
              type="hidden"
              name="address"
              value={selectedPlace?.address ?? ""}
            />
            <input
              type="hidden"
              name="placeId"
              value={selectedPlace?.placeId ?? ""}
            />
            <input
              type="hidden"
              name="lat"
              value={selectedPlace?.lat ?? ""}
            />
            <input
              type="hidden"
              name="lng"
              value={selectedPlace?.lng ?? ""}
            />
            <input type="hidden" name="dayIndex" value={dayIndex} />

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !selectedPlace}
            >
              {isPending ? "Adding..." : "Confirm location and add"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
