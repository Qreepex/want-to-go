export function getCoordinatesCacheKey(
  latitude: number,
  longitude: number,
): string {
  const fixedLat = roundCoordinate(latitude);
  const fixedLng = roundCoordinate(longitude);

  return `geo:coords:${fixedLat}:${fixedLng}`;
}

export function getGeocodeCacheKey(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, "-");
  return `geo:search:${normalized}`;
}

export function getCoordinatesDataKey(
  latitude: number,
  longitude: number,
): string {
  const fixedLat = roundCoordinate(latitude);
  const fixedLng = roundCoordinate(longitude);

  return `${fixedLat}:${fixedLng}`;
}

export function roundCoordinate(coordinate: number): number {
  return Number(coordinate.toFixed(4));
}
