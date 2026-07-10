<script lang="ts">
	import { uploadImage } from '$lib/api';
	import Button from '$lib/components/ui/Button.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import TagInput from '$lib/components/ui/TagInput.svelte';
	import TextArea from '$lib/components/ui/TextArea.svelte';
	import TextField from '$lib/components/ui/TextField.svelte';
	import { closeEditor, savePlace } from '$lib/dashboard/actions';
	import {
		appendLines,
		cleanSocialUrl,
		extractUrls,
		formatCoordinate,
		getAllTags,
		parseUrlList,
		removeLine
	} from '$lib/dashboard/helpers';
	import { listsStore } from '$lib/state/lists.svelte';
	import { placeEditor } from '$lib/state/placeEditor.svelte';
	import { placesStore } from '$lib/state/places.svelte';
	import { session } from '$lib/state/session.svelte';
	import { statusStore } from '$lib/state/status.svelte';

	const previewTitle = $derived(
		placeEditor.selection?.displayName ?? placeEditor.selection?.name ?? 'Pinned location'
	);

	const images = $derived(parseUrlList(placeEditor.draft.imageUrls) ?? []);
	const socialUrls = $derived(parseUrlList(placeEditor.draft.socialUrls) ?? []);

	const listOptions = $derived(
		listsStore.writableLists.map((list) => ({ value: list.id, label: list.name }))
	);

	let isUploadingImage = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);
	let urlInput = $state('');

	async function handlePaste(event: ClipboardEvent) {
		const clipboardData = event.clipboardData;

		if (!clipboardData) {
			return;
		}

		const imageItem = Array.from(clipboardData.items).find(
			(item) => item.kind === 'file' && item.type.startsWith('image/')
		);

		if (imageItem) {
			event.preventDefault();
			const file = imageItem.getAsFile();

			if (file) {
				await uploadPastedImage(file);
			}

			return;
		}

		const target = event.target;
		const isDedicatedField =
			target instanceof HTMLElement && target.closest('[data-paste-passthrough]');

		if (isDedicatedField) {
			return;
		}

		const text = clipboardData.getData('text/plain').trim();

		if (!text) {
			return;
		}

		event.preventDefault();

		const existingDescription = placeEditor.draft.description.trim();
		placeEditor.draft.description = existingDescription
			? `${existingDescription}\n\n${text}`
			: text;

		const urls = extractUrls(text).map(cleanSocialUrl);

		if (urls.length) {
			placeEditor.draft.socialUrls = appendLines(placeEditor.draft.socialUrls, urls);
		}
	}

	function addUrl(): void {
		const value = urlInput.trim();

		if (!value) {
			return;
		}

		placeEditor.draft.socialUrls = appendLines(placeEditor.draft.socialUrls, [
			cleanSocialUrl(value)
		]);
		urlInput = '';
	}

	function handleUrlInputKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter') {
			event.preventDefault();
			addUrl();
		}
	}

	function removeUrl(url: string): void {
		placeEditor.draft.socialUrls = removeLine(placeEditor.draft.socialUrls, url);
	}

	async function uploadPastedImage(file: File): Promise<void> {
		if (!session.token) {
			statusStore.show('Sign in to upload images.');
			return;
		}

		isUploadingImage = true;
		statusStore.clear();

		try {
			const imageUrl = await uploadImage(session.token, file);
			placeEditor.draft.imageUrls = appendLines(placeEditor.draft.imageUrls, [imageUrl]);
		} catch (error) {
			statusStore.show(error instanceof Error ? error.message : 'Unable to upload image');
		} finally {
			isUploadingImage = false;
		}
	}

	function removeImage(imageUrl: string): void {
		placeEditor.draft.imageUrls = removeLine(placeEditor.draft.imageUrls, imageUrl);
	}

	async function handleImageFileSelect(event: Event): Promise<void> {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0] ?? null;
		input.value = '';

		if (file) {
			await uploadPastedImage(file);
		}
	}
</script>

