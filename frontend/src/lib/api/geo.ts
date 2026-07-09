import type { PlaceSearchResult } from '$lib/types';
import { apiRequest } from './client';
import { createThrottle } from './throttle';

// The backend applies a shared 1-req/sec-per-user limit across /geo/search
// and /geo/reverse; throttle client-side so bursts (fast typing, repeated
// map clicks) don't trip it and get temporarily banned.
const throttleGeoRequest = createThrottle(1000);

export async function searchLocations(query: string): Promise<PlaceSearchResult[]> {
	const result = await throttleGeoRequest(() =>
		apiRequest<{ results: PlaceSearchResult[] }>(
			`/geo/search?q=${encodeURIComponent(query)}`,
			null,
			{ method: 'GET' }
		)
	);

	return result.results;
}

export async function reverseGeocodeLocation(
	latitude: number,
	longitude: number
): Promise<PlaceSearchResult> {
	return throttleGeoRequest(() =>
		apiRequest<PlaceSearchResult>(
			`/geo/reverse?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
			null,
			{ method: 'GET' }
		)
	);
}
