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
	tags: string[];
	alreadyVisited: boolean;
	visitedAt: string;
	visitNotes: string;
};

function today(): string {
	return new Date().toISOString().slice(0, 10);
}

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
		listId,
		tags: [],
		alreadyVisited: false,
		visitedAt: today(),
		visitNotes: ''
	};
}

export function createPlaceDraft(
	place:
		| Pick<PlaceRecord, 'name' | 'description' | 'imageUrls' | 'socialUrls' | 'tags'>
		| PlaceSearchResult,
	listId = ''
): PlaceDraft {
	return {
		name: place.name,
		description: 'description' in place ? (place.description ?? '') : '',
		imageUrls: 'imageUrls' in place && place.imageUrls ? place.imageUrls.join('\n') : '',
		socialUrls: 'socialUrls' in place && place.socialUrls ? place.socialUrls.join('\n') : '',
		listId,
		tags: 'tags' in place && place.tags ? [...place.tags] : [],
		alreadyVisited: false,
		visitedAt: today(),
		visitNotes: ''
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
		socialUrls: parseUrlList(draft.socialUrls),
		tags: draft.tags
	};
}

export function filterPlaces(
	items: PlaceRecord[],
	filters: {
		listIds: string[];
		countryCodes: string[];
		continents: string[];
		tags: string[];
		visited: 'want-to-go' | 'been';
	}
): PlaceRecord[] {
	return items.filter((place) => {
		if (filters.visited === 'want-to-go' && place.visits.length > 0) {
			return false;
		}

		if (filters.visited === 'been' && place.visits.length === 0) {
			return false;
		}

		if (filters.listIds.length && !filters.listIds.includes(place.listId)) {
			return false;
		}

		if (
			filters.countryCodes.length &&
			(!place.countryCode || !filters.countryCodes.includes(place.countryCode))
		) {
			return false;
		}

		if (filters.continents.length) {
			const continent = getContinent(place.countryCode);

			if (!continent || !filters.continents.includes(continent)) {
				return false;
			}
		}

		if (filters.tags.length && !filters.tags.some((tag) => place.tags.includes(tag))) {
			return false;
		}

		return true;
	});
}

export function getAllTags(items: PlaceRecord[]): string[] {
	return [...new Set(items.flatMap((place) => place.tags))].sort();
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

const TRACKED_URL_HOSTS = ['tiktok.com', 'instagram.com'];

export function cleanSocialUrl(rawUrl: string): string {
	let url: URL;

	try {
		url = new URL(rawUrl);
	} catch {
		return rawUrl;
	}

	const hostname = url.hostname.replace(/^www\./, '');
	const isTracked = TRACKED_URL_HOSTS.some(
		(host) => hostname === host || hostname.endsWith(`.${host}`)
	);

	if (isTracked) {
		url.search = '';
		url.hash = '';
	}

	return url.toString();
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
