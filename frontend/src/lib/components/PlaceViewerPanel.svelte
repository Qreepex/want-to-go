<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import FlagIcon from '$lib/components/ui/FlagIcon.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { closeViewer, editViewedPlace, logVisit, removePlace, removeVisit } from '$lib/dashboard/actions';
	import { getUrlDomain } from '$lib/dashboard/helpers';
	import { placeViewer } from '$lib/state/placeViewer.svelte';

	let lightboxUrl = $state<string | null>(null);
	let showDeleteConfirm = $state(false);
	let showLogVisit = $state(false);
	let newVisitDate = $state(new Date().toISOString().slice(0, 10));
	let newVisitNotes = $state('');
	let isLoggingVisit = $state(false);

	async function submitVisit(placeId: string): Promise<void> {
		isLoggingVisit = true;

		try {
			await logVisit(placeId, newVisitDate, newVisitNotes);
			newVisitNotes = '';
			showLogVisit = false;
		} finally {
			isLoggingVisit = false;
		}
	}

	function formatVisitDate(visitedAt: string): string {
		const [year, month, day] = visitedAt.split('-').map(Number);
		return new Date(year, month - 1, day).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

{#if placeViewer.place}
	{@const place = placeViewer.place}
	<div
		class="pointer-events-auto fixed bottom-4 left-4 right-4 z-1000 sm:left-auto sm:right-6 sm:w-96"
	>
		<Panel floating>
			<div class="flex items-start justify-between gap-3">
				<div class="flex min-w-0 items-center gap-2">
					<FlagIcon countryCode={placeViewer.countryCode} class="h-4 w-5" />
					<h2 class="truncate text-lg font-semibold text-(--text)">{place.name}</h2>
				</div>
				<div class="flex shrink-0 items-center gap-1">
					<button
						type="button"
						onclick={editViewedPlace}
						aria-label="Edit place"
						class="rounded-full p-1.5 text-(--muted) transition hover:bg-white/7 hover:text-(--text)"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4"
						>
							<path d="M12 20h9" />
							<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
						</svg>
					</button>
					<button
						type="button"
						onclick={() => (showDeleteConfirm = true)}
						aria-label="Delete place"
						class="rounded-full p-1.5 text-(--muted) transition hover:bg-(--danger)/10 hover:text-(--danger)"
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="h-4 w-4"
						>
							<path d="M3 6h18" />
							<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
							<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
							<line x1="10" x2="10" y1="11" y2="17" />
							<line x1="14" x2="14" y1="11" y2="17" />
						</svg>
					</button>
					<button
						onclick={closeViewer}
						class="ml-1 text-sm text-(--muted) transition hover:text-(--text)"
					>
						Close
					</button>
				</div>
			</div>

			{#if place.description}
				{@const processedDescription = (() => {
					let text = place.description.trim();

					place.socialUrls?.forEach((url) => {
						const domain = getUrlDomain(url);

						if (domain) {
							// Escaped die URL, damit sie sicher im Regex verwendet werden kann
							const escapedUrl = url.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
							// Findet die komplette URL im Text
							const regex = new RegExp(escapedUrl, 'g');

							// Das HTML nutzt die volle URL für href, zeigt aber nur die Domain an
							const linkHtml = `<a href="${url}" target="_blank" rel="noreferrer noopener" class="align-bottom inline-block truncate font-semibold text-(--accent-strong) underline decoration-(--accent-strong)/40 hover:text-(--accent-strong-hover) transition-colors">${domain}</a>`;

							text = text.replace(regex, linkHtml);
						}
					});

					return text;
				})()}
				<p class="mt-2 text-sm text-(--muted)">
					{@html processedDescription}
				</p>
			{/if}

			{#if place.tags.length}
				<div class="mt-3 flex flex-wrap gap-1.5">
					{#each place.tags as tag (tag)}
						<Badge>{tag}</Badge>
					{/each}
				</div>
			{/if}

			<div class="mt-4 border-t border-(--border) pt-3">
				<div class="flex items-center justify-between">
					<span class="text-xs tracking-wide text-(--muted)">Visits</span>
					<button
						type="button"
						onclick={() => (showLogVisit = !showLogVisit)}
						class="text-xs text-(--accent-strong) transition hover:text-(--accent-strong-hover)"
					>
						{showLogVisit ? 'Cancel' : '+ Log a visit'}
					</button>
				</div>

				{#if place.visits.length}
					<ul class="mt-2 grid gap-1.5">
						{#each place.visits as visit (visit.id)}
							<li class="flex items-start justify-between gap-2 rounded-lg border border-(--border) px-2.5 py-1.5">
								<div class="min-w-0">
									<p class="text-sm text-(--text)">{formatVisitDate(visit.visitedAt)}</p>
									{#if visit.notes}
										<p class="mt-0.5 text-xs text-(--muted)">{visit.notes}</p>
									{/if}
								</div>
								<button
									type="button"
									onclick={() => removeVisit(visit.id)}
									aria-label="Remove visit"
									class="shrink-0 text-(--muted) transition hover:text-(--text)"
								>
									×
								</button>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="mt-2 text-sm text-(--muted-dim)">Not visited yet.</p>
				{/if}

				{#if showLogVisit}
					<div class="mt-3 grid gap-2">
						<TextField label="Visited on" type="date" bind:value={newVisitDate} />
						<TextField label="Notes (optional)" bind:value={newVisitNotes} placeholder="How was it?" />
						<Button onclick={() => submitVisit(place.id)} disabled={isLoggingVisit} size="sm">
							{isLoggingVisit ? 'Saving…' : 'Save visit'}
						</Button>
					</div>
				{/if}
			</div>

			{#if place.imageUrls?.length}
				<div class="mt-4 grid grid-cols-3 gap-2">
					{#each place.imageUrls as imageUrl (imageUrl)}
						<button
							type="button"
							onclick={() => (lightboxUrl = imageUrl)}
							aria-label="Enlarge image"
							class="aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg"
						>
							<img
								src={imageUrl}
								alt=""
								class="h-full w-full object-cover transition hover:opacity-90"
							/>
						</button>
					{/each}
				</div>
			{/if}

			{#if place.socialUrls?.length}
				<ul class="mt-4 grid gap-1.5">
					{#each place.socialUrls as url (url)}
						<li class="min-w-0">
							<a
								href={url}
								target="_blank"
								rel="noreferrer noopener"
								class="inline-block truncate text-sm font-medium text-(--accent-strong) underline decoration-(--accent-strong)/40 underline-offset-2 hover:decoration-(--accent-strong)"
							>
								{getUrlDomain(url)}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</Panel>
	</div>

	{#if showDeleteConfirm}
		<ConfirmDialog
			title="Delete place?"
			message={`Remove "${place.name}" from your list. This can't be undone.`}
			confirmLabel="Delete"
			onConfirm={() => {
				showDeleteConfirm = false;
				void removePlace(place);
			}}
			onCancel={() => (showDeleteConfirm = false)}
		/>
	{/if}
{/if}

{#if lightboxUrl}
	<button
		type="button"
		onclick={() => (lightboxUrl = null)}
		aria-label="Close image preview"
		class="pointer-events-auto fixed inset-0 z-1100 flex cursor-zoom-out items-center justify-center bg-black/80 p-6"
	>
		<span class="absolute right-4 top-4 text-3xl leading-none text-white/80">×</span>
		<img src={lightboxUrl} alt="" class="max-h-full max-w-full rounded-lg object-contain" />
	</button>
{/if}

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			lightboxUrl = null;
		}
	}}
/>