{#if placeEditor.selection}
	<div
		class="pointer-events-auto fixed bottom-4 left-4 right-4 z-1000 sm:left-auto sm:right-6 sm:w-96"
		onpaste={handlePaste}
	>
		<Panel floating>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-xs text-(--accent-strong)">
						{placeEditor.mode === 'edit' ? 'Edit place' : 'Pinned location'}
					</p>
					<h2 class="mt-1 text-lg font-semibold text-(--text)">{previewTitle}</h2>
					<p class="mt-1 text-xs text-(--muted-dim)">
						{formatCoordinate(placeEditor.selection.latitude, 4)}, {formatCoordinate(
							placeEditor.selection.longitude,
							4
						)}
					</p>
				</div>
				<button onclick={closeEditor} class="text-sm text-(--muted) transition hover:text-(--text)">
					Close
				</button>
			</div>

			<div class="mt-4 grid gap-3">
				<Select label="List" bind:value={placeEditor.draft.listId} options={listOptions} />
				<div data-paste-passthrough>
					<TextField
						label="Name"
						bind:value={placeEditor.draft.name}
						placeholder="A place you want to remember"
					/>
				</div>
				<TextArea
					label="Description"
					bind:value={placeEditor.draft.description}
					placeholder="Why is this on your list? Paste text or images here."
				/>
				<div>
					<span class="text-xs tracking-wide text-(--muted)">Images</span>
					<div class="mt-1.5 grid grid-cols-4 gap-2">
						{#each images as imageUrl (imageUrl)}
							<div
								class="group relative aspect-square overflow-hidden rounded-lg border border-(--border)"
							>
								<img src={imageUrl} alt="" class="h-full w-full object-cover" />
								<button
									type="button"
									onclick={() => removeImage(imageUrl)}
									aria-label="Remove image"
									class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs leading-none text-white opacity-0 transition group-hover:opacity-100"
								>
									×
								</button>
							</div>
						{/each}
						<button
							type="button"
							onclick={() => fileInput?.click()}
							disabled={isUploadingImage}
							class="flex aspect-square items-center justify-center rounded-lg border border-dashed border-(--border) text-xs text-(--muted-dim) transition hover:border-(--border-strong) hover:text-(--text) disabled:opacity-60"
						>
							{isUploadingImage ? '…' : '+ Add'}
						</button>
					</div>
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						class="hidden"
						onchange={handleImageFileSelect}
					/>
				</div>
				<div data-paste-passthrough>
					<span class="text-xs tracking-wide text-(--muted)">URLs</span>
					<div class="mt-1.5 flex gap-2">
						<input
							type="text"
							bind:value={urlInput}
							onkeydown={handleUrlInputKeydown}
							placeholder="Paste a TikTok, Instagram, or other link"
							class="w-full rounded-xl border border-(--border) bg-(--ink-soft) px-3.5 py-2.5 text-(--text) outline-none placeholder:text-(--muted-dim) focus:border-(--accent)/60"
						/>
						<Button onclick={addUrl} size="sm" class="shrink-0">Add</Button>
					</div>
					{#if socialUrls.length}
						<ul class="mt-2 grid gap-1.5">
							{#each socialUrls as url (url)}
								<li
									class="flex items-center justify-between gap-2 rounded-lg border border-(--border) px-2.5 py-1.5"
								>
									<a
										href={url}
										target="_blank"
										rel="noreferrer noopener"
										title={url}
										class="min-w-0 truncate text-sm text-(--accent-strong) underline decoration-(--accent-strong)/40 underline-offset-2 hover:decoration-(--accent-strong)"
									>
										{url.replace(/^https?:\/\//, '')}
									</a>
									<button
										type="button"
										onclick={() => removeUrl(url)}
										aria-label="Remove URL"
										class="shrink-0 text-(--muted) transition hover:text-(--text)"
									>
										×
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				<TagInput
					label="Tags"
					bind:value={placeEditor.draft.tags}
					suggestions={getAllTags(placesStore.items)}
				/>
				{#if placeEditor.mode === 'create'}
					<label class="flex items-center gap-2 text-sm text-(--text)">
						<input type="checkbox" bind:checked={placeEditor.draft.alreadyVisited} />
						I've already been here
					</label>
					{#if placeEditor.draft.alreadyVisited}
						<TextField
							label="Visited on"
							type="date"
							bind:value={placeEditor.draft.visitedAt}
						/>
						<TextArea
							label="Visit notes"
							bind:value={placeEditor.draft.visitNotes}
							placeholder="Anything worth remembering about this visit?"
						/>
					{/if}
				{/if}
				{#if isUploadingImage}
					<p class="text-xs text-(--muted-dim)">Uploading image…</p>
				{/if}
				<Button onclick={savePlace} disabled={placeEditor.isSaving} class="mt-1 w-full">
					{placeEditor.isSaving
						? 'Saving…'
						: placeEditor.mode === 'edit'
							? 'Update place'
							: 'Save place'}
				</Button>
			</div>
		</Panel>
	</div>
{/if}
