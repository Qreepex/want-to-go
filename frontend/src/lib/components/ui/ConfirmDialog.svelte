<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';

	let {
		title,
		message,
		confirmLabel = 'Confirm',
		cancelLabel = 'Cancel',
		onConfirm,
		onCancel
	} = $props<{
		title: string;
		message: string;
		confirmLabel?: string;
		cancelLabel?: string;
		onConfirm: () => void;
		onCancel: () => void;
	}>();
</script>

<div
	class="pointer-events-auto fixed inset-0 z-1200 flex items-center justify-center bg-black/60 p-4"
	role="presentation"
	onclick={onCancel}
>
	<div role="presentation" onclick={(event) => event.stopPropagation()} class="w-full max-w-sm">
		<Panel floating>
			<h2 class="text-lg font-semibold text-(--text)">{title}</h2>
			<p class="mt-2 text-sm text-(--muted)">{message}</p>
			<div class="mt-4 flex justify-end gap-2">
				<Button variant="ghost" size="sm" onclick={onCancel}>{cancelLabel}</Button>
				<Button variant="danger" size="sm" onclick={onConfirm}>{confirmLabel}</Button>
			</div>
		</Panel>
	</div>
</div>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape') {
			onCancel();
		}
	}}
/>
