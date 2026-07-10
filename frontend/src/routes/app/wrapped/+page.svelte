<script lang="ts">
	import PageShell from '$lib/components/layout/PageShell.svelte';
	import Login from '$lib/components/Login.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import StatCard from '$lib/components/wrapped/StatCard.svelte';
	import WrappedBarChart from '$lib/components/wrapped/WrappedBarChart.svelte';
	import WrappedDoughnut from '$lib/components/wrapped/WrappedDoughnut.svelte';
	import WrappedFilters from '$lib/components/wrapped/WrappedFilters.svelte';
	import WrappedHero from '$lib/components/wrapped/WrappedHero.svelte';
	import WrappedMap from '$lib/components/wrapped/WrappedMap.svelte';
	import WrappedProgress from '$lib/components/wrapped/WrappedProgress.svelte';
	import WrappedShareCard from '$lib/components/wrapped/WrappedShareCard.svelte';
	import { countryName } from '$lib/countries';
	import { initDashboard } from '$lib/dashboard/actions';
	import { CATEGORICAL, CHART_ACCENTS, getContinentColor } from '$lib/dashboard/chartColors';
	import {
		computeContinentCoverage,
		computeProgress,
		computeWrapped,
		getAvailableYears
	} from '$lib/dashboard/wrapped';
	import { placesStore } from '$lib/state/places.svelte';
	import { session } from '$lib/state/session.svelte';
	import { wrappedFilters } from '$lib/state/wrappedFilters.svelte';
	import { onMount } from 'svelte';

	onMount(async () => {
		if (placesStore.items.length === 0) {
			await initDashboard();
		}

		if (!wrappedFilters.yearTouched) {
			const years = getAvailableYears(placesStore.items);

			if (years.length > 0) {
				wrappedFilters.year = years[0];
			}
		}
	});

	// `.wrapped-enter` uses a CSS `animation` for the entrance effect, but any
	// element with a declared animation-name creates its own stacking context —
	// which traps things like the filters' dropdown behind later sections
	// regardless of z-index. Drop the class once the animation finishes so the
	// element returns to normal (non-isolated) stacking.
	function clearEnterAnimation(event: AnimationEvent): void {
		(event.currentTarget as HTMLElement).classList.remove('wrapped-enter');
	}

	const availableYears = $derived(getAvailableYears(placesStore.items));
	const stats = $derived(computeWrapped(placesStore.items, wrappedFilters));
	// Scoped to the current year/filter selection (via stats.visitedPlaces) so
	// "Your progress" moves in step with the rest of the page instead of
	// always showing all-time totals.
	const progress = $derived(computeProgress(placesStore.items, stats.totalPlacesVisited));
	const coverage = $derived(computeContinentCoverage(stats.visitedPlaces));
	const hasAnyVisits = $derived(availableYears.length > 0);
</script>

<Seo
	title="Your Wrapped"
	description="Your travel year in review — places, countries, and continents visited."
	noindex
/>

