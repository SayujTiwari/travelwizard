import "server-only";

interface Coordinate {
  lat: number;
  lng: number;
}

interface RouteMatrixElement {
  originIndex?: number;
  destinationIndex?: number;
  duration?: string;
  condition?: string;
  status?: {
    code?: number;
    message?: string;
  };
}

const ROUTE_MATRIX_ENDPOINT =
  "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

function parseDurationSeconds(duration: string | undefined) {
  if (!duration?.endsWith("s")) {
    return Number.NaN;
  }

  return Number(duration.slice(0, -1));
}

export async function getDrivingTimeMatrix(
  coordinates: Coordinate[]
): Promise<number[][]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Route optimization is not configured. Add GOOGLE_MAPS_API_KEY to the server environment."
    );
  }

  if (coordinates.length > 25) {
    throw new Error("Route optimization supports up to 25 stops at a time.");
  }

  const waypoints = coordinates.map(({ lat, lng }) => ({
    waypoint: {
      location: {
        latLng: {
          latitude: lat,
          longitude: lng,
        },
      },
    },
  }));

  const response = await fetch(ROUTE_MATRIX_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "originIndex,destinationIndex,duration,status,condition",
    },
    body: JSON.stringify({
      origins: waypoints,
      destinations: waypoints,
      travelMode: "DRIVE",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      "Google Routes could not calculate travel times. Confirm that the Routes API is enabled for this key."
    );
  }

  const elements = (await response.json()) as RouteMatrixElement[];
  const matrix = Array.from({ length: coordinates.length }, (_, origin) =>
    Array.from(
      { length: coordinates.length },
      (_, destination) => (origin === destination ? 0 : Number.NaN)
    )
  );

  for (const element of elements) {
    const { originIndex, destinationIndex } = element;

    if (
      originIndex === undefined ||
      destinationIndex === undefined ||
      originIndex === destinationIndex
    ) {
      continue;
    }

    const durationSeconds = parseDurationSeconds(element.duration);
    if (
      element.status?.code ||
      element.condition !== "ROUTE_EXISTS" ||
      !Number.isFinite(durationSeconds)
    ) {
      continue;
    }

    matrix[originIndex][destinationIndex] = durationSeconds;
  }

  const hasMissingRoute = matrix.some((row, origin) =>
    row.some(
      (duration, destination) =>
        origin !== destination && !Number.isFinite(duration)
    )
  );

  if (hasMissingRoute) {
    throw new Error(
      "A driving route could not be found between one or more stops."
    );
  }

  return matrix;
}
