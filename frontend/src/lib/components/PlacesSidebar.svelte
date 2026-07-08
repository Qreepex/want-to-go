<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import { placesStore } from '$lib/state/places.svelte';
	import SavedPlace from './SavedPlace.svelte';

	let open = $state(true);
	let query = $state('');
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
			<div class="max-h-[calc(100vh-15rem)] overflow-y-auto border-t border-(--border) p-2">
				{#each placesStore.items as place (place.id)}
					{#if !query || place.name.toLowerCase().includes(query.toLowerCase())}
						<SavedPlace {place} />
					{/if}
				{/each}
				{#if placesStore.items.length === 0}
					<p class="px-3 py-4 text-sm text-(--muted-dim)">No saved places yet.</p>
				{/if}
			</div>
		{/if}
	</Panel>
</div>