{#if !session.token}
	<Login />
{:else}
	<PageShell>
		<div class="h-full overflow-y-auto">
			<div class="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-12">
				<a href="/app" class="text-sm text-(--muted) transition hover:text-(--text)">
					← Back to map
				</a>

				{#if !hasAnyVisits}
					<div
						class="rounded-2xl border border-(--border) bg-(--surface-floating) p-8 text-center shadow-xl shadow-black/40 backdrop-blur-md"
					>
						<h1 class="text-2xl font-bold text-(--text)">Your Wrapped is waiting</h1>
						<p class="mt-2 text-(--muted)">
							Log a visit to one of your places to unlock your travel Wrapped.
						</p>
					</div>
				{:else}
					<div
						class="wrapped-enter"
						style="animation-delay: 0ms"
						onanimationend={clearEnterAnimation}
					>
						<div
							class="relative overflow-hidden rounded-3xl border border-(--border) p-6 shadow-xl shadow-black/40 transition duration-300 hover:shadow-2xl sm:p-8"
							style="background: radial-gradient(120% 140% at 0% 0%, {CATEGORICAL[0]}33 0%, transparent 55%),
								radial-gradient(120% 140% at 100% 0%, {CATEGORICAL[7]}33 0%, transparent 55%),
								var(--surface-floating)"
						>
							<WrappedHero
								{availableYears}
								totalPlacesVisited={stats.totalPlacesVisited}
								totalCountries={stats.totalCountries}
							/>
						</div>
					</div>

					<div
						class="wrapped-enter relative z-20"
						style="animation-delay: 60ms"
						onanimationend={clearEnterAnimation}
					>
						<WrappedFilters places={placesStore.items} />
					</div>

					<div
						class="wrapped-enter rounded-2xl border border-(--border) bg-(--surface-floating) p-4 shadow-xl shadow-black/40 backdrop-blur-md transition duration-300 hover:shadow-2xl sm:p-6"
						style="animation-delay: 100ms"
						onanimationend={clearEnterAnimation}
					>
						<h3 class="mb-4 text-sm font-semibold tracking-wide text-(--text)">Your progress</h3>
						<div class="flex flex-wrap items-center justify-center gap-6 sm:justify-start">
							<WrappedProgress
								label="Bucket list"
								current={progress.visitedCount}
								total={progress.totalCount}
								color={CATEGORICAL[0]}
								size={128}
							/>
							{#each coverage.filter((entry) => entry.totalCountries > 0) as entry (entry.code)}
								<WrappedProgress
									label={entry.name}
									current={entry.visitedCountries}
									total={entry.totalCountries}
									color={getContinentColor(entry.code)}
									size={88}
								/>
							{/each}
						</div>
					</div>

					<div
						class="wrapped-enter grid grid-cols-2 gap-3 sm:grid-cols-4"
						style="animation-delay: 140ms"
						onanimationend={clearEnterAnimation}
					>
						<StatCard
							value={stats.totalPlacesVisited}
							label="Places visited"
							color={CATEGORICAL[0]}
						/>
						<StatCard
							value={stats.totalCountries}
							label="Countries visited"
							color={CATEGORICAL[1]}
						/>
						<StatCard
							value={stats.totalContinents}
							label="Continents visited"
							color={CATEGORICAL[2]}
						/>
						<StatCard
							value={stats.mostVisitedMonth?.name ?? '—'}
							label="Most visited month"
							color={CATEGORICAL[3]}
						/>
						<StatCard
							value={countryName(stats.mostVisitedCountry?.code ?? '—')}
							label="Most visited country"
							sublabel={stats.mostVisitedCountry
								? `${stats.mostVisitedCountry.count} places`
								: undefined}
							color={CATEGORICAL[4]}
						/>
						<StatCard
							value={stats.mostVisitedContinent?.name ?? '—'}
							label="Most visited continent"
							sublabel={stats.mostVisitedContinent
								? `${stats.mostVisitedContinent.count} places`
								: undefined}
							color={CATEGORICAL[5]}
						/>
						<StatCard
							value={stats.mostVisitedPlace?.place.name ?? '—'}
							label="Most visited place"
							sublabel={stats.mostVisitedPlace
								? `${stats.mostVisitedPlace.count} visits`
								: undefined}
							color={CATEGORICAL[6]}
						/>
						<StatCard
							value={stats.topTags[0]?.tag ?? '—'}
							label="Most visited tag"
							sublabel={stats.topTags[0] ? `${stats.topTags[0].count} places` : undefined}
							color={CATEGORICAL[7]}
						/>
					</div>

					<div
						class="wrapped-enter grid gap-4 sm:grid-cols-2"
						style="animation-delay: 180ms"
						onanimationend={clearEnterAnimation}
					>
						<WrappedBarChart
							title="Top countries"
							color={CHART_ACCENTS.countries}
							data={stats.countryBreakdown.map((entry) => ({
								label: entry.code,
								value: entry.count
							}))}
						/>
						<WrappedDoughnut title="Continents" data={stats.continentBreakdown} />
						<WrappedBarChart
							title="Top tags"
							color={CHART_ACCENTS.tags}
							data={stats.topTags.map((entry) => ({ label: entry.tag, value: entry.count }))}
						/>
						<WrappedBarChart
							title="By month"
							color={CHART_ACCENTS.months}
							maxBars={12}
							data={stats.monthBreakdown.map((entry) => ({
								label: entry.name.slice(0, 3),
								value: entry.count
							}))}
						/>
						{#if wrappedFilters.year === 'all'}
							<WrappedBarChart
								title="By year"
								color={CHART_ACCENTS.years}
								data={stats.yearBreakdown.map((entry) => ({
									label: String(entry.year),
									value: entry.count
								}))}
							/>
						{/if}
					</div>

					<div
						class="wrapped-enter"
						style="animation-delay: 220ms"
						onanimationend={clearEnterAnimation}
					>
						<WrappedMap
							places={stats.visitedPlaces}
							highlightCountryCodes={stats.countryBreakdown.map((entry) => entry.code)}
						/>
					</div>

					<div
						class="wrapped-enter"
						style="animation-delay: 260ms"
						onanimationend={clearEnterAnimation}
					>
						<WrappedShareCard year={wrappedFilters.year} {stats} />
					</div>
				{/if}
			</div>
		</div>
	</PageShell>
{/if}

<style>
	.wrapped-enter {
		animation: wrapped-fade-up 500ms ease-out both;
	}

	@keyframes wrapped-fade-up {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.wrapped-enter {
			animation: none;
		}
	}
</style>
