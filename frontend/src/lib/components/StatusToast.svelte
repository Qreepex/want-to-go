<script lang="ts">
	import { statusStore } from '$lib/state/status.svelte';
</script>

{#if statusStore.message}
	<div class="pointer-events-none fixed left-1/2 top-4 z-1000 -translate-x-1/2 sm:top-6">
		<div
			class="rounded-full border border-(--border) bg-(--surface-floating) px-4 py-2 text-sm text-(--text) shadow-xl shadow-black/40 backdrop-blur-md"
		>
			{statusStore.message}
		</div>
	</div>
{/if}
