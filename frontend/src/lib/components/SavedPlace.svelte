<script lang="ts">
	import type { PlaceRecord } from '$lib/types';

	let {
		place,
		onEdit = () => {},
		onDelete = () => {}
	} = $props<{
		place: PlaceRecord;
	}>();
</script>

<article
	class="mb-2 rounded-[1.2rem] border border-white/8 bg-white/5 px-3 py-3 transition hover:border-cyan-300/25 hover:bg-white/8"
>
	<div class="flex items-start justify-between gap-3">
		<div>
			<div class="text-sm font-medium text-white">{place.name}</div>
		</div>
		<button
			onclick={() => onEdit(place)}
			class="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
		>
			Edit
		</button>
	</div>
	{#if place.description}
		<p class="mt-3 line-clamp-2 text-sm text-slate-300">{place.description}</p>
	{/if}
	<div class="mt-3 flex items-center justify-between gap-3">
		<div class="flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-slate-500">
			{#if place.imageUrls?.length}
				<span>{place.imageUrls.length} images</span>
			{/if}
			{#if place.socialUrls?.length}
				<span>{place.socialUrls.length} links</span>
			{/if}
		</div>
		<button
			onclick={() => onDelete(place)}
			class="text-xs text-rose-300 transition hover:text-rose-200">Delete</button
		>
	</div>
</article>
