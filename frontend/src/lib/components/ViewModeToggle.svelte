<script lang="ts">
	import { placeFilters } from '$lib/state/placeFilters.svelte';
</script>

<div
	class="pointer-events-auto flex rounded-full border border-(--border) bg-(--surface-floating) p-1 text-sm shadow-xl shadow-black/40 backdrop-blur-md"
>
	<button
		type="button"
		onclick={() => (placeFilters.visited = 'want-to-go')}
		class="rounded-full px-3 py-1.5 font-medium transition {placeFilters.visited === 'want-to-go'
			? 'bg-(--accent) text-(--ink)'
			: 'text-(--muted) hover:text-(--text)'}"
	>
		Want to go
	</button>
	<button
		type="button"
		onclick={() => (placeFilters.visited = 'been')}
		class="rounded-full px-3 py-1.5 font-medium transition {placeFilters.visited === 'been'
			? 'bg-(--accent) text-(--ink)'
			: 'text-(--muted) hover:text-(--text)'}"
	>
		Been
	</button>
</div>
