<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import { getContinentColor } from '$lib/dashboard/chartColors';
	import type { NamedCountEntry } from '$lib/dashboard/wrapped';
	import type { Chart as ChartType, ChartConfiguration } from 'chart.js';
	import { onDestroy } from 'svelte';

	let { title, data } = $props<{
		title: string;
		data: NamedCountEntry[];
	}>();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart: ChartType | null = null;
	// Bumped on every render() call so a stale, slower-resolving call (the
	// chart.js import is async) can detect it's been superseded and bail
	// instead of racing a newer call to create a second Chart on the same
	// canvas.
	let renderToken = 0;

	const total = $derived(data.reduce((sum: number, entry: NamedCountEntry) => sum + entry.count, 0));

	async function render(): Promise<void> {
		const token = ++renderToken;

		if (!canvas || data.length === 0) {
			// Nothing to draw (or nowhere to draw it) — drop any existing chart
			// rather than leaving a stale instance behind.
			chart?.destroy();
			chart = null;
			return;
		}

		const { Chart, DoughnutController, ArcElement, Tooltip } = await import('chart.js');
		Chart.register(DoughnutController, ArcElement, Tooltip);

		// A newer render() call may have started (and possibly already
		// destroyed/replaced things) while the import above was in flight, or
		// the canvas may have been unmounted entirely — bail rather than hand
		// Chart.js a stale or detached element.
		if (token !== renderToken || !canvas || !canvas.isConnected) {
			return;
		}

		const config: ChartConfiguration<'doughnut'> = {
			type: 'doughnut',
			data: {
				labels: data.map((entry: NamedCountEntry) => entry.name),
				datasets: [
					{
						data: data.map((entry: NamedCountEntry) => entry.count),
						backgroundColor: data.map((entry: NamedCountEntry) => getContinentColor(entry.code)),
						borderColor: '#1e1e1e',
						borderWidth: 2,
						hoverOffset: 8
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '68%',
				animation: { duration: 500, easing: 'easeOutQuart' },
				plugins: {
					tooltip: {
						backgroundColor: '#1e1e1e',
						titleColor: '#f4efe6',
						bodyColor: '#f4efe6',
						borderColor: 'rgba(245, 241, 234, 0.09)',
						borderWidth: 1,
						padding: 10,
						cornerRadius: 8,
						displayColors: true
					}
				}
			}
		};

		// Prefer updating the existing instance in place (Chart.js's documented
		// approach for changing datasets, including a different number of
		// slices) over destroying and recreating, which avoids any risk of a
		// stray animation frame from an old instance painting over the new one.
		if (chart) {
			chart.data = config.data;
			chart.update();
			return;
		}

		chart = new Chart(canvas, config);
	}

	onDestroy(() => {
		renderToken++;
		chart?.destroy();
	});

	$effect(() => {
		data;

		void render();
	});
</script>

<Panel floating class="transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
	<h3 class="mb-3 text-sm font-semibold tracking-wide text-(--text)">{title}</h3>
	<div class="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
		<div class="relative h-44 w-44 shrink-0 transition duration-300 hover:scale-105">
			<canvas bind:this={canvas} class:invisible={data.length === 0}></canvas>
			{#if data.length > 0}
				<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
					<span class="text-2xl font-bold text-(--text)">{total}</span>
					<span class="text-xs text-(--muted)">places</span>
				</div>
			{/if}
		</div>
		<div class="flex w-full flex-col gap-1">
			{#if data.length === 0}
				<p class="text-sm text-(--muted-dim)">No data for this selection.</p>
			{:else}
				{#each data as entry (entry.code)}
					<div
						class="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-sm transition hover:bg-white/7"
					>
						<span class="flex items-center gap-2 truncate text-(--text)">
							<span
								class="h-2.5 w-2.5 shrink-0 rounded-full"
								style="background: {getContinentColor(entry.code)}"
							></span>
							<span class="truncate">{entry.name}</span>
						</span>
						<span class="shrink-0 text-(--muted)">{entry.count}</span>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</Panel>
