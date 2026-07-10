import { CONTINENTS, getContinent, getCountriesInContinent } from '$lib/dashboard/continents';
import { filterPlaces } from '$lib/dashboard/helpers';
import type { PlaceRecord } from '$lib/types';

export type WrappedFiltersInput = {
	year: number | 'all';
	countryCodes: string[];
	continents: string[];
	tags: string[];
};

export type CountEntry = { code: string; count: number };
export type NamedCountEntry = { code: string; name: string; count: number };
export type TagCountEntry = { tag: string; count: number };
export type MonthCountEntry = { month: number; name: string; count: number };
export type YearCountEntry = { year: number; count: number };

export type WrappedStats = {
	totalPlacesVisited: number;
	totalCountries: number;
	totalContinents: number;
	mostVisitedCountry: CountEntry | null;
	mostVisitedContinent: NamedCountEntry | null;
	mostVisitedPlace: { place: PlaceRecord; count: number } | null;
	topTags: TagCountEntry[];
	mostVisitedMonth: MonthCountEntry | null;
	monthBreakdown: MonthCountEntry[];
	yearBreakdown: YearCountEntry[];
	countryBreakdown: CountEntry[];
	continentBreakdown: NamedCountEntry[];
	visitedPlaces: PlaceRecord[];
};

const MONTH_NAMES = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];

export function getAvailableYears(places: PlaceRecord[]): number[] {
	const years = new Set<number>();

	for (const place of places) {
		for (const visit of place.visits) {
			years.add(Number(visit.visitedAt.slice(0, 4)));
		}
	}

	return [...years].sort((a, b) => b - a);
}

function continentName(code: string): string {
	return CONTINENTS.find((continent) => continent.code === code)?.name ?? code;
}

export function computeWrapped(places: PlaceRecord[], filters: WrappedFiltersInput): WrappedStats {
	const scoped = filterPlaces(places, {
		listIds: [],
		countryCodes: filters.countryCodes,
		continents: filters.continents,
		tags: filters.tags,
		visited: 'been'
	});

	const countryCounts = new Map<string, number>();
	const continentCounts = new Map<string, number>();
	const tagCounts = new Map<string, number>();
	const monthCounts = new Map<number, number>();
	const yearCounts = new Map<number, number>();
	const visitedPlaces: PlaceRecord[] = [];
	let mostVisitedPlace: { place: PlaceRecord; count: number } | null = null;

	for (const place of scoped) {
		const visitsInScope =
			filters.year === 'all'
				? place.visits
				: place.visits.filter((visit) => visit.visitedAt.slice(0, 4) === String(filters.year));

		if (visitsInScope.length === 0) {
			continue;
		}

		visitedPlaces.push(place);

		if (place.countryCode) {
			countryCounts.set(place.countryCode, (countryCounts.get(place.countryCode) ?? 0) + 1);
		}

		const continent = getContinent(place.countryCode);

		if (continent) {
			continentCounts.set(continent, (continentCounts.get(continent) ?? 0) + 1);
		}

		for (const tag of place.tags) {
			tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
		}

		if (!mostVisitedPlace || visitsInScope.length > mostVisitedPlace.count) {
			mostVisitedPlace = { place, count: visitsInScope.length };
		}

		for (const visit of visitsInScope) {
			const [year, month] = visit.visitedAt.split('-').map(Number);
			monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
			yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
		}
	}

	const countryBreakdown = [...countryCounts.entries()]
		.map(([code, count]) => ({ code, count }))
		.sort((a, b) => b.count - a.count);

	const continentBreakdown = [...continentCounts.entries()]
		.map(([code, count]) => ({ code, name: continentName(code), count }))
		.sort((a, b) => b.count - a.count);

	const topTags = [...tagCounts.entries()]
		.map(([tag, count]) => ({ tag, count }))
		.sort((a, b) => b.count - a.count);

	const monthBreakdownByCount = [...monthCounts.entries()]
		.map(([month, count]) => ({ month, name: MONTH_NAMES[month - 1], count }))
		.sort((a, b) => b.count - a.count);

	const monthBreakdown = MONTH_NAMES.map((name, index) => ({
		month: index + 1,
		name,
		count: monthCounts.get(index + 1) ?? 0
	}));

	const yearBreakdown = [...yearCounts.entries()]
		.map(([year, count]) => ({ year, count }))
		.sort((a, b) => b.count - a.count);

	return {
		totalPlacesVisited: visitedPlaces.length,
		totalCountries: countryCounts.size,
		totalContinents: continentCounts.size,
		mostVisitedCountry: countryBreakdown[0] ?? null,
		mostVisitedContinent: continentBreakdown[0] ?? null,
		mostVisitedPlace,
		topTags,
		mostVisitedMonth: monthBreakdownByCount[0] ?? null,
		monthBreakdown,
		yearBreakdown,
		countryBreakdown,
		continentBreakdown,
		visitedPlaces
	};
}

export function computeProgress(
	places: PlaceRecord[],
	visitedCountOverride?: number
): {
	visitedCount: number;
	wantToGoCount: number;
	totalCount: number;
} {
	const visitedCount =
		visitedCountOverride ?? places.filter((place) => place.visits.length > 0).length;

	return {
		visitedCount,
		wantToGoCount: places.length - visitedCount,
		totalCount: places.length
	};
}

export type ContinentCoverage = {
	code: string;
	name: string;
	visitedCountries: number;
	totalCountries: number;
};

export function computeContinentCoverage(places: PlaceRecord[]): ContinentCoverage[] {
	const visitedByContinent = new Map<string, Set<string>>();

	for (const place of places) {
		if (place.visits.length === 0 || !place.countryCode) {
			continue;
		}

		const continent = getContinent(place.countryCode);

		if (!continent) {
			continue;
		}

		const existing = visitedByContinent.get(continent) ?? new Set<string>();
		existing.add(place.countryCode);
		visitedByContinent.set(continent, existing);
	}

	return CONTINENTS.map((continent) => ({
		code: continent.code,
		name: continent.name,
		visitedCountries: visitedByContinent.get(continent.code)?.size ?? 0,
		totalCountries: getCountriesInContinent(continent.code).length
	}));
}
