# Travel Wizard

Travel Wizard is a full-stack travel planner for creating trips, organizing
destinations, visualizing an itinerary, and optimizing the driving order between
fixed start and end points.

## Features

- GitHub sign-in and user-owned trips
- Trip dates, descriptions, and optional cover images
- Address search and geocoded destinations
- Ordered itinerary with drag-and-drop controls
- Google Routes travel-time matrix and fixed-endpoint 2-opt optimization
- Before/after travel-time comparison with an explicit save step
- Numbered map markers and an itinerary path
- Visited-country travel globe

## Local setup

Requirements:

- Node.js 20 or newer
- PostgreSQL
- A GitHub OAuth app
- A Google Maps Platform project
- An UploadThing account if trip image uploads are needed

Install dependencies and create your local environment file:

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`.

For GitHub OAuth, use this local callback URL:

```text
http://localhost:3000/api/auth/callback/github
```

Enable these Google Maps Platform APIs:

- Maps JavaScript API for the browser map
- Geocoding API for destination lookup and visited countries
- Routes API for travel-time matrices and route optimization

Apply the database migrations:

```bash
npm run db:migrate
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production

Set the same environment variables on the hosting platform, change
`AUTH_URL` and `NEXT_PUBLIC_APP_URL` to the production HTTPS URL, and add the
production GitHub OAuth callback.

Apply migrations and build:

```bash
npm run db:deploy
npm run build
npm run start
```

`npm run start` serves the already-built production application; run
`npm run build` first whenever the source changes.

## Route optimization

The optimizer requests a driving-time matrix from Google Routes and runs a
2-opt heuristic over the intermediate stops. The first and last destinations
remain fixed. Google currently permits a maximum matrix of 625 elements, so
Travel Wizard supports up to 25 stops per optimization request.
