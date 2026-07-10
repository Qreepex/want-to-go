<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { siteName } from '$lib/config/site';
	import { countryName } from '$lib/countries';
	import { CATEGORICAL } from '$lib/dashboard/chartColors';
	import type { WrappedStats } from '$lib/dashboard/wrapped';
	import type { PlaceRecord } from '$lib/types';
	import { onMount } from 'svelte';

	let { year, stats } = $props<{
		year: number | 'all';
		stats: WrappedStats;
	}>();

	// Rendered natively on a <canvas> (rather than html2canvas-rasterizing DOM)
	// so text baselines and layout are pixel-exact instead of approximated.
	const WIDTH = 1080;
	const HEIGHT = 1920;
	const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

	let canvas = $state<HTMLCanvasElement | null>(null);
	// Normalized (0..1) equirectangular-projected country outlines, loaded once
	// and reused as a faint backdrop behind the card content.
	let worldRings: number[][][] | null = null;
	let isWorking = $state(false);
	let errorMessage = $state('');

	const heading = $derived(year === 'all' ? 'All-Time Wrapped' : `${year} Wrapped`);
	const topCountries = $derived(stats.countryBreakdown.slice(0, 3));
	const maxCountryCount = $derived(topCountries[0]?.count ?? 1);

	function hexToRgba(hex: string, alpha: number): string {
		const value = hex.replace('#', '');
		const r = parseInt(value.slice(0, 2), 16);
		const g = parseInt(value.slice(2, 4), 16);
		const b = parseInt(value.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	// Flag emoji render as the bare ISO letters on Windows (no color-flag font
	// support there), so flags are drawn from the same flag-icons SVGs the
	// rest of the app uses instead, via ctx.drawImage.
	const flagImages = new Map<string, HTMLImageElement | 'error'>();

	function getFlagImage(code: string): HTMLImageElement | null {
		if (code.length !== 2) {
			return null;
		}

		const key = code.toLowerCase();
		const cached = flagImages.get(key);

		if (cached === 'error') {
			return null;
		}

		if (cached) {
			return cached.complete && cached.naturalWidth > 0 ? cached : null;
		}

		const image = new Image();
		image.onload = () => draw();
		image.onerror = () => flagImages.set(key, 'error');
		image.src = `/flags/4x3/${key}.svg`;
		flagImages.set(key, image);

		return null;
	}

	function roundRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number
	): void {
		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.arcTo(x + width, y, x + width, y + height, radius);
		ctx.arcTo(x + width, y + height, x, y + height, radius);
		ctx.arcTo(x, y + height, x, y, radius);
		ctx.arcTo(x, y, x + width, y, radius);
		ctx.closePath();
	}

	function ellipsize(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
		if (ctx.measureText(text).width <= maxWidth) {
			return text;
		}

		let clipped = text;

		while (clipped.length > 1 && ctx.measureText(`${clipped}…`).width > maxWidth) {
			clipped = clipped.slice(0, -1);
		}

		return `${clipped}…`;
	}

	function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
		const words = text.split(' ');
		const lines: string[] = [];
		let current = '';

		for (const word of words) {
			const attempt = current ? `${current} ${word}` : word;

			if (current && ctx.measureText(attempt).width > maxWidth) {
				lines.push(current);
				current = word;
			} else {
				current = attempt;
			}
		}

		if (current) {
			lines.push(current);
		}

		return lines;
	}

	function fitFontSize(
		ctx: CanvasRenderingContext2D,
		text: string,
		maxWidth: number,
		weight: number,
		startSize: number,
		minSize = 70
	): number {
		let size = startSize;

		while (size > minSize) {
			ctx.font = `${weight} ${size}px ${FONT}`;

			if (ctx.measureText(text).width <= maxWidth) {
				break;
			}

			size -= 6;
		}

		return size;
	}

	function drawBlob(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		radius: number,
		color: string,
		alpha: number
	): void {
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
		gradient.addColorStop(0, hexToRgba(color, alpha));
		gradient.addColorStop(1, hexToRgba(color, 0));
		ctx.fillStyle = gradient;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, Math.PI * 2);
		ctx.fill();
	}

	async function loadWorldMap(): Promise<void> {
		try {
			const response = await fetch('/world-countries.geojson');
			const geojson = await response.json();
			const rings: number[][][] = [];

			for (const feature of geojson.features ?? []) {
				const geometry = feature.geometry;

				// Antarctica's outline in this dataset includes a closing edge
				// running the full -180..180 longitude range at a near-polar
				// latitude, which renders as a stray straight line across the
				// bottom of the map — drop it rather than special-case it.
				if (!geometry || feature.properties?.iso_a2 === 'AQ') {
					continue;
				}

				const polygons =
					geometry.type === 'Polygon'
						? [geometry.coordinates]
						: geometry.type === 'MultiPolygon'
							? geometry.coordinates
							: [];

				for (const polygon of polygons) {
					const exterior = polygon[0];

					// Skip tiny islands/slivers and decimate remaining points —
					// this is a decorative backdrop, not a precise map.
					if (!exterior || exterior.length < 24) {
						continue;
					}

					const ring: number[][] = [];

					for (let i = 0; i < exterior.length; i += 4) {
						const [lon, lat] = exterior[i];
						ring.push([(lon + 180) / 360, (90 - lat) / 180]);
					}

					if (ring.length >= 6) {
						rings.push(ring);
					}
				}
			}

			worldRings = rings;
			draw();
		} catch (error) {
			console.error('Failed to load world map outline', error);
		}
	}

	function drawWorldMap(
		ctx: CanvasRenderingContext2D,
		rings: number[][][],
		places: PlaceRecord[],
		mapX: number,
		mapY: number,
		mapWidth: number,
		mapHeight: number
	): void {
		ctx.save();
		ctx.strokeStyle = 'rgba(244, 239, 230, 0.18)';
		ctx.lineWidth = 2;
		ctx.lineJoin = 'round';

		for (const ring of rings) {
			ctx.beginPath();

			ring.forEach(([xNorm, yNorm], index) => {
				const x = mapX + xNorm * mapWidth;
				const y = mapY + yNorm * mapHeight;

				if (index === 0) {
					ctx.moveTo(x, y);
				} else {
					ctx.lineTo(x, y);
				}
			});

			ctx.closePath();
			ctx.stroke();
		}

		for (const place of places) {
			const x = mapX + ((place.longitude + 180) / 360) * mapWidth;
			const y = mapY + ((90 - place.latitude) / 180) * mapHeight;

			ctx.beginPath();
			ctx.fillStyle = hexToRgba(CATEGORICAL[6], 0.45);
			ctx.arc(x, y, 16, 0, Math.PI * 2);
			ctx.fill();

			ctx.beginPath();
			ctx.fillStyle = 'rgba(244, 239, 230, 0.95)';
			ctx.arc(x, y, 6, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.restore();
	}

	function drawInfoBadge(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		label: string,
		value: string,
		flagImage: HTMLImageElement | null = null
	): void {
		ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
		roundRect(ctx, x, y, width, height, 32);
		ctx.fill();

		const paddingX = 40;
		ctx.textAlign = 'left';
		ctx.font = `600 24px ${FONT}`;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
		ctx.textBaseline = 'top';
		ctx.fillText(label, x + paddingX, y + 34);

		const textY = y + 100;
		let textX = x + paddingX;

		if (flagImage) {
			const flagWidth = 60;
			const flagHeight = 45;
			const flagY = textY + 5;

			ctx.save();
			roundRect(ctx, textX, flagY, flagWidth, flagHeight, 6);
			ctx.clip();
			ctx.drawImage(flagImage, textX, flagY, flagWidth, flagHeight);
			ctx.restore();
			textX += flagWidth + 20;
		}

		ctx.font = `700 44px ${FONT}`;
		ctx.fillStyle = '#f4efe6';
		ctx.textBaseline = 'top';
		const clipped = ellipsize(ctx, value, x + width - paddingX - textX);
		ctx.fillText(clipped, textX, textY);
	}

	function draw(): void {
		if (!canvas) {
			return;
		}

		const ctx = canvas.getContext('2d');

		if (!ctx) {
			return;
		}

		ctx.clearRect(0, 0, WIDTH, HEIGHT);

		const bg = ctx.createLinearGradient(0, 0, WIDTH * 0.4, HEIGHT);
		bg.addColorStop(0, CATEGORICAL[0]);
		bg.addColorStop(0.32, '#201a2e');
		bg.addColorStop(0.62, '#1b1420');
		bg.addColorStop(1, CATEGORICAL[7]);
		ctx.fillStyle = bg;
		ctx.fillRect(0, 0, WIDTH, HEIGHT);

		drawBlob(ctx, WIDTH - 120, 100, 340, CATEGORICAL[6], 0.55);
		drawBlob(ctx, -60, HEIGHT - 200, 380, CATEGORICAL[2], 0.45);
		drawBlob(ctx, WIDTH - 260, HEIGHT * 0.33, 220, CATEGORICAL[4], 0.35);

		const marginX = 64;

		// Header: mark + wordmark (left), year badge (right) — all centered on
		// one shared headerCenterY so they align by construction, not CSS.
		const iconSize = 64;
		let cursorY = 70;
		const headerCenterY = cursorY + iconSize / 2;

		ctx.fillStyle = '#262626';
		roundRect(ctx, marginX, cursorY, iconSize, iconSize, iconSize * 0.25);
		ctx.fill();
		ctx.fillStyle = '#c2673f';
		ctx.beginPath();
		ctx.arc(marginX + iconSize / 2, cursorY + iconSize / 2, iconSize * 0.24, 0, Math.PI * 2);
		ctx.fill();

		ctx.font = `600 42px ${FONT}`;
		ctx.fillStyle = '#f4efe6';
		ctx.textAlign = 'left';
		ctx.textBaseline = 'middle';
		ctx.fillText('QuestMark', marginX + iconSize + 24, headerCenterY);

		ctx.font = `600 28px ${FONT}`;
		const badgePaddingX = 28;
		const badgeHeight = 60;
		const badgeWidth = ctx.measureText(heading).width + badgePaddingX * 2;
		const badgeX = WIDTH - marginX - badgeWidth;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
		roundRect(
			ctx,
			badgeX,
			headerCenterY - badgeHeight / 2,
			badgeWidth,
			badgeHeight,
			badgeHeight / 2
		);
		ctx.fill();
		ctx.fillStyle = '#f4efe6';
		ctx.textAlign = 'center';
		ctx.fillText(heading, badgeX + badgeWidth / 2, headerCenterY);
		ctx.textAlign = 'left';

		cursorY = headerCenterY + iconSize / 2 + 100;

		// Hero number
		const heroText = String(stats.totalPlacesVisited);
		const heroSize = fitFontSize(ctx, heroText, WIDTH - marginX * 2, 800, 170);
		ctx.font = `800 ${heroSize}px ${FONT}`;
		ctx.fillStyle = '#f4efe6';
		ctx.textBaseline = 'top';
		ctx.fillText(heroText, marginX, cursorY);
		cursorY += heroSize * 1.05 + 20;

		ctx.font = `500 34px ${FONT}`;
		ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
		const subtitle = `places visited across ${stats.totalCountries} ${
			stats.totalCountries === 1 ? 'country' : 'countries'
		} and ${stats.totalContinents} ${stats.totalContinents === 1 ? 'continent' : 'continents'}`;
		for (const line of wrapText(ctx, subtitle, WIDTH - marginX * 2)) {
			ctx.fillText(line, marginX, cursorY);
			cursorY += 46;
		}

		cursorY += 30;

		// Info badges
		const badgeGap = 24;
		const halfWidth = (WIDTH - marginX * 2 - badgeGap) / 2;
		const infoBadgeHeight = 190;

		drawInfoBadge(
			ctx,
			marginX,
			cursorY,
			halfWidth,
			infoBadgeHeight,
			'TOP CONTINENT',
			stats.mostVisitedContinent?.name ?? '—'
		);
		drawInfoBadge(
			ctx,
			marginX + halfWidth + badgeGap,
			cursorY,
			halfWidth,
			infoBadgeHeight,
			'TOP TAG',
			stats.topTags[0]?.tag ?? '—'
		);
		cursorY += infoBadgeHeight + badgeGap;

		drawInfoBadge(
			ctx,
			marginX,
			cursorY,
			WIDTH - marginX * 2,
			infoBadgeHeight,
			'MOST VISITED COUNTRY',
			stats.mostVisitedCountry ? countryName(stats.mostVisitedCountry.code) : '—',
			stats.mostVisitedCountry ? getFlagImage(stats.mostVisitedCountry.code) : null
		);
		cursorY += infoBadgeHeight + 60;

		// Top countries mini bar chart
		if (topCountries.length > 0) {
			ctx.font = `600 26px ${FONT}`;
			ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
			ctx.textBaseline = 'top';
			ctx.fillText('TOP COUNTRIES', marginX, cursorY);
			cursorY += 50;

			const rowHeight = 60;

			topCountries.forEach((entry: { code: string; count: number }, index: number) => {
				const rowCenterY = cursorY + rowHeight / 2;
				const flagImage = getFlagImage(entry.code);
				const flagWidth = 40;
				const flagHeight = 30;

				if (flagImage) {
					ctx.save();
					roundRect(ctx, marginX, rowCenterY - flagHeight / 2, flagWidth, flagHeight, 4);
					ctx.clip();
					ctx.drawImage(flagImage, marginX, rowCenterY - flagHeight / 2, flagWidth, flagHeight);
					ctx.restore();
				}

				ctx.font = `600 30px ${FONT}`;
				ctx.fillStyle = '#f4efe6';
				ctx.textBaseline = 'middle';
				ctx.textAlign = 'left';
				ctx.fillText(entry.code, marginX + flagWidth + 14, rowCenterY);

				const trackX = marginX + 120;
				const trackWidth = WIDTH - marginX * 2 - 120 - 80;
				const barHeight = 18;
				ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
				roundRect(ctx, trackX, rowCenterY - barHeight / 2, trackWidth, barHeight, barHeight / 2);
				ctx.fill();

				const fillWidth = Math.max(barHeight, (entry.count / maxCountryCount) * trackWidth);
				ctx.fillStyle = CATEGORICAL[index % CATEGORICAL.length];
				roundRect(ctx, trackX, rowCenterY - barHeight / 2, fillWidth, barHeight, barHeight / 2);
				ctx.fill();

				ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
				ctx.textAlign = 'right';
				ctx.fillText(String(entry.count), WIDTH - marginX, rowCenterY);
				ctx.textAlign = 'left';

				cursorY += rowHeight;
			});
		}

		// Faint world map, confined to the space below the top-countries list
		// (so it doesn't compete visually with the stats above it).
		const footerY = HEIGHT - 80;

		if (worldRings) {
			const mapTop = 1300;
			const mapBottom = footerY + 50;

			if (mapBottom > mapTop) {
				drawWorldMap(ctx, worldRings, stats.visitedPlaces, 0, mapTop, WIDTH, mapBottom - mapTop);
			}
		}

		// Footer
		ctx.font = `500 26px ${FONT}`;
		ctx.textBaseline = 'middle';
		ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
		ctx.textAlign = 'left';
		ctx.fillText('questmark.app', marginX, footerY);
		ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
		ctx.textAlign = 'right';
		ctx.fillText('My travel wrapped', WIDTH - marginX, footerY);
	}

	onMount(() => {
		draw();
		void loadWorldMap();
	});

	$effect(() => {
		stats;
		year;
		draw();
	});

	async function getBlob(): Promise<Blob | null> {
		if (!canvas) {
			return null;
		}

		return new Promise((resolve) => canvas!.toBlob((blob) => resolve(blob), 'image/png'));
	}

	async function downloadImage(): Promise<void> {
		isWorking = true;
		errorMessage = '';

		try {
			const blob = await getBlob();

			if (!blob) {
				errorMessage = 'Unable to generate image.';
				return;
			}

			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `questmark-wrapped-${year === 'all' ? 'all-time' : year}.png`;
			link.click();
			URL.revokeObjectURL(url);
		} catch (error) {
			console.error('Wrapped share-card render failed', error);
			errorMessage = 'Unable to generate image.';
		} finally {
			isWorking = false;
		}
	}

	async function shareImage(): Promise<void> {
		isWorking = true;
		errorMessage = '';

		try {
			const blob = await getBlob();

			if (!blob) {
				errorMessage = 'Unable to generate image.';
				return;
			}

			const file = new File([blob], `questmark-wrapped-${year === 'all' ? 'all-time' : year}.png`, {
				type: 'image/png'
			});

			if (navigator.canShare?.({ files: [file] })) {
				await navigator.share({
					files: [file],
					title: `${siteName} ${heading}`,
					text: `My ${heading} on ${siteName}`
				});
			} else {
				await downloadImage();
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				return;
			}

			console.error('Wrapped share-card render failed', error);
			errorMessage = 'Unable to share image.';
		} finally {
			isWorking = false;
		}
	}
</script>

<Panel floating class="flex flex-col items-center gap-4">
	<canvas
		bind:this={canvas}
		width={WIDTH}
		height={HEIGHT}
		class="w-full max-w-75 rounded-3xl shadow-lg shadow-black/40"
	></canvas>

	<div class="flex gap-2">
		<Button onclick={downloadImage} disabled={isWorking}>Download image</Button>
		<Button variant="ghost" onclick={shareImage} disabled={isWorking}>Share</Button>
	</div>

	{#if errorMessage}
		<p class="text-xs text-(--danger)">{errorMessage}</p>
	{/if}
</Panel>
