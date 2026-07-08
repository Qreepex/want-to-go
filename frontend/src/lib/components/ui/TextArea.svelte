<script lang="ts">
	let {
		label,
		value = $bindable(''),
		placeholder = '',
		rows = 3
	} = $props<{
		label?: string;
		value?: string;
		placeholder?: string;
		rows?: number;
	}>();
</script>

<label class="block">
	{#if label}
		<span class="text-xs tracking-wide text-(--muted)">{label}</span>
	{/if}
	<textarea
		bind:value
		{rows}
		{placeholder}
		class="mt-1.5 w-full resize-none rounded-xl border border-(--border) bg-(--ink-soft) px-3.5 py-2.5 text-(--text) outline-none placeholder:text-(--muted-dim) focus:border-(--accent)/60"
	></textarea>
</label>
