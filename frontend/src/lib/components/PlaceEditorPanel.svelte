<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import TextArea from '$lib/components/ui/TextArea.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { closeEditor, savePlace } from '$lib/dashboard/actions';
	import { formatCoordinate } from '$lib/dashboard/helpers';
	import { placeEditor } from '$lib/state/placeEditor.svelte';

	const previewTitle = $derived(
		placeEditor.selection?.displayName ?? placeEditor.selection?.name ?? 'Pinned location'
	);
</script>

{#if placeEditor.selection}
	<div class="pointer-events-auto fixed bottom-4 left-4 right-4 z-1000 sm:left-auto sm:right-6 sm:w-96">
		<Panel floating>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-xs text-(--accent-strong)">
						{placeEditor.mode === 'edit' ? 'Edit place' : 'Pinned location'}
					</p>
					<h2 class="mt-1 text-lg font-semibold text-(--text)">{previewTitle}</h2>
					<p class="mt-1 text-xs text-(--muted-dim)">
						{formatCoordinate(placeEditor.selection.latitude, 5)}, {formatCoordinate(
							placeEditor.selection.longitude,
							5
						)}
					</p>
				</div>
				<button onclick={closeEditor} class="text-sm text-(--muted) transition hover:text-(--text)">
					Close
				</button>
			</div>

			<div class="mt-4 grid gap-3">
				<TextField
					label="Name"
					bind:value={placeEditor.draft.name}
					placeholder="A place you want to remember"
				/>
				<TextArea
					label="Description"
					bind:value={placeEditor.draft.description}
					placeholder="Why is this on your list?"
				/>
				<div class="grid gap-3 sm:grid-cols-2">
					<TextArea
						label="Image URLs"
						bind:value={placeEditor.draft.imageUrls}
						placeholder="One URL per line"
					/>
					<TextArea
						label="Social URLs"
						bind:value={placeEditor.draft.socialUrls}
						placeholder="TikTok, Instagram, or a post link"
					/>
				</div>
				<Button
					onclick={savePlace}
					disabled={placeEditor.isSaving}
					class="mt-1 w-full"
				>
					{placeEditor.isSaving ? 'Saving…' : placeEditor.mode === 'edit' ? 'Update place' : 'Save place'}
				</Button>
			</div>
		</Panel>
	</div>
{/if}
