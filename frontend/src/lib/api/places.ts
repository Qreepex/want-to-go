import type { PlacePayload, PlaceRecord } from '$lib/types';
import { apiRequest } from './client';

export async function fetchPlaces(token: string): Promise<PlaceRecord[]> {
	const result = await apiRequest<{ places: PlaceRecord[] }>('/places', token);
	return result.places;
}

export async function createPlace(token: string, payload: PlacePayload): Promise<PlaceRecord> {
	const result = await apiRequest<{ place: PlaceRecord }>('/places', token, {
		method: 'POST',
		body: JSON.stringify(payload)
	});
	return result.place;
}

export async function updatePlace(
	token: string,
	placeId: string,
	payload: PlacePayload
): Promise<PlaceRecord> {
	const result = await apiRequest<{ place: PlaceRecord }>(`/places/${placeId}`, token, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
	return result.place;
}

export async function deletePlace(token: string, placeId: string): Promise<void> {
	await apiRequest<void>(`/places/${placeId}`, token, {
		method: 'DELETE'
	});
}
