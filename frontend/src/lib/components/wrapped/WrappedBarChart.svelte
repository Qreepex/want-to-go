<script lang="ts">
	import Panel from '$lib/components/ui/Panel.svelte';
	import { hexToRgba } from '$lib/dashboard/chartColors';
	import type { Chart as ChartType, ChartConfiguration } from 'chart.js';
	import { onDestroy } from 'svelte';

	let {
		title,
		data,
		maxBars = 8,
		color = '#3987e5'
	} = $props<{
		title: string;
		data: { label: string; value: number }[];
		maxBars?: number;
		color?: string;
	}>();

	const bars = $derived(data.slice(0, maxBars));

	let canvas = $state<HTMLCanvasElement | null>(null);
	let chart: ChartType | null = null;
	// Bumped on every render() call so a stale, slower-resolving call (the
	// chart.js import is async) can detect it's been superseded and bail
	// instead of racing a newer call to create a second Chart on the same
	// canvas.
	let renderToken = 0;

	async function render(): Promise<void> {
		const token = ++renderToken;

		if (!canvas || bars.length === 0) {
			// Nothing to draw (or nowhere to draw it) — drop any existing chart
			// rather than leaving a stale instance behind.
			chart?.destroy();
			chart = null;
			return;
		}

		const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip } = await import(
			'chart.js'
		);
		Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip);

		// A newer render() call may have started (and possibly already
		// destroyed/replaced things) while the import above was in flight, or
		// the canvas may have been unmounted entirely — bail rather than hand
		// Chart.js a stale or detached element.
		if (token !== renderToken || !canvas || !canvas.isConnected) {
			return;
		}

		const config: ChartConfiguration<'bar'> = {
			type: 'bar',
			data: {
				labels: bars.map((bar: { label: string }) => bar.label),
				datasets: [
					{
						data: bars.map((bar: { value: number }) => bar.value),
						backgroundColor: color,
						hoverBackgroundColor: hexToRgba(color, 0.75),
						borderRadius: 4,
						borderSkipped: false,
						maxBarThickness: 22,
						categoryPercentage: 0.7,
						barPercentage: 0.9
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 500, easing: 'easeOutQuart' },
				scales: {
					x: {
						beginAtZero: true,
						ticks: { color: '#a39a8d', precision: 0 },
						grid: { color: 'rgba(245, 241, 234, 0.08)' },
						border: { display: false }
					},
					y: {
						ticks: { color: '#f4efe6', font: { weight: 500 } },
						grid: { display: false },
						border: { display: false }
					}
				},
				plugins: {
					tooltip: {
						backgroundColor: '#1e1e1e',
						titleColor: '#f4efe6',
						bodyColor: '#f4efe6',
						borderColor: 'rgba(245, 241, 234, 0.09)',
						borderWidth: 1,
						padding: 10,
						cornerRadius: 8,
						displayColors: false
					}
				}
			}
		};

		// Prefer updating the existing instance in place (Chart.js's documented
		// approach for changing datasets, including a different number of
		// bars) over destroying and recreating, which avoids any risk of a
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
		bars;
		color;

		void render();
	});
</script>

<Panel floating class="transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl">
	<h3 class="mb-3 text-sm font-semibold tracking-wide text-(--text)">{title}</h3>
	<div class="relative" style="height: {Math.max(bars.length, 1) * 34 + 16}px">
		<canvas bind:this={canvas} class:invisible={bars.length === 0}></canvas>
		{#if bars.length === 0}
			<p class="absolute inset-0 flex items-center text-sm text-(--muted-dim)">
				No data for this selection.
			</p>
		{/if}
	</div>
</Panel>
