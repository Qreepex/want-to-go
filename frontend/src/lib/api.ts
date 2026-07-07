import type { PlacePayload, PlaceRecord, PlaceSearchResult, UserProfile } from './types';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
const tokenStorageKey = 'want-to-go.auth-token';

export function getStoredToken(): string | null {
	if (typeof localStorage === 'undefined') {
		return null;
	}

	return localStorage.getItem(tokenStorageKey);
}

export function setStoredToken(token: string): void {
	localStorage.setItem(tokenStorageKey, token);
}

export function clearStoredToken(): void {
	localStorage.removeItem(tokenStorageKey);
}

async function apiRequest<T>(
	path: string,
	token: string | null,
	init: RequestInit = {}
): Promise<T> {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		...init,
		headers: {
			'content-type': 'application/json',
			...(token ? { authorization: `Bearer ${token}` } : {}),
			...(init.headers ?? {})
		}
	});

	if (!response.ok) {
		const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
		throw new Error(errorBody?.error ?? `Request failed with status ${response.status}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return (await response.json()) as T;
}

export function loginUrl(): string {
	return `${apiBaseUrl}/auth/login`;
}

export function getBackendUrl(): string {
	return apiBaseUrl;
}

export function parseUrlList(value: string): string[] {
	return value
		.split(/\r?\n|,/)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

export async function fetchCurrentUser(token: string): Promise<UserProfile> {
	const result = await apiRequest<{ user: UserProfile }>('/auth/me', token);
	return result.user;
}

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

export async function searchLocations(query: string): Promise<PlaceSearchResult[]> {
	const result = await apiRequest<{ results: PlaceSearchResult[] }>(
		`/geo/search?q=${encodeURIComponent(query)}`,
		null,
		{
			method: 'GET'
		}
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
		{
			method: 'GET'
		}
	);
}
