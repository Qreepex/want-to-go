<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		side = 'left',
		children
	} = $props<{
		side?: 'left' | 'right';
		children: Snippet;
	}>();

	const sideClass = $derived(side === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6');
</script>

<div
	class="pointer-events-none fixed top-4 z-1000 flex w-[min(25rem,calc(100vw-2rem))] flex-col gap-3 sm:top-6 {sideClass}"
>
	{@render children()}
</div>
