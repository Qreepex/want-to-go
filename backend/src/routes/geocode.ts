import { Router } from "express";

const geocodeRouter = Router();

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  neighbourhood?: string;
  county?: string;
  state?: string;
  region?: string;
  province?: string;
  country?: string;
};

function getRegionName(
  address: NominatimAddress | undefined,
  fallback: string,
): string {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.hamlet ??
    address?.suburb ??
    address?.neighbourhood ??
    address?.county ??
    address?.state ??
    address?.region ??
    address?.province ??
    address?.country ??
    fallback
  );
}

geocodeRouter.get("/search", async (request, response) => {
  const query =
    typeof request.query.q === "string" ? request.query.q.trim() : "";

  if (!query) {
    response.status(400).json({ error: "Query is required" });
    return;
  }

  const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
  searchUrl.searchParams.set("format", "jsonv2");
  searchUrl.searchParams.set("addressdetails", "1");
  searchUrl.searchParams.set("limit", "8");
  searchUrl.searchParams.set("q", query);

  // TODO: cache / rate limit

  const upstreamResponse = await fetch(searchUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "WantToGo/1.0 (https://go.schiemann.work)",
      Referer: "https://go.schiemann.work",
    },
  });

  if (!upstreamResponse.ok) {
    const body = await upstreamResponse.text();
    console.error(
      `Geocoding service failed: ${upstreamResponse.status} ${upstreamResponse.statusText} - ${body}`,
    );

    response.status(502).json({ error: "Geocoding service failed" });
    return;
  }

  const results = (await upstreamResponse.json()) as Array<{
    name?: string;
    display_name?: string;
    lat: string;
    lon: string;
  }>;

  response.json({
    results: results.map((entry) => ({
      name: entry.name ?? entry.display_name ?? query,
      displayName: entry.display_name ?? entry.name ?? query,
      latitude: Number(entry.lat),
      longitude: Number(entry.lon),
    })),
  });
});

geocodeRouter.get("/reverse", async (request, response) => {
  const latitude =
    typeof request.query.lat === "string" ? Number(request.query.lat) : NaN;
  const longitude =
    typeof request.query.lon === "string" ? Number(request.query.lon) : NaN;

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    response.status(400).json({ error: "Latitude and longitude are required" });
    return;
  }

  const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
  reverseUrl.searchParams.set("format", "jsonv2");
  reverseUrl.searchParams.set("addressdetails", "1");
  reverseUrl.searchParams.set("lat", String(latitude));
  reverseUrl.searchParams.set("lon", String(longitude));

  const upstreamResponse = await fetch(reverseUrl, {
    headers: {
      accept: "application/json",
      "user-agent": "WantToGo/1.0 (https://go.schiemann.work)",
      Referer: "https://go.schiemann.work",
    },
  });

  if (!upstreamResponse.ok) {
    const body = await upstreamResponse.text();
    console.error(
      `Reverse geocoding service failed: ${upstreamResponse.status} ${upstreamResponse.statusText} - ${body}`,
    );

    response.status(502).json({ error: "Geocoding service failed" });
    return;
  }

  const entry = (await upstreamResponse.json()) as {
    name?: string;
    display_name?: string;
    address?: NominatimAddress;
  };

  const displayName = entry.display_name ?? entry.name ?? "Dropped pin";
  const regionName = getRegionName(entry.address, displayName);

  response.json({
    name: regionName,
    displayName,
    latitude,
    longitude,
  });
});

export default geocodeRouter;
