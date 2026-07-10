<script lang="ts">
	import { onMount } from 'svelte';
	import FlagIcon from './FlagIcon.svelte';

	let {
		label,
		value = $bindable<string[]>([]),
		options,
		placeholder = 'All',
		id
	} = $props<{
		label?: string;
		value?: string[];
		options: { value: string; label: string; icon?: string }[];
		placeholder?: string;
		id?: string;
	}>();

	let open = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
	let panel = $state<HTMLDivElement | null>(null);

	const summary = $derived(
		value.length === 0
			? placeholder
			: value.length === 1
				? (options.find((option: { value: string }) => option.value === value[0])?.label ??
					placeholder)
				: `${value.length} selected`
	);

	function toggle(optionValue: string): void {
		value = value.includes(optionValue)
			? value.filter((existing: string) => existing !== optionValue)
			: [...value, optionValue];
	}

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

<div class="relative">
	{#if label}
		<span class="text-xs tracking-wide text-(--muted)">{label}</span>
	{/if}
	<button
		{id}
		type="button"
		bind:this={button}
		onclick={() => (open = !open)}
		class="mt-1.5 flex w-full items-center justify-between gap-2 rounded-xl border border-(--border) bg-(--ink-soft) px-3.5 py-2.5 text-left text-(--text) outline-none focus:border-(--accent)/60"
	>
		<span class="truncate">{summary}</span>
		<span class="text-(--muted-dim)">▾</span>
	</button>
	{#if open}
		<div
			bind:this={panel}
			class="absolute z-10 mt-1 max-h-64 w-full min-w-max overflow-y-auto rounded-xl border border-(--border) bg-(--surface) p-1 shadow-xl shadow-black/40"
		>
			{#each options as option (option.value)}
				{@const checked = value.includes(option.value)}
				<button
					type="button"
					onclick={() => toggle(option.value)}
					class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-(--text) hover:bg-white/7"
				>
					<span
						class="grid h-4 w-4 shrink-0 place-items-center rounded border {checked
							? 'border-(--accent) bg-(--accent-soft) text-(--accent-strong)'
							: 'border-(--border)'}"
					>
						{#if checked}
							<span class="text-[10px] leading-none">✓</span>
						{/if}
					</span>
					{#if option.icon}
						<FlagIcon countryCode={option.icon} class="h-3.5 w-[1.1rem]" />
					{/if}
					{option.label}
				</button>
			{/each}
		</div>
	{/if}
</div>
