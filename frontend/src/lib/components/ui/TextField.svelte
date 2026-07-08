<script lang="ts">
	let {
		label,
		value = $bindable(''),
		placeholder = '',
		type = 'text',
		id
	} = $props<{
		label?: string;
		value?: string;
		placeholder?: string;
		type?: string;
		id?: string;
	}>();
</script>

<label class="block">
	{#if label}
		<span class="text-xs tracking-wide text-(--muted)">{label}</span>
	{/if}
	<input
		{id}
		{type}
		bind:value
		{placeholder}
		class="mt-1.5 w-full rounded-xl border border-(--border) bg-(--ink-soft) px-3.5 py-2.5 text-(--text) outline-none placeholder:text-(--muted-dim) focus:border-(--accent)/60"
	/>
</label>
