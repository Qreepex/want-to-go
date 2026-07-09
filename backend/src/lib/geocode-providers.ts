import { NominatimAddress, UnifiedGeocodeResult } from "./types.js";
import { throttle } from "./throttle.js";

const USER_AGENT_HEADERS = {
  "user-agent": "WantToGo/1.0 (https://go.schiemann.work)",
  Referer: "https://go.schiemann.work",
};

// Each provider is a courtesy-hosted public API (no API key) — keep calls to
// at most one per second, shared across all requests/processes.
const MIN_CALL_INTERVAL_MS = 1000;

export interface GeocodeProvider {
  name: string;
  search(query: string): Promise<UnifiedGeocodeResult[]>;
  reverse(latitude: number, longitude: number): Promise<UnifiedGeocodeResult>;
}

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

const nominatimProvider: GeocodeProvider = {
  name: "nominatim",

  async search(query) {
    await throttle(this.name, MIN_CALL_INTERVAL_MS);

    const searchUrl = new URL("https://nominatim.openstreetmap.org/search");
    searchUrl.searchParams.set("format", "jsonv2");
    searchUrl.searchParams.set("addressdetails", "1");
    searchUrl.searchParams.set("limit", "8");
    searchUrl.searchParams.set("q", query);

    console.debug("Nominatim search URL:", searchUrl.toString());
    const res = await fetch(searchUrl, { headers: USER_AGENT_HEADERS });
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

    const data = (await res.json()) as any[];
    return data.map((entry) => ({
      name: entry.name ?? entry.display_name ?? query,
      displayName: entry.display_name ?? entry.name ?? query,
      latitude: Number(entry.lat),
      longitude: Number(entry.lon),
      countryCode: entry.address?.country_code?.toUpperCase(),
    }));
  },

  async reverse(latitude, longitude) {
    await throttle(this.name, MIN_CALL_INTERVAL_MS);

    const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    reverseUrl.searchParams.set("format", "jsonv2");
    reverseUrl.searchParams.set("addressdetails", "1");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));

    console.debug("Nominatim reverse URL:", reverseUrl.toString());
    const res = await fetch(reverseUrl, { headers: USER_AGENT_HEADERS });
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

    const entry = (await res.json()) as any;
    const displayName = entry.display_name ?? entry.name ?? "Dropped pin";
    return {
      name: getRegionName(entry.address, displayName),
      displayName,
      latitude,
      longitude,
      countryCode: entry.address?.country_code?.toUpperCase(),
    };
  },
};

const photonProvider: GeocodeProvider = {
  name: "photon",

  async search(query) {
    await throttle(this.name, MIN_CALL_INTERVAL_MS);

    const searchUrl = new URL("https://photon.komoot.io/api/");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("limit", "8");

    console.debug("Photon search URL:", searchUrl.toString());
    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error(`Photon error ${res.status}`);

    const data = (await res.json()) as { features: any[] };
    return data.features.map((feature) => {
      const props = feature.properties;
      const name = props.name ?? props.city ?? props.country ?? query;
      const displayParts = [
        props.name,
        props.city,
        props.postcode,
        props.country,
      ].filter(Boolean);
      return {
        name,
        displayName: displayParts.join(", ") || name,
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        countryCode: props.countrycode?.toUpperCase(),
      };
    });
  },

  async reverse(latitude, longitude) {
    await throttle(this.name, MIN_CALL_INTERVAL_MS);

    const reverseUrl = new URL("https://photon.komoot.io/reverse");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));

    console.debug("Photon reverse URL:", reverseUrl.toString());
    const res = await fetch(reverseUrl);
    if (!res.ok) throw new Error(`Photon error ${res.status}`);

    const data = (await res.json()) as { features: any[] };
    if (!data.features.length) throw new Error("No results");

    const props = data.features[0].properties;
    const name = props.name ?? props.city ?? props.country ?? "Dropped pin";
    const displayParts = [
      props.name,
      props.city,
      props.postcode,
      props.country,
    ].filter(Boolean);
    return {
      name,
      displayName: displayParts.join(", ") || name,
      latitude,
      longitude,
      countryCode: props.countrycode?.toUpperCase(),
    };
  },
};

// Order also doubles as the round-robin rotation order.
export const geocodeProviders: GeocodeProvider[] = [
  nominatimProvider,
  photonProvider,
];

let nextProviderIndex = 0;

function takeNextStartIndex(): number {
  const index = nextProviderIndex;
  nextProviderIndex = (nextProviderIndex + 1) % geocodeProviders.length;
  return index;
}

/**
 * Tries each geocode provider in round-robin order, starting from the next
 * provider in rotation, falling back to the others in order if one throws.
 * Returns null if every provider failed.
 */
export async function withGeocodeFallback<T>(
  call: (provider: GeocodeProvider) => Promise<T>,
): Promise<T | null> {
  const startIndex = takeNextStartIndex();
  const order = geocodeProviders.map(
    (_, offset) =>
      geocodeProviders[(startIndex + offset) % geocodeProviders.length],
  );

  for (const provider of order) {
    try {
      return await call(provider);
    } catch (err) {
      console.warn(`Geocode provider "${provider.name}" failed, trying next...`, err);
    }
  }

  return null;
}
