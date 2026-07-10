<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children } = $props<{ children: Snippet }>();
</script>

<span class="rounded-full border border-(--border) bg-white/3 px-2.5 py-0.5 text-xs text-(--muted)">
	{@render children()}
</span>
