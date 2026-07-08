<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { placesStore } from '$lib/state/places.svelte';
	import SavedPlace from './SavedPlace.svelte';

	let open = $state(true);
</script>

<div class="pointer-events-auto">
	<Panel floating tight class="overflow-hidden">
		<button
			onclick={() => (open = !open)}
			class="flex w-full items-center justify-between px-4 py-3 text-left"
		>
			<h2 class="text-base font-semibold text-(--text)">Marked places</h2>
			<div class="flex items-center gap-3">
				<Badge>{placesStore.items.length}</Badge>
				<span class="text-(--muted)">{open ? '−' : '+'}</span>
			</div>
		</button>
		{#if open}
			<div class="max-h-[calc(100vh-15rem)] overflow-y-auto border-t border-(--border) p-2">
				{#each placesStore.items as place (place.id)}
					<SavedPlace {place} />
				{/each}
				{#if placesStore.items.length === 0}
					<p class="px-3 py-4 text-sm text-(--muted-dim)">No saved places yet.</p>
				{/if}
			</div>
		{/if}
	</Panel>
</div>
