interface GeocodeResult {
  country: string;
  formattedAddress: string;
}

interface AddressComponent {
  long_name: string;
  types: string[];
}

export async function getCountryFromCoordinates(
  lat: number,
  lng: number
): Promise<GeocodeResult> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error("Google Maps is not configured.");
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed.");
  }

  const data = await response.json();

  const result = data.results[0];
  if (data.status !== "OK" || !result) {
    throw new Error("No address was found for these coordinates.");
  }

  const countryComponent = result.address_components.find(
    (component: AddressComponent) => component.types.includes("country")
  );

  return {
    country: countryComponent?.long_name || "Unknown",
    formattedAddress: result.formatted_address,
  };
}
