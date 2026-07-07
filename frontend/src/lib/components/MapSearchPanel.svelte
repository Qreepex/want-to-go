<script lang="ts">
	import type { PlaceSearchResult } from '$lib/types';

	let {
		query = $bindable(''),
		results = [],
		searching = false,
		onSelectResult = () => {}
	} = $props<{
		query: string;
		results?: PlaceSearchResult[];
		searching?: boolean;
		onSelectResult?: (result: PlaceSearchResult) => void;
	}>();
</script>

<section
	class="pointer-events-auto rounded-3xl border border-white/10 bg-(--panel) p-4 shadow-2xl shadow-black/40 backdrop-blur"
>
	<div class="flex items-center justify-between gap-3">
		<div>
			<p class="text-[0.65rem] uppercase tracking-[0.45em] text-cyan-300/80">Search</p>
			<h2 class="mt-1 text-lg font-semibold text-white">Find a place</h2>
		</div>
		<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300"
			>Geo API</span
		>
	</div>
	<div
		class="mt-3 rounded-[1.35rem] border border-white/10 bg-slate-950/75 px-4 py-3 shadow-inner shadow-black/20"
	>
		<input
			id="place-search"
			bind:value={query}
			type="search"
			placeholder="Search cities, landmarks, or neighborhoods"
			class="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
		/>
	</div>
	{#if searching || results.length > 0 || query.trim()}
		<div
			class="mt-3 max-h-80 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/90 p-2"
		>
			{#if searching}
				<p class="px-3 py-2 text-sm text-slate-400">Searching...</p>
			{/if}
			{#each results as result}
				<button
					onclick={() => onSelectResult(result)}
					class="w-full rounded-[1.1rem] border border-transparent px-3 py-3 text-left transition hover:border-cyan-300/20 hover:bg-cyan-300/10"
				>
					<div class="text-sm font-medium text-white">{result.name}</div>
					<div class="mt-1 text-xs leading-5 text-slate-400">{result.displayName}</div>
				</button>
			{/each}
			{#if !searching && query.trim() && results.length === 0}
				<p class="px-3 py-2 text-sm text-slate-500">No search results yet.</p>
			{/if}
		</div>
	{/if}
</section>
