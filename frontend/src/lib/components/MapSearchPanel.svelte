<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import { selectSearchResult } from '$lib/dashboard/actions';
	import { locationSearch } from '$lib/state/locationSearch.svelte';
</script>

<div class="pointer-events-auto">
	<Panel floating>
		<div class="flex items-center justify-between gap-3">
			<h2 class="text-base font-semibold text-(--text)">Find a place</h2>
		</div>
		<div class="mt-3 rounded-xl border border-(--border) bg-(--ink-soft) px-3.5 py-2.5">
			<input
				id="place-search"
				value={locationSearch.query}
				oninput={(event) => locationSearch.setQuery(event.currentTarget.value)}
				type="search"
				placeholder="Search cities, landmarks, or neighborhoods"
				class="w-full bg-transparent text-sm text-(--text) outline-none placeholder:text-(--muted-dim)"
			/>
		</div>
		{#if locationSearch.isSearching || locationSearch.results.length > 0 || locationSearch.query.trim()}
			<div class="mt-3 max-h-80 overflow-y-auto rounded-xl border border-(--border) p-1.5">
				{#if locationSearch.isSearching}
					<p class="px-2.5 py-2 text-sm text-(--muted)">Searching…</p>
				{/if}
				{#each locationSearch.results as result, i (result.displayName + i)}
					<button
						onclick={() => selectSearchResult(result)}
						class="w-full rounded-lg px-2.5 py-2.5 text-left transition hover:bg-white/5"
					>
						<div class="text-sm font-medium text-(--text)">{result.name}</div>
						<div class="mt-0.5 text-xs leading-5 text-(--muted)">{result.displayName}</div>
					</button>
				{/each}
				{#if !locationSearch.isSearching && locationSearch.query.trim() && locationSearch.results.length === 0}
					<p class="px-2.5 py-2 text-sm text-(--muted-dim)">No search results yet.</p>
				{/if}
			</div>
		{/if}
	</Panel>
</div>
