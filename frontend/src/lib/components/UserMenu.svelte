<script lang="ts">
	import { getUserInitial } from '$lib/dashboard';
	import { onMount } from 'svelte';

	let { username = null, onSignOut = () => {} } = $props<{
		username?: string | null;
		onSignOut?: () => void;
	}>();

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

<div class="fixed right-4 top-4 sm:right-6 sm:top-6" style="z-index: 1000;">
	<button
		bind:this={button}
		onclick={() => (open = !open)}
		class="pointer-events-auto grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-(--panel) text-sm font-semibold text-white shadow-2xl shadow-black/40 backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/10"
		aria-label="Open account menu"
	>
		{getUserInitial(username)}
	</button>
	{#if open}
		<div
			bind:this={panel}
			class="pointer-events-auto absolute right-0 mt-3 w-72 rounded-3xl border border-white/10 bg-(--panel) p-3 shadow-2xl shadow-black/40 backdrop-blur"
		>
			<p class="px-2 text-[0.65rem] uppercase tracking-[0.45em] text-slate-500">Account</p>
			<div
				class="mt-2 rounded-[1.1rem] border border-white/8 bg-white/5 px-3 py-3 text-sm text-white"
			>
				{username}
			</div>
			<button
				onclick={onSignOut}
				class="mt-3 flex w-full items-center justify-center rounded-[1.1rem] bg-white/10 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/15"
			>
				Sign out
			</button>
		</div>
	{/if}
</div>
