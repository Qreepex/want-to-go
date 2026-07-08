<script lang="ts">
	import type { Snippet } from 'svelte';

	let { background, children } = $props<{
		/** Full-bleed content behind the floating overlay UI, e.g. a map. */
		background?: Snippet;
		children?: Snippet;
	}>();
</script>

<main class="relative isolate h-screen overflow-hidden bg-(--ink)">
	{#if background}
		<div class="absolute inset-0 z-0">
			{@render background()}
		</div>
	{/if}
	{@render children?.()}
</main>
