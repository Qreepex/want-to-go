<script lang="ts">
	import { removePlace, startEdit } from '$lib/dashboard/actions';
	import type { PlaceRecord } from '$lib/types';

	let { place } = $props<{ place: PlaceRecord }>();
</script>

<article
	class="mb-2 rounded-xl border border-(--border) bg-white/2 px-3 py-3 transition hover:border-(--border-strong) hover:bg-white/5"
>
	<div class="flex items-start justify-between gap-3">
		<div class="text-sm font-medium text-(--text)">{place.name}</div>
		<button
			onclick={() => startEdit(place)}
			class="rounded-full border border-(--border) px-2.5 py-1 text-[0.65rem] uppercase tracking-wide text-(--muted) transition hover:border-(--border-strong) hover:text-(--text)"
		>
			Edit
		</button>
	</div>
	{#if place.description}
		<p class="mt-2 line-clamp-2 text-sm text-(--muted)">{place.description}</p>
	{/if}
	<div class="mt-3 flex items-center justify-between gap-3">
		<div class="flex flex-wrap gap-2 text-xs text-(--muted-dim)">
			{#if place.imageUrls?.length}
				<span>{place.imageUrls.length} images</span>
			{/if}
			{#if place.socialUrls?.length}
				<span>{place.socialUrls.length} links</span>
			{/if}
		</div>
		<button
			onclick={() => removePlace(place)}
			class="text-xs text-(--danger) transition hover:opacity-80">Delete</button
		>
	</div>
</article>
