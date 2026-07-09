<script lang="ts">
	let {
		label,
		value = $bindable<string[]>([]),
		suggestions = [],
		placeholder = 'Add a tag...'
	} = $props<{
		label?: string;
		value?: string[];
		suggestions?: string[];
		placeholder?: string;
	}>();

	let inputValue = $state('');
	let isFocused = $state(false);

	const filteredSuggestions = $derived(
		suggestions
			.filter((tag: string) => !value.includes(tag))
			.filter((tag: string) => !inputValue.trim() || tag.includes(inputValue.trim().toLowerCase()))
			.slice(0, 8)
	);

	function addTag(raw: string): void {
		const tag = raw.trim().toLowerCase();

		if (tag && !value.includes(tag)) {
			value = [...value, tag];
		}

		inputValue = '';
	}

	function removeTag(tag: string): void {
		value = value.filter((existing: string) => existing !== tag);
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' || event.key === ',') {
			event.preventDefault();
			addTag(inputValue);
			return;
		}

		if (event.key === 'Backspace' && !inputValue && value.length) {
			removeTag(value[value.length - 1]);
		}
	}
</script>

<div class="relative">
	{#if label}
		<span class="text-xs tracking-wide text-(--muted)">{label}</span>
	{/if}
	<div
		class="mt-1.5 flex flex-wrap items-center gap-1.5 rounded-xl border border-(--border) bg-(--ink-soft) px-2.5 py-2 focus-within:border-(--accent)/60"
	>
		{#each value as tag (tag)}
			<span
				class="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs text-(--text)"
			>
				{tag}
				<button
					type="button"
					onclick={() => removeTag(tag)}
					aria-label={`Remove tag ${tag}`}
					class="leading-none text-(--muted) hover:text-(--text)"
				>
					×
				</button>
			</span>
		{/each}
		<input
			bind:value={inputValue}
			onkeydown={handleKeydown}
			onfocus={() => (isFocused = true)}
			onblur={() => setTimeout(() => (isFocused = false), 120)}
			placeholder={value.length ? '' : placeholder}
			class="min-w-24 flex-1 bg-transparent text-sm text-(--text) outline-none placeholder:text-(--muted-dim)"
		/>
	</div>

	{#if isFocused && filteredSuggestions.length}
		<div
			class="absolute z-10 mt-1 w-full rounded-xl border border-(--border) bg-(--surface) p-1 shadow-xl shadow-black/40"
		>
			{#each filteredSuggestions as tag (tag)}
				<button
					type="button"
					onmousedown={(event) => {
						event.preventDefault();
						addTag(tag);
					}}
					class="block w-full rounded-lg px-2.5 py-1.5 text-left text-sm text-(--text) hover:bg-white/7"
				>
					{tag}
				</button>
			{/each}
		</div>
	{/if}
</div>
