<script lang="ts">
	import type { PlaceRecord } from '$lib/types';
	import 'leaflet/dist/leaflet.css';
	import { onMount } from 'svelte';

	type MapSelection = {
		name: string;
		latitude: number;
		longitude: number;
	} | null;

	let {
		places = [],
		selection = null,
		focusPlace = null,
		onPick = () => {},
		onSelectPlace = () => {}
	} = $props<{
		places?: PlaceRecord[];
		selection?: MapSelection;
		focusPlace?: PlaceRecord | null;
		onPick?: (selection: { latitude: number; longitude: number }) => void;
		onSelectPlace?: (place: PlaceRecord) => void;
	}>();

	const FOCUS_ZOOM = 11;

	let container: HTMLDivElement | null = null;
	let map: import('leaflet').Map | null = null;
	let markerLayer: import('leaflet').LayerGroup | null = null;
	let leafletModule: typeof import('leaflet') | null = null;
	let lastFocusedPlace: PlaceRecord | null = null;

	onMount(() => {
		let active = true;

		const initializeMap = async () => {
			leafletModule = await import('leaflet');

			if (!active || !container) {
				return;
			}

			const maxLat = 85.0511287798;
			map = leafletModule
				.map(container, {
					zoomControl: false,
					preferCanvas: true,
					minZoom: 2,
					maxBounds: leafletModule.latLngBounds([-maxLat, -Infinity], [maxLat, Infinity]),
					maxBoundsViscosity: 1.0
				})
				.setView([20, 0], 2);
			leafletModule
				.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
					attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
					subdomains: 'abcd',
					maxZoom: 20
				})
				.addTo(map);
			markerLayer = leafletModule.layerGroup().addTo(map);

			map.on('click', (event) => {
				onPick({ latitude: event.latlng.lat, longitude: event.latlng.lng });
			});

			renderLayers();
		};

		void initializeMap();

		return () => {
			active = false;
			map?.remove();
			map = null;
			markerLayer = null;
		};
	});

	function renderLayers() {
		if (!map || !markerLayer || !leafletModule) {
			return;
		}

		markerLayer.clearLayers();

		const pinIcon = leafletModule.divIcon({
			className: '',
			html: '<div class="h-4 w-4 rounded-full border-2 border-(--ink) bg-(--muted) shadow-md shadow-black/50"></div>',
			iconSize: [16, 16],
			iconAnchor: [8, 8]
		});

		const activeIcon = leafletModule.divIcon({
			className: '',
			html: '<div class="h-5 w-5 rounded-full border-2 border-(--ink) bg-(--accent) shadow-lg shadow-black/60"></div>',
			iconSize: [20, 20],
			iconAnchor: [10, 10]
		});

		const bounds = leafletModule.latLngBounds([]);

		for (const place of places) {
			const thumbnailUrl = place.imageUrls?.[0];
			const icon = thumbnailUrl
				? leafletModule.divIcon({
						className: '',
						html: `<div class="h-9 w-9 overflow-hidden rounded-full border-2 border-(--ink) bg-(--muted) shadow-md shadow-black/50"><img src="${escapeHtml(thumbnailUrl)}" class="h-full w-full object-cover" /></div>`,
						iconSize: [36, 36],
						iconAnchor: [18, 18]
					})
				: pinIcon;

			const marker = leafletModule
				.marker([place.latitude, place.longitude], { icon })
				.addTo(markerLayer);
			marker.on('click', () => onSelectPlace(place));
			bounds.extend([place.latitude, place.longitude]);
		}

		if (selection) {
			leafletModule
				.marker([selection.latitude, selection.longitude], { icon: activeIcon })
				.addTo(markerLayer);
			bounds.extend([selection.latitude, selection.longitude]);
			map.setView([selection.latitude, selection.longitude], Math.max(map.getZoom(), 10), {
				animate: true
			});
		}

		if (bounds.isValid() && !selection) {
			map.fitBounds(bounds.pad(0.2), { animate: true });
		}
	}

	function escapeHtml(value: string): string {
		return value
			.replaceAll('&', '&amp;')
			.replaceAll('<', '&lt;')
			.replaceAll('>', '&gt;')
			.replaceAll('"', '&quot;')
			.replaceAll("'", '&#39;');
	}

	$effect(() => {
		places;
		selection;

		if (!leafletModule) {
			return;
		}

		renderLayers();
	});

	$effect(() => {
		const place = focusPlace;

		if (!map || !place || place === lastFocusedPlace) {
			return;
		}

		lastFocusedPlace = place;

		map.setView([place.latitude, place.longitude], FOCUS_ZOOM, { animate: true });
	});
</script>

<div bind:this={container} class="relative z-0 h-full w-full bg-(--ink)"></div>
