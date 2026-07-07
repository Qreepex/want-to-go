<script lang="ts">
	import { formatCoordinate, type MapSelection } from '$lib/dashboard';

	let {
		selection = null,
		mode = 'create',
		name = $bindable(''),
		description = $bindable(''),
		imageUrls = $bindable(''),
		socialUrls = $bindable(''),
		isSaving = false,
		onClose = () => {},
		onSave = () => {}
	} = $props<{
		selection?: MapSelection | null;
		mode?: 'create' | 'edit';
		name: string;
		description: string;
		imageUrls: string;
		socialUrls: string;
		isSaving?: boolean;
		onClose?: () => void;
		onSave?: () => void;
	}>();

	const previewTitle = $derived(selection?.displayName ?? selection?.name ?? 'Pinned location');
</script>

{#if selection}
	<div class="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96" style="z-index: 1000;">
		<section
			class="pointer-events-auto rounded-3xl border border-white/10 bg-[rgba(4,9,18,0.9)] p-4 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-5"
		>
			<div class="flex items-start justify-between gap-3">
				<div>
					<p class="text-[0.65rem] uppercase tracking-[0.45em] text-amber-300/80">
						{mode === 'edit' ? 'Edit place' : 'Pinned location'}
					</p>
					<h2 class="mt-1 text-lg font-semibold text-white">{previewTitle}</h2>
					<p class="mt-1 text-xs text-slate-400">
						{formatCoordinate(selection.latitude, 5)}, {formatCoordinate(selection.longitude, 5)}
					</p>
				</div>
				<button onclick={onClose} class="text-sm text-slate-400 transition hover:text-white"
					>Close</button
				>
			</div>

			<div class="mt-4 grid gap-3">
				<label class="block">
					<span class="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Name</span>
					<input
						bind:value={name}
						class="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
						placeholder="A place you want to remember"
					/>
				</label>
				<label class="block">
					<span class="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Description</span>
					<textarea
						bind:value={description}
						rows="3"
						class="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
						placeholder="Why is this on your list?"></textarea>
				</label>
				<div class="grid gap-3 sm:grid-cols-2">
					<label class="block">
						<span class="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400">Image URLs</span
						>
						<textarea
							bind:value={imageUrls}
							rows="3"
							class="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
							placeholder="One URL per line"></textarea>
					</label>
					<label class="block">
						<span class="text-[0.65rem] uppercase tracking-[0.35em] text-slate-400"
							>Social URLs</span
						>
						<textarea
							bind:value={socialUrls}
							rows="3"
							class="mt-2 w-full rounded-[1.1rem] border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/40"
							placeholder="TikTok, Instagram, or a post link"></textarea>
					</label>
				</div>
				<button
					onclick={onSave}
					class="mt-1 rounded-[1.15rem] bg-amber-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-amber-400/40"
					disabled={!selection || isSaving}
				>
					{isSaving ? 'Saving...' : mode === 'edit' ? 'Update place' : 'Save place'}
				</button>
			</div>
		</section>
	</div>
{/if}
