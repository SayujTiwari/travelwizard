"use client";

import { useState, useTransition } from "react";
import { Button } from "./ui/button";
import { addLocation } from "@/lib/actions/add-location";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";

export default function NewLocationClient({
  tripId,
  tripTitle,
}: {
  tripId: string;
  tripTitle: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
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
            Add the next stop to {tripTitle}. A complete street address or
            recognizable place name works best.
          </p>

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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                name="address"
                type="text"
                required
                autoComplete="street-address"
                placeholder="e.g. CN Tower, Toronto"
                className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Adding..." : "Add Location"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
