<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		floating = false,
		tight = false,
		class: className = '',
		children
	} = $props<{
		/** Slightly more opaque + blurred, for panels that float over the map. */
		floating?: boolean;
		/** Reduced padding, for compact list-style panels. */
		tight?: boolean;
		class?: string;
		children: Snippet;
	}>();
</script>

<section
	class="rounded-2xl border border-(--border) shadow-xl shadow-black/30 {floating
		? 'bg-(--surface-floating) backdrop-blur-md'
		: 'bg-(--surface)'} {tight ? '' : 'p-4 sm:p-5'} {className}"
>
	{@render children()}
</section>
