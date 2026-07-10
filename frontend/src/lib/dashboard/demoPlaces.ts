import type { PlaceRecord } from '$lib/types';

interface DemoDestination {
	name: string;
	latitude: number;
	longitude: number;
	countryCode: string;
	description: string;
	tags: string[];
}

// A pool of well-known destinations used to seed the landing page demo map.
// A random subset is picked client-side on every page load.
const DEMO_DESTINATIONS: DemoDestination[] = [
	{
		name: 'Eiffel Tower',
		latitude: 48.8584,
		longitude: 2.2945,
		countryCode: 'fr',
		description: 'Iconic iron landmark overlooking the Seine.',
		tags: ['city', 'landmark']
	},
	{
		name: 'Santorini',
		latitude: 36.3932,
		longitude: 25.4615,
		countryCode: 'gr',
		description: 'Whitewashed villages perched above the caldera.',
		tags: ['beach', 'island']
	},
	{
		name: 'Kyoto',
		latitude: 35.0116,
		longitude: 135.7681,
		countryCode: 'jp',
		description: 'Temples, gardens, and quiet backstreets.',
		tags: ['culture', 'city']
	},
	{
		name: 'Machu Picchu',
		latitude: -13.1631,
		longitude: -72.545,
		countryCode: 'pe',
		description: 'Incan citadel high in the Andes.',
		tags: ['mountain', 'history']
	},
	{
		name: 'Banff National Park',
		latitude: 51.4968,
		longitude: -115.9281,
		countryCode: 'ca',
		description: 'Turquoise lakes ringed by the Rockies.',
		tags: ['nature', 'mountain']
	},
	{
		name: 'Great Barrier Reef',
		latitude: -18.2871,
		longitude: 147.6992,
		countryCode: 'au',
		description: "The world's largest coral reef system.",
		tags: ['beach', 'nature']
	},
	{
		name: 'Marrakech',
		latitude: 31.6295,
		longitude: -7.9811,
		countryCode: 'ma',
		description: 'Bustling souks and centuries-old medinas.',
		tags: ['city', 'culture']
	},
	{
		name: 'Reykjavik',
		latitude: 64.1466,
		longitude: -21.9426,
		countryCode: 'is',
		description: 'Gateway to glaciers, geysers, and the northern lights.',
		tags: ['nature', 'city']
	},
	{
		name: 'Cape Town',
		latitude: -33.9249,
		longitude: 18.4241,
		countryCode: 'za',
		description: 'Table Mountain meets the Atlantic coastline.',
		tags: ['city', 'nature']
	},
	{
		name: 'New York City',
		latitude: 40.7128,
		longitude: -74.006,
		countryCode: 'us',
		description: 'Skyscrapers, museums, and a park in the middle of it all.',
		tags: ['city', 'food']
	},
	{
		name: 'Bali',
		latitude: -8.3405,
		longitude: 115.092,
		countryCode: 'id',
		description: 'Rice terraces, temples, and surf breaks.',
		tags: ['beach', 'nature']
	},
	{
		name: 'Petra',
		latitude: 30.3285,
		longitude: 35.4444,
		countryCode: 'jo',
		description: 'A rose-red city carved into desert cliffs.',
		tags: ['history', 'landmark']
	},
	{
		name: 'Venice',
		latitude: 45.4408,
		longitude: 12.3155,
		countryCode: 'it',
		description: 'Canals, gondolas, and centuries of art.',
		tags: ['city', 'culture']
	},
	{
		name: 'Dubrovnik',
		latitude: 42.6507,
		longitude: 18.0944,
		countryCode: 'hr',
		description: 'Marble streets inside a medieval city wall.',
		tags: ['city', 'beach']
	},
	{
		name: 'Queenstown',
		latitude: -45.0312,
		longitude: 168.6626,
		countryCode: 'nz',
		description: 'Adventure sports on the shores of an alpine lake.',
		tags: ['mountain', 'nature']
	},
	{
		name: 'Salar de Uyuni',
		latitude: -20.1338,
		longitude: -67.4891,
		countryCode: 'bo',
		description: "The world's largest salt flat, mirror-flat after rain.",
		tags: ['nature']
	},
	{
		name: 'Serengeti',
		latitude: -2.3333,
		longitude: 34.8333,
		countryCode: 'tz',
		description: 'Endless plains and the great wildebeest migration.',
		tags: ['nature']
	},
	{
		name: 'Lisbon',
		latitude: 38.7223,
		longitude: -9.1393,
		countryCode: 'pt',
		description: 'Hillside trams, pastel facades, and the Atlantic light.',
		tags: ['city', 'food']
	},
	{
		name: 'Ha Long Bay',
		latitude: 20.9101,
		longitude: 107.1839,
		countryCode: 'vn',
		description: 'Thousands of limestone karsts rising from the sea.',
		tags: ['nature', 'beach']
	},
	{
		name: 'Iceland Ring Road',
		latitude: 64.9631,
		longitude: -19.0208,
		countryCode: 'is',
		description: 'Waterfalls, black beaches, and volcanic landscapes.',
		tags: ['nature', 'mountain']
	},
	{
		name: 'Kyiv',
		latitude: 50.4501,
		longitude: 30.5234,
		countryCode: 'ua',
		description: 'Golden-domed churches above the Dnipro river.',
		tags: ['city', 'culture']
	},
	{
		name: 'Chefchaouen',
		latitude: 35.1688,
		longitude: -5.2636,
		countryCode: 'ma',
		description: 'A hillside town painted almost entirely blue.',
		tags: ['city', 'culture']
	},
	{
		name: 'Sydney',
		latitude: -33.8688,
		longitude: 151.2093,
		countryCode: 'au',
		description: 'Harbour views from the Opera House to Bondi Beach.',
		tags: ['city', 'beach']
	},
	{
		name: 'Istanbul',
		latitude: 41.0082,
		longitude: 28.9784,
		countryCode: 'tr',
		description: 'Where continents and centuries meet.',
		tags: ['city', 'culture']
	}
];

function shuffle<T>(items: T[]): T[] {
	const copy = [...items];

	for (let i = copy.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}

	return copy;
}

export function pickRandomDemoPlaces(count = 10): PlaceRecord[] {
	const now = new Date().toISOString();

	return shuffle(DEMO_DESTINATIONS)
		.slice(0, count)
		.map((destination, index) => ({
			id: `demo-${index}`,
			userId: 'demo',
			listId: 'demo',
			name: destination.name,
			latitude: destination.latitude,
			longitude: destination.longitude,
			description: destination.description,
			countryCode: destination.countryCode,
			imageUrls: null,
			socialUrls: null,
			tags: destination.tags,
			visits: [],
			createdAt: now
		}));
}
