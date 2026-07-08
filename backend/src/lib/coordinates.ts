export function getCoordinatesCacheKey(
  latitude: number,
  longitude: number,
): string {
  const fixedLat = latitude.toFixed(3);
  const fixedLng = longitude.toFixed(3);

  return `geo:coords:${fixedLat}:${fixedLng}`;
}

export function getGeocodeCacheKey(query: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, "-");
  return `geo:search:${normalized}`;
}


export function getCoordinatesDataKey(latitude: number, longitude: number): string {
  const fixedLat = latitude.toFixed(3);
  const fixedLng = longitude.toFixed(3);

  return `${fixedLat}:${fixedLng}`;
}