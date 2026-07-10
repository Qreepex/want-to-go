import { consumeDailyQuota } from "./daily-limit.js";
import { throttle } from "./throttle.js";
import { NominatimAddress, UnifiedGeocodeResult } from "./types.js";

const USER_AGENT_HEADERS = {
  "user-agent": "WantToGo/1.0 (https://go.schiemann.work)",
  Referer: "https://go.schiemann.work",
};

// Each provider is a courtesy-hosted public API (no API key) - keep calls to
// at most one per second, shared across all requests/processes.
const MIN_CALL_INTERVAL_MS = 1000;

// Geoapify is metered (unlike the courtesy Nominatim/Photon instances), so
// cap total calls across all requests/processes at its free-tier daily quota.
const GEOAPIFY_DAILY_LIMIT = 3000;

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

    const res = await fetch(searchUrl, { headers: USER_AGENT_HEADERS });
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

    const data = (await res.json()) as any[];
    return data
      .filter((entry) => entry.address?.country_code)
      .map((entry) => ({
        name: entry.name ?? entry.display_name ?? query,
        displayName: entry.display_name ?? entry.name ?? query,
        latitude: Number(entry.lat),
        longitude: Number(entry.lon),
        countryCode: entry.address.country_code.toUpperCase(),
      }));
  },

  async reverse(latitude, longitude) {
    await throttle(this.name, MIN_CALL_INTERVAL_MS);

    const reverseUrl = new URL("https://nominatim.openstreetmap.org/reverse");
    reverseUrl.searchParams.set("format", "jsonv2");
    reverseUrl.searchParams.set("addressdetails", "1");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));

    const res = await fetch(reverseUrl, { headers: USER_AGENT_HEADERS });
    if (!res.ok) throw new Error(`Nominatim error ${res.status}`);

    const entry = (await res.json()) as any;
    const countryCode = entry.address?.country_code;
    if (!countryCode) throw new Error("Nominatim result has no country code");

    const displayName = entry.display_name ?? entry.name ?? "Dropped pin";
    return {
      name: getRegionName(entry.address, displayName),
      displayName,
      latitude,
      longitude,
      countryCode: countryCode.toUpperCase(),
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

    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error(`Photon error ${res.status}`);

    const data = (await res.json()) as { features: any[] };
    return data.features
      .filter((feature) => feature.properties.countrycode)
      .map((feature) => {
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
          countryCode: props.countrycode.toUpperCase(),
        };
      });
  },

  async reverse(latitude, longitude) {
    await throttle(this.name, MIN_CALL_INTERVAL_MS);

    const reverseUrl = new URL("https://photon.komoot.io/reverse");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));

    const res = await fetch(reverseUrl);
    if (!res.ok) throw new Error(`Photon error ${res.status}`);

    const data = (await res.json()) as { features: any[] };
    const entry = data.features.find(
      (feature) => feature.properties.countrycode,
    );
    if (!entry) throw new Error("No results with a country code");

    const props = entry.properties;
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
      countryCode: props.countrycode.toUpperCase(),
    };
  },
};

function getGeoapifyApiKey(): string {
  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    throw new Error("GEOAPIFY_API_KEY environment variable is not set");
  }

  return apiKey;
}

function getGeoapifyRegionName(entry: any, fallback: string): string {
  return (
    entry.city ??
    entry.town ??
    entry.village ??
    entry.hamlet ??
    entry.suburb ??
    entry.neighbourhood ??
    entry.county ??
    entry.state ??
    entry.country ??
    fallback
  );
}

const geoapifyProvider: GeocodeProvider = {
  name: "geoapify",

  async search(query) {
    const apiKey = getGeoapifyApiKey();
    await throttle(this.name, MIN_CALL_INTERVAL_MS);
    await consumeDailyQuota(this.name, GEOAPIFY_DAILY_LIMIT);

    const searchUrl = new URL("https://api.geoapify.com/v1/geocode/search");
    searchUrl.searchParams.set("text", query);
    searchUrl.searchParams.set("format", "json");
    searchUrl.searchParams.set("limit", "8");
    searchUrl.searchParams.set("apiKey", apiKey);

    const res = await fetch(searchUrl);
    if (!res.ok) throw new Error(`Geoapify error ${res.status}`);

    const data = (await res.json()) as { results: any[] };
    return data.results
      .filter((entry) => entry.country_code)
      .map((entry) => {
        const displayName = entry.formatted ?? entry.name ?? query;
        return {
          name: entry.name ?? getGeoapifyRegionName(entry, displayName),
          displayName,
          latitude: Number(entry.lat),
          longitude: Number(entry.lon),
          countryCode: entry.country_code.toUpperCase(),
        };
      });
  },

  async reverse(latitude, longitude) {
    const apiKey = getGeoapifyApiKey();
    await throttle(this.name, MIN_CALL_INTERVAL_MS);
    await consumeDailyQuota(this.name, GEOAPIFY_DAILY_LIMIT);

    const reverseUrl = new URL("https://api.geoapify.com/v1/geocode/reverse");
    reverseUrl.searchParams.set("lat", String(latitude));
    reverseUrl.searchParams.set("lon", String(longitude));
    reverseUrl.searchParams.set("format", "json");
    reverseUrl.searchParams.set("apiKey", apiKey);

    const res = await fetch(reverseUrl);
    if (!res.ok) throw new Error(`Geoapify error ${res.status}`);

    const data = (await res.json()) as { results: any[] };
    const entry = data.results.find((result) => result.country_code);
    if (!entry) throw new Error("No results with a country code");

    const displayName = entry.formatted ?? entry.name ?? "Dropped pin";
    return {
      name: entry.name ?? getGeoapifyRegionName(entry, displayName),
      displayName,
      latitude,
      longitude,
      countryCode: entry.country_code.toUpperCase(),
    };
  },
};

// Order also doubles as the round-robin rotation order.
export const geocodeProviders: GeocodeProvider[] = [
  nominatimProvider,
  photonProvider,
  geoapifyProvider,
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
 * Every result is required to carry a country code, so providers filter out
 * matches that lack one; an empty array is therefore also treated as a soft
 * failure and falls through to the next provider, rather than short-circuiting
 * a search that another provider could still answer. Returns null (or the
 * last empty array, for search) if every provider failed.
 */
export async function withGeocodeFallback<T>(
  call: (provider: GeocodeProvider) => Promise<T>,
): Promise<T | null> {
  const startIndex = takeNextStartIndex();
  const order = geocodeProviders.map(
    (_, offset) =>
      geocodeProviders[(startIndex + offset) % geocodeProviders.length],
  );

  let lastEmptyResult: T | null = null;

  for (const provider of order) {
    try {
      const result = await call(provider);

      if (Array.isArray(result) && result.length === 0) {
        lastEmptyResult = result;
        continue;
      }

      return result;
    } catch (err) {
      console.warn(
        `Geocode provider "${provider.name}" failed, trying next...`,
        err,
      );
    }
  }

  return lastEmptyResult;
}
