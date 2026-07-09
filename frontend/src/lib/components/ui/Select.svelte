<script lang="ts">
	let {
		label,
		value = $bindable(''),
		options,
		id
	} = $props<{
		label?: string;
		value?: string;
		options: { value: string; label: string }[];
		id?: string;
	}>();
</script>

<label class="block">
	{#if label}
		<span class="text-xs tracking-wide text-(--muted)">{label}</span>
	{/if}
	<select
		{id}
		bind:value
		class="mt-1.5 w-full rounded-xl border border-(--border) bg-(--ink-soft) px-3.5 py-2.5 text-(--text) outline-none focus:border-(--accent)/60"
	>
		{#each options as option (option.value)}
			<option value={option.value}>{option.label}</option>
		{/each}
	</select>
</label>
