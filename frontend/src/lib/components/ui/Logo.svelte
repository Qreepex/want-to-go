<script lang="ts">
	let {
		size = 'md',
		iconOnly = false,
		class: className = ''
	} = $props<{
		size?: 'sm' | 'md' | 'lg';
		iconOnly?: boolean;
		class?: string;
	}>();

	const iconSizes: Record<string, string> = { sm: 'h-5 w-5', md: 'h-6 w-6', lg: 'h-8 w-8' };
	const textSizes: Record<string, string> = { sm: 'text-sm', md: 'text-base', lg: 'text-xl' };
</script>

<span class="inline-flex items-center gap-2 {className}">
	<svg viewBox="0 0 32 32" class={iconSizes[size]} aria-hidden="true">
		<rect width="32" height="32" rx="8" fill="#262626" />
		<g transform="rotate(-16 16 15)">
			<path
				d="M16 6c-3.6 0-6.5 2.9-6.5 6.5 0 4.9 6.5 13 6.5 13s6.5-8.1 6.5-13C22.5 8.9 19.6 6 16 6z"
				fill="#c2673f"
			/>
			<circle cx="16" cy="12.3" r="2.3" fill="#262626" />
		</g>
		<circle cx="22.5" cy="24.5" r="1.7" fill="#dd8355" />
	</svg>
	{#if !iconOnly}
		<span class="font-semibold tracking-tight text-(--text) {textSizes[size]}">QuestMark</span>
	{/if}
</span>
