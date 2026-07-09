import { getContinent } from '$lib/dashboard/continents';
import type { PlacePayload, PlaceRecord, PlaceSearchResult } from '$lib/types';

export type MapSelection = {
	name: string;
	displayName?: string;
	latitude: number;
	longitude: number;
	countryCode?: string;
};

export type PlaceDraft = {
	name: string;
	description: string;
	imageUrls: string;
	socialUrls: string;
	listId: string;
};

export function getUserInitial(username: string | null | undefined): string {
	return (username?.charAt(0) ?? '?').toUpperCase();
}

export function formatCoordinate(value: number, digits = 4): string {
	return value.toFixed(digits);
}

export function createEmptyPlaceDraft(listId = ''): PlaceDraft {
	return {
		name: '',
		description: '',
		imageUrls: '',
		socialUrls: '',
		listId
	};
}

export function createPlaceDraft(
	place: Pick<PlaceRecord, 'name' | 'description' | 'imageUrls' | 'socialUrls'> | PlaceSearchResult,
	listId = ''
): PlaceDraft {
	return {
		name: place.name,
		description: 'description' in place ? (place.description ?? '') : '',
		imageUrls: 'imageUrls' in place && place.imageUrls ? place.imageUrls.join('\n') : '',
		socialUrls: 'socialUrls' in place && place.socialUrls ? place.socialUrls.join('\n') : '',
		listId
	};
}

export function createPinnedSelection(
	latitude: number,
	longitude: number,
	name = 'New place',
	countryCode?: string
): MapSelection {
	return {
		name,
		displayName: 'Dropped pin',
		latitude,
		longitude,
		countryCode
	};
}

export function buildPlacePayload(
	selection: MapSelection | null,
	draft: PlaceDraft
): PlacePayload | null {
	if (!selection || !draft.listId) {
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
		listId: draft.listId,
		description: draft.description.trim() ? draft.description.trim() : null,
		countryCode: selection.countryCode ?? null,
		imageUrls: parseUrlList(draft.imageUrls),
		socialUrls: parseUrlList(draft.socialUrls)
	};
}

export function filterPlaces(
	items: PlaceRecord[],
	filters: { listId: string | null; countryCode: string | null; continent: string | null }
): PlaceRecord[] {
	return items.filter((place) => {
		if (filters.listId && place.listId !== filters.listId) {
			return false;
		}

		if (filters.countryCode && place.countryCode !== filters.countryCode) {
			return false;
		}

		if (filters.continent && getContinent(place.countryCode) !== filters.continent) {
			return false;
		}

		return true;
	});
}

export function parseUrlList(value: string): string[] | null {
	const urls = value
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	return urls.length ? urls : null;
}

const urlPattern = /https?:\/\/[^\s]+/g;

export function extractUrls(text: string): string[] {
	return [...text.matchAll(urlPattern)].map((match) => match[0]);
}

export function appendLines(existing: string, values: string[]): string {
	const lines = existing
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	for (const value of values) {
		if (!lines.includes(value)) {
			lines.push(value);
		}
	}

	return lines.join('\n');
}

export function removeLine(existing: string, value: string): string {
	return existing
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && line !== value)
		.join('\n');
}

export function getUrlDomain(url: string): string {
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return url;
	}
}

export function countryCodeToFlagEmoji(countryCode: string | null | undefined): string | null {
	if (!countryCode || countryCode.length !== 2) {
		return null;
	}

	const codePoints = [...countryCode.toUpperCase()].map(
		(char) => 127397 + char.charCodeAt(0)
	);

	return String.fromCodePoint(...codePoints);
}
