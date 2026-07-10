<script lang="ts">
	import { viewPlace } from '$lib/dashboard/actions';
	import type { PlaceRecord, VisitRecord } from '$lib/types';

	let { place } = $props<{ place: PlaceRecord }>();

	const thumbnailUrl = $derived(place.imageUrls?.[0] ?? null);

	const lastVisitedAt = $derived(
		place.visits.length
			? place.visits.reduce(
					(latest: string, visit: VisitRecord) =>
						visit.visitedAt > latest ? visit.visitedAt : latest,
					place.visits[0].visitedAt
				)
			: null
	);

	function formatShortDate(visitedAt: string): string {
		const [year, month, day] = visitedAt.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short'
		});
	}
</script>

<article
	class="mb-2 rounded-xl border border-(--border) bg-white/2 px-3 py-3 transition hover:border-(--border-strong) hover:bg-white/5 cursor-pointer"
	onclick={() => viewPlace(place)}
>
	<div class="flex items-start justify-between gap-3">
		<div class="flex min-w-0 items-center gap-3">
			{#if thumbnailUrl}
				<img src={thumbnailUrl} alt="" class="h-10 w-10 shrink-0 rounded-lg object-cover" />
			{/if}
			<div class="truncate text-sm font-medium text-(--text)">{place.name}</div>
		</div>
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
		{#if lastVisitedAt}
			<span
				class="rounded-full border border-(--border) bg-(--accent-soft) px-2 py-0.5 text-xs text-(--accent-strong)"
			>
				{place.visits.length > 1
					? `Visited ${place.visits.length}× · last ${formatShortDate(lastVisitedAt)}`
					: `Visited ${formatShortDate(lastVisitedAt)}`}
			</span>
		{/if}
	</div>
</article>
