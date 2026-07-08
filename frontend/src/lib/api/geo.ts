import type { PlaceSearchResult } from '$lib/types';
import { apiRequest } from './client';

export async function searchLocations(query: string): Promise<PlaceSearchResult[]> {
	const result = await apiRequest<{ results: PlaceSearchResult[] }>(
		`/geo/search?q=${encodeURIComponent(query)}`,
		null,
		{ method: 'GET' }
	);

	return result.results;
}

export async function reverseGeocodeLocation(
	latitude: number,
	longitude: number
): Promise<PlaceSearchResult> {
	return apiRequest<PlaceSearchResult>(
		`/geo/reverse?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
		null,
		{ method: 'GET' }
	);
}
