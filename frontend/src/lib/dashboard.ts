import type { PlacePayload, PlaceRecord, PlaceSearchResult } from '$lib/types';

export type MapSelection = {
	name: string;
	displayName?: string;
	latitude: number;
	longitude: number;
};

export type PlaceDraft = {
	name: string;
	description: string;
	imageUrls: string;
	socialUrls: string;
};

export function getUserInitial(username: string | null | undefined): string {
	return (username?.charAt(0) ?? '?').toUpperCase();
}

export function formatCoordinate(value: number, digits = 4): string {
	return value.toFixed(digits);
}

export function createEmptyPlaceDraft(): PlaceDraft {
	return {
		name: '',
		description: '',
		imageUrls: '',
		socialUrls: ''
	};
}

export function createPlaceDraft(
	place: Pick<PlaceRecord, 'name' | 'description' | 'imageUrls' | 'socialUrls'> | PlaceSearchResult
): PlaceDraft {
	return {
		name: place.name,
		description: 'description' in place ? (place.description ?? '') : '',
		imageUrls: 'imageUrls' in place && place.imageUrls ? place.imageUrls.join('\n') : '',
		socialUrls: 'socialUrls' in place && place.socialUrls ? place.socialUrls.join('\n') : ''
	};
}

export function createPinnedSelection(
	latitude: number,
	longitude: number,
	name = 'New place'
): MapSelection {
	return {
		name,
		displayName: 'Dropped pin',
		latitude,
		longitude
	};
}

export function buildPlacePayload(
	selection: MapSelection | null,
	draft: PlaceDraft
): PlacePayload | null {
	if (!selection) {
		return null;
	}

	const finalName = draft.name.trim() || selection.name;

	if (!finalName) {
		return null;
	}

	return {
		name: finalName,
		latitude: selection.latitude,
		longitude: selection.longitude,
		description: draft.description.trim() ? draft.description.trim() : null,
		imageUrls: parseUrlList(draft.imageUrls),
		socialUrls: parseUrlList(draft.socialUrls)
	};
}

export function parseUrlList(value: string): string[] | null {
	const urls = value
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	return urls.length ? urls : null;
}
