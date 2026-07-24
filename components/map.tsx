"use client";

import { Location } from "@/app/generated/prisma";
import {
  GoogleMap,
  Marker,
  Polyline,
  useLoadScript,
} from "@react-google-maps/api";

interface MapProps {
  itineraries: Location[];
}

export default function Map({ itineraries }: MapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
  });

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 p-6 text-center text-sm text-slate-500">
        Add a browser Google Maps key to display the itinerary map.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center bg-red-50 p-6 text-center text-sm text-red-700">
        The map could not be loaded. Check the Google Maps configuration.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 text-sm text-slate-500">
        Loading map...
      </div>
    );
  }

  const center =
    itineraries.length > 0
      ? { lat: itineraries[0].lat, lng: itineraries[0].lng }
      : { lat: 0, lng: 0 };
  return (
    <GoogleMap
      mapContainerStyle={{ width: "100%", height: "100%" }}
      zoom={8}
      center={center}
      onLoad={(map) => {
        if (itineraries.length < 2) {
          return;
        }

        const bounds = new window.google.maps.LatLngBounds();
        itineraries.forEach(({ lat, lng }) => bounds.extend({ lat, lng }));
        map.fitBounds(bounds, 48);
      }}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {itineraries.length > 1 && (
        <Polyline
          path={itineraries.map(({ lat, lng }) => ({ lat, lng }))}
          options={{
            strokeColor: "#0d9488",
            strokeOpacity: 0.85,
            strokeWeight: 4,
          }}
        />
      )}
      {itineraries.map((location, index) => (
        <Marker
          key={location.id}
          position={{ lat: location.lat, lng: location.lng }}
          title={location.locationTitle}
          label={{
            text: String(index + 1),
            color: "white",
            fontWeight: "700",
          }}
        />
      ))}
    </GoogleMap>
  );
}
