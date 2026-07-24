"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-b-teal-600" />
    </div>
  ),
});

export interface TransformedLocation {
  lat: number;
  lng: number;
  name: string;
  country: string;
}

export default function GlobePage() {
  const [visitedCountries, setVisitedCountries] = useState<Set<string>>(
    new Set()
  );
  const [locations, setLocations] = useState<TransformedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch("/api/trips");
        if (!response.ok) {
          throw new Error("Unable to load travel history");
        }

        const data = await response.json();
        setLocations(data);
        const countries = new Set<string>(
          data.map((loc: TransformedLocation) => loc.country)
        );

        setVisitedCountries(countries);
      } catch {
        setError(
          "Your travel history could not be loaded. Check your sign-in and map configuration."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {" "}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-center text-4xl font-bold mb-12">
            {" "}
            Your Travel Journey
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="overflow-hidden rounded-xl bg-white shadow-lg lg:col-span-2">
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-4">
                  {" "}
                  See where you&apos;ve been...
                </h2>

                <div className="h-[600px] w-full relative">
                  {error ? (
                    <div className="flex h-full items-center justify-center p-8 text-center text-sm text-red-700">
                      {error}
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900">
                        {" "}
                      </div>
                    </div>
                  ) : (
                    <Globe
                      globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
                      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                      backgroundColor="rgba(0,0,0,0)"
                      pointColor={() => "#FF5733"}
                      pointLabel="name"
                      pointsData={locations}
                      pointRadius={0.5}
                      pointAltitude={0.1}
                      pointsMerge={true}
                      width={800}
                      height={600}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  {" "}
                  <CardTitle> Countries Visited</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900">
                        {" "}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-800">
                          {" "}
                          You&apos;ve visited{" "}
                          <span className="font-bold">
                            {" "}
                            {visitedCountries.size}
                          </span>{" "}
                          countries.
                        </p>
                      </div>

                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {Array.from(visitedCountries)
                          .sort()
                          .map((country, key) => (
                            <div
                              key={key}
                              className="flex items-center gap-2 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                            >
                              <MapPin className="h-4 w-4 text-red-500" />
                              <span className="font-medium"> {country}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>{" "}
    </div>
  );
}
