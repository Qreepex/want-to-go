<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		class: className = '',
		onclick,
		children
	} = $props<{
		variant?: 'primary' | 'ghost' | 'danger';
		size?: 'sm' | 'md';
		type?: 'button' | 'submit';
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children: Snippet;
	}>();

	const variantClass: Record<string, string> = {
		primary:
			'bg-(--accent) text-(--ink) hover:bg-(--accent-strong) disabled:bg-(--accent)/40 disabled:text-(--ink)/60',
		ghost:
			'border border-(--border-strong) bg-white/3 text-(--text) hover:bg-white/7 disabled:text-(--muted-dim)',
		danger: 'text-(--danger) hover:text-(--danger) hover:bg-(--danger)/10'
	};

	const sizeClass: Record<string, string> = {
		sm: 'px-3 py-1.5 text-sm rounded-xl',
		md: 'px-4 py-2.5 text-sm rounded-xl'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed {variantClass[
		variant
	]} {sizeClass[size]} {className}"
>
	{@render children()}
</button>
