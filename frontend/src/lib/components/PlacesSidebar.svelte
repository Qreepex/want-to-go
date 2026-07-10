<script lang="ts">
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { CONTINENTS, getContinent } from '$lib/dashboard/continents';
	import { filterPlaces, getAllTags } from '$lib/dashboard/helpers';
	import { listsStore } from '$lib/state/lists.svelte';
	import { placeFilters } from '$lib/state/placeFilters.svelte';
	import { placesStore } from '$lib/state/places.svelte';
	import SavedPlace from './SavedPlace.svelte';

	let open = $state(true);
	let query = $state('');

	const visiblePlaces = $derived(filterPlaces(placesStore.items, placeFilters));

	const listOptions = $derived(
		listsStore.items.map((list) => ({ value: list.id, label: list.name }))
	);

	const countryOptions = $derived(
		[
			...new Set(
				placesStore.items
					.filter((place) => !!place.countryCode && !place.visits.length)
					.map((place) => place.countryCode)
			)
		]
			.sort()
			.map((code) => ({
				value: code as string,
				label: code as string,
				icon: code as string
			}))
	);

	const usedContinentCodes = $derived(
		new Set(
			placesStore.items
				.filter((place) => !!place.countryCode && !place.visits.length)
				.map((place) => getContinent(place.countryCode))
				.filter((continent): continent is string => Boolean(continent))
		)
	);

	const continentOptions = $derived(
		CONTINENTS.filter((continent) => usedContinentCodes.has(continent.code)).map((continent) => ({
			value: continent.code,
			label: continent.name
		}))
	);

	const allTags = $derived(getAllTags(placesStore.items));
</script>

<div class="pointer-events-auto flex min-h-0 flex-1 flex-col">
	<Panel floating tight class="flex min-h-0 flex-1 flex-col overflow-hidden">
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
				<MultiSelect
					placeholder="All lists"
					options={listOptions}
					bind:value={placeFilters.listIds}
				/>
				<MultiSelect
					placeholder="All countries"
					options={countryOptions}
					bind:value={placeFilters.countryCodes}
				/>
				<MultiSelect
					placeholder="All continents"
					options={continentOptions}
					bind:value={placeFilters.continents}
				/>
			</div>
			{#if allTags.length}
				<div class="flex flex-wrap gap-1.5 border-t border-(--border) px-3 py-2">
					{#each allTags as tag (tag)}
						{@const isActive = placeFilters.tags.includes(tag)}
						<button
							type="button"
							onclick={() => placeFilters.toggleTag(tag)}
							class="rounded-full border px-2.5 py-0.5 text-xs transition {isActive
								? 'border-(--accent) bg-(--accent-soft) text-(--accent-strong)'
								: 'border-(--border) bg-white/3 text-(--muted) hover:border-(--border-strong)'}"
						>
							{tag}
						</button>
					{/each}
				</div>
			{/if}
			<div class="min-h-0 flex-1 overflow-y-auto border-t border-(--border) p-2">
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
