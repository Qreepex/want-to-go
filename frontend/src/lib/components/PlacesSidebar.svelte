<script lang="ts">
	import Select from '$lib/components/ui/Select.svelte';
	import { CONTINENTS } from '$lib/dashboard/continents';
	import { countryCodeToFlagEmoji, filterPlaces } from '$lib/dashboard/helpers';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { listsStore } from '$lib/state/lists.svelte';
	import { placeFilters } from '$lib/state/placeFilters.svelte';
	import { placesStore } from '$lib/state/places.svelte';
	import SavedPlace from './SavedPlace.svelte';

	let open = $state(true);
	let query = $state('');

	const visiblePlaces = $derived(filterPlaces(placesStore.items, placeFilters));

	const listOptions = $derived([
		{ value: '', label: 'All lists' },
		...listsStore.items.map((list) => ({ value: list.id, label: list.name }))
	]);

	const countryOptions = $derived([
		{ value: '', label: 'All countries' },
		...[...new Set(placesStore.items.map((place) => place.countryCode).filter(Boolean))]
			.sort()
			.map((code) => ({
				value: code as string,
				label: `${countryCodeToFlagEmoji(code) ?? ''} ${code}`.trim()
			}))
	]);

	const continentOptions = $derived([
		{ value: '', label: 'All continents' },
		...CONTINENTS.map((continent) => ({ value: continent.code, label: continent.name }))
	]);
</script>

<div class="pointer-events-auto">
	<Panel floating tight class="overflow-hidden">
		<div class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left">
			<h2 class="text-base font-semibold text-(--text) whitespace-nowrap">Marked places</h2>
			<input
				type="text"
				placeholder="Search..."
				class="w-full border-(--border) border-b-2 border-0 text-sm text-(--text) outline-none placeholder:text-(--muted-dim)"
				oninput={(event) => {
					query = event.currentTarget.value.trim();
					event.stopPropagation();
				}}
			/>
		</div>
		{#if open}
			<div class="grid grid-cols-3 gap-2 border-t border-(--border) px-3 py-2">
				<Select
					options={listOptions}
					bind:value={() => placeFilters.listId ?? '', (value) => (placeFilters.listId = value || null)}
				/>
				<Select
					options={countryOptions}
					bind:value={
						() => placeFilters.countryCode ?? '',
						(value) => (placeFilters.countryCode = value || null)
					}
				/>
				<Select
					options={continentOptions}
					bind:value={
						() => placeFilters.continent ?? '',
						(value) => (placeFilters.continent = value || null)
					}
				/>
			</div>
			<div class="max-h-[calc(100vh-15rem)] overflow-y-auto border-t border-(--border) p-2">
				{#each visiblePlaces as place (place.id)}
					{#if !query || place.name.toLowerCase().includes(query.toLowerCase())}
						<SavedPlace {place} />
					{/if}
				{/each}
				{#if visiblePlaces.length === 0}
					<p class="px-3 py-4 text-sm text-(--muted-dim)">No saved places yet.</p>
				{/if}
			</div>
		{/if}
	</Panel>
</div>
