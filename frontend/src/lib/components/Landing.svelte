<script lang="ts">
	import LeafletMap from '$lib/components/LeafletMap.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import FlagIcon from '$lib/components/ui/FlagIcon.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { beginLogin } from '$lib/dashboard/actions';
	import { pickRandomDemoPlaces } from '$lib/dashboard/demoPlaces';
	import type { PlaceRecord } from '$lib/types';
	import { onMount } from 'svelte';

	const features = [
		{
			title: 'Pin it on the map',
			body: 'Search anywhere in the world and drop a pin the moment you hear about a place worth visiting.'
		},
		{
			title: 'Keep the details',
			body: 'Attach notes, photos, and links to every place so you remember why you saved it.'
		},
		{
			title: 'Tag and filter',
			body: 'Label places with tags like beach, hike, or food, then filter your map down to what you’re in the mood for.'
		},
		{
			title: 'Track where you’ve been',
			body: 'Log visits with dates and notes, see visited countries highlighted on the map, and browse your trips as a timeline.'
		},
		{
			title: 'Plan together',
			body: 'Create shared lists and invite friends or family with a link - choose whether they can view, add, or edit.'
		},
		{
			title: 'Private by default',
			body: 'Your lists are tied to your account and never shown to anyone else unless you share them.'
		}
	];

	let demoPlaces = $state<PlaceRecord[]>([]);
	let selectedDemoPlace = $state<PlaceRecord | null>(null);

	onMount(() => {
		demoPlaces = pickRandomDemoPlaces(10);
	});

	function selectDemoPlace(place: PlaceRecord): void {
		selectedDemoPlace = selectedDemoPlace?.id === place.id ? null : place;
	}
</script>

<main class="h-screen overflow-y-auto px-6 py-10">
	<div class="mx-auto flex max-w-5xl flex-col gap-16">
		<nav class="flex items-center justify-between">
			<div class="inline-flex items-center gap-2 text-sm font-semibold text-(--text)">
				<span class="h-1.5 w-1.5 rounded-full bg-(--accent)"></span>
				Want To Go
			</div>
			<Button variant="ghost" size="sm" onclick={beginLogin}>Sign in</Button>
		</nav>

		<section class="max-w-2xl">
			<h1 class="mt-6 text-4xl font-semibold tracking-tight text-(--text) md:text-6xl">
				Save your next trip on a map, not in a notes app.
			</h1>
			<p class="mt-4 max-w-xl text-base text-(--muted) md:text-lg">
				Want To Go is where you collect the places you want to visit - search for them, drop a pin,
				and keep notes, photos, and links right where you’ll actually see them again.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<Button onclick={beginLogin}>Get started - it’s free</Button>
				<a
					href="#demo"
					class="inline-flex items-center justify-center gap-2 rounded-xl border border-(--border-strong) bg-white/3 px-4 py-2.5 text-sm font-medium text-(--text) transition hover:bg-white/7"
				>
					Try the demo below
				</a>
			</div>
		</section>

		<section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each features as feature (feature.title)}
				<Panel>
					<h2 class="text-base font-semibold text-(--text)">{feature.title}</h2>
					<p class="mt-2 text-sm text-(--muted)">{feature.body}</p>
				</Panel>
			{/each}
		</section>

		<section id="demo" class="scroll-mt-10">
			<div class="max-w-2xl">
				<h2 class="mt-4 text-2xl font-semibold tracking-tight text-(--text) md:text-3xl">
					Try the map before you sign up
				</h2>
				<p class="mt-2 text-sm text-(--muted) md:text-base">
					Here’s a random set of destinations dropped on the map, just like your own saved places
					would look. Click a pin to see the details. Reload the page for a different mix.
				</p>
			</div>

			<div
				class="relative mt-6 h-105 overflow-hidden rounded-2xl border border-(--border) shadow-xl shadow-black/30 sm:h-130"
			>
				<LeafletMap places={demoPlaces} onSelectPlace={selectDemoPlace} />

				{#if selectedDemoPlace}
					<div
						class="pointer-events-auto absolute bottom-4 left-4 right-4 z-1000 sm:left-auto sm:right-4 sm:w-80"
					>
						<Panel floating>
							<div class="flex items-start justify-between gap-3">
								<div class="flex min-w-0 items-center gap-2">
									<FlagIcon countryCode={selectedDemoPlace.countryCode} class="h-4 w-5" />
									<h3 class="truncate text-base font-semibold text-(--text)">
										{selectedDemoPlace.name}
									</h3>
								</div>
								<button
									type="button"
									onclick={() => (selectedDemoPlace = null)}
									class="shrink-0 text-sm text-(--muted) transition hover:text-(--text)"
								>
									Close
								</button>
							</div>
							{#if selectedDemoPlace.description}
								<p class="mt-2 text-sm text-(--muted)">{selectedDemoPlace.description}</p>
							{/if}
							{#if selectedDemoPlace.tags.length}
								<div class="mt-3 flex flex-wrap gap-1.5">
									{#each selectedDemoPlace.tags as tag (tag)}
										<Badge>{tag}</Badge>
									{/each}
								</div>
							{/if}
						</Panel>
					</div>
				{/if}
			</div>

			<div class="mt-6 flex flex-wrap items-center gap-3">
				<p class="text-sm text-(--muted)">Ready to build your own list?</p>
				<Button size="sm" onclick={beginLogin}>Get started</Button>
			</div>
		</section>

		<footer
			class="flex flex-wrap items-center justify-between gap-4 border-t border-(--border) pt-6 text-sm text-(--muted-dim)"
		>
			<span>&copy; {new Date().getFullYear()} Want To Go</span>
			<div class="flex gap-4">
				<a href="/privacy" class="hover:text-(--text)">Privacy Policy</a>
				<a href="/legal-notice" class="hover:text-(--text)">Legal Notice</a>
			</div>
		</footer>
	</div>
</main>
