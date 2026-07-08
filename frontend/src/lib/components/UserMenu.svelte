<script lang="ts">
	import { signOut } from '$lib/dashboard/actions';
	import { getUserInitial } from '$lib/dashboard/helpers';
	import { session } from '$lib/state/session.svelte';
	import { onMount } from 'svelte';

	let open = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
	let panel = $state<HTMLDivElement | null>(null);

	onMount(() => {
		const handleDocumentClick = (event: MouseEvent) => {
			if (!open) {
				return;
			}

			const target = event.target;

			if (!(target instanceof Node)) {
				return;
			}

			if (button?.contains(target) || panel?.contains(target)) {
				return;
			}

			open = false;
		};

		document.addEventListener('click', handleDocumentClick);

		return () => document.removeEventListener('click', handleDocumentClick);
	});
</script>

<div class="pointer-events-auto fixed right-4 top-4 z-1000 sm:right-6 sm:top-6">
	<button
		bind:this={button}
		onclick={() => (open = !open)}
		class="grid h-11 w-11 place-items-center rounded-full border border-(--border) bg-(--surface-floating) text-sm font-semibold text-(--text) shadow-xl shadow-black/40 backdrop-blur-md transition hover:border-(--border-strong)"
		aria-label="Open account menu"
	>
		{getUserInitial(session.user?.username)}
	</button>
	{#if open}
		<div
			bind:this={panel}
			class="absolute right-0 mt-3 w-64 rounded-2xl border border-(--border) bg-(--surface-floating) p-3 shadow-xl shadow-black/40 backdrop-blur-md"
		>
			<p class="px-2 text-xs text-(--muted-dim)">Signed in as</p>
			<div class="mt-1.5 rounded-xl border border-(--border) bg-white/2 px-3 py-2.5 text-sm text-(--text)">
				{session.user?.username}
			</div>
			<button
				onclick={signOut}
				class="mt-3 flex w-full items-center justify-center rounded-xl bg-white/5 px-4 py-2.5 text-sm text-(--text) transition hover:bg-white/8"
			>
				Sign out
			</button>
		</div>
	{/if}
</div>
