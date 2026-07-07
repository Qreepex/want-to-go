<script lang="ts">
	import type { PlaceRecord } from '$lib/types';
	import SavedPlace from './SavedPlace.svelte';

	let {
		places = [],
		onEdit = () => {},
		onDelete = () => {}
	} = $props<{
		places?: PlaceRecord[];
		onEdit?: (place: PlaceRecord) => void;
		onDelete?: (place: PlaceRecord) => void;
	}>();

	let open = $state(true);
</script>

<section
	class="pointer-events-auto overflow-hidden rounded-3xl border border-white/10 bg-(--panel) shadow-2xl shadow-black/40 backdrop-blur"
>
	<button
		onclick={() => (open = !open)}
		class="flex w-full items-center justify-between px-4 py-3 text-left"
	>
		<div>
			<p class="text-[0.65rem] uppercase tracking-[0.45em] text-slate-400">Places</p>
			<h2 class="mt-1 text-base font-semibold text-white">Marked places</h2>
		</div>
		<div class="flex items-center gap-3">
			<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
				>{places.length}</span
			>
			<span class="text-slate-400">{open ? '−' : '+'}</span>
		</div>
	</button>
	{#if open}
		<div class="max-h-[calc(100vh-15rem)] overflow-y-auto border-t border-white/10 p-2">
			{#each places as place}
				<SavedPlace {place} />
			{/each}
			{#if places.length === 0}
				<p class="px-3 py-4 text-sm text-slate-500">No saved places yet.</p>
			{/if}
		</div>
	{:else}
		<div class="border-t border-white/10 px-4 py-3 text-sm text-slate-400">
			Collapsed. Open to browse your saved pins.
		</div>
	{/if}
</section>
