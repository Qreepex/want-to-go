<script lang="ts">
	import FlagIcon from '$lib/components/ui/FlagIcon.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { visitsStore } from '$lib/state/visits.svelte';

	function yearOf(visitedAt: string): string {
		return visitedAt.slice(0, 4);
	}

	function formatVisitDate(visitedAt: string): string {
		const [year, month, day] = visitedAt.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString(undefined, {
			month: 'short',
			day: 'numeric'
		});
	}

	const groupedByYear = $derived(
		visitsStore.items.reduce((groups: Map<string, typeof visitsStore.items>, visit) => {
			const year = yearOf(visit.visitedAt);
			const existing = groups.get(year);

			if (existing) {
				existing.push(visit);
			} else {
				groups.set(year, [visit]);
			}

			return groups;
		}, new Map())
	);
</script>

<div class="pointer-events-auto flex min-h-0 flex-1 flex-col">
	<Panel floating tight class="flex min-h-0 flex-1 flex-col overflow-hidden">
		<div class="px-4 py-3">
			<h2 class="text-base font-semibold text-(--text)">Travel timeline</h2>
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto border-t border-(--border) p-2">
			{#if visitsStore.items.length === 0}
				<p class="px-3 py-4 text-sm text-(--muted-dim)">No visits logged yet.</p>
			{:else}
				{#each [...groupedByYear.entries()] as [year, visits] (year)}
					<div class="mb-3">
						<p class="px-1 pb-1.5 text-xs font-semibold tracking-wide text-(--muted)">{year}</p>
						{#each visits as visit (visit.id)}
							<div class="mb-2 flex items-start gap-3 rounded-xl border border-(--border) bg-white/2 px-3 py-2.5">
								{#if visit.place.imageUrls?.[0]}
									<img
										src={visit.place.imageUrls[0]}
										alt=""
										class="h-10 w-10 shrink-0 rounded-lg object-cover"
									/>
								{/if}
								<div class="min-w-0">
									<p class="flex items-center gap-1.5 truncate text-sm font-medium text-(--text)">
										<FlagIcon countryCode={visit.place.countryCode} class="h-3.5 w-[1.1rem]" />
										<span class="truncate">{visit.place.name}</span>
									</p>
									<p class="text-xs text-(--muted-dim)">{formatVisitDate(visit.visitedAt)}</p>
									{#if visit.notes}
										<p class="mt-1 text-xs text-(--muted)">{visit.notes}</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/each}
			{/if}
		</div>
	</Panel>
</div>
