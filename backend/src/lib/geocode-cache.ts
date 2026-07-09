import redis from "../cache/client.js";
import { getCoordinatesDataKey, getGeocodeCacheKey } from "./coordinates.js";
import { UnifiedGeocodeResult } from "./types.js";

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
export const REVERSE_SEARCH_RADIUS_METERS = 50;

function toGeocodeResult(
  hash: Record<string, string>,
): UnifiedGeocodeResult | null {
  if (!hash.name) return null;

  return {
    name: hash.name,
    displayName: hash.displayName,
    latitude: Number(hash.latitude),
    longitude: Number(hash.longitude),
    countryCode: hash.countryCode || undefined,
  };
}

export async function getCachedSearchResults(
  query: string,
): Promise<UnifiedGeocodeResult[]> {
  const locationIds = await redis.lrange(getGeocodeCacheKey(query), 0, -1);
  if (!locationIds.length) return [];

  const hashes = await Promise.all(
    locationIds.map((id) => redis.hgetall(`geo:data:${id}`)),
  );

  return hashes
    .map(toGeocodeResult)
    .filter((result): result is UnifiedGeocodeResult => result !== null);
}

export async function cacheSearchResults(
  query: string,
  results: UnifiedGeocodeResult[],
): Promise<void> {
  const searchQueryKey = getGeocodeCacheKey(query);
  const pipeline = redis.pipeline();

  // Overwrite any previous (now stale) result list for this query.
  pipeline.del(searchQueryKey);

  for (const result of results) {
    const locationId = getCoordinatesDataKey(result.latitude, result.longitude);
    pipeline.rpush(searchQueryKey, locationId);
    cacheLocation(pipeline, locationId, result);
  }

  pipeline.expire(searchQueryKey, CACHE_TTL_SECONDS);

  await pipeline.exec();
}

export async function getCachedReverseResult(
  latitude: number,
  longitude: number,
): Promise<UnifiedGeocodeResult | null> {
  const nearby = await redis.geosearch(
    "geo:index",
    "FROMLONLAT",
    longitude,
    latitude,
    "BYRADIUS",
    REVERSE_SEARCH_RADIUS_METERS,
    "m",
    "WITHDIST",
    "ASC",
  );

  if (!nearby.length) return null;

  const closestLocationId = (nearby[0] as unknown[])[0];
  const hash = await redis.hgetall(`geo:data:${closestLocationId}`);
  return toGeocodeResult(hash);
}

export async function cacheReverseResult(
  result: UnifiedGeocodeResult,
): Promise<void> {
  const locationId = getCoordinatesDataKey(result.latitude, result.longitude);
  const pipeline = redis.pipeline();
  cacheLocation(pipeline, locationId, result);
  await pipeline.exec();
}

// Shared by both cache-write paths: records a location's coordinates in the
// GEO index (used by /reverse map clicks) and its details in a data hash.
function cacheLocation(
  pipeline: ReturnType<typeof redis.pipeline>,
  locationId: string,
  result: UnifiedGeocodeResult,
): void {
  const hashKey = `geo:data:${locationId}`;

  pipeline.geoadd("geo:index", result.longitude, result.latitude, locationId);
  pipeline.hset(hashKey, {
    name: result.name,
    displayName: result.displayName,
    latitude: String(result.latitude),
    longitude: String(result.longitude),
    countryCode: result.countryCode ?? "",
  });
  pipeline.expire(hashKey, CACHE_TTL_SECONDS);
}
