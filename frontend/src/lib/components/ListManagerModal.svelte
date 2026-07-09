<script lang="ts">
	import ListManagerRow from '$lib/components/ListManagerRow.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { addList, closeListManager } from '$lib/dashboard/actions';
	import { listManager } from '$lib/state/listManager.svelte';
	import { listsStore } from '$lib/state/lists.svelte';

	let newListName = $state('');

	async function handleCreate(): Promise<void> {
		if (!newListName.trim()) {
			return;
		}

		await addList(newListName);
		newListName = '';
	}
</script>

{#if listManager.isOpen}
	<div
		class="pointer-events-auto fixed inset-0 z-1200 flex items-center justify-center bg-black/60 p-4"
		role="presentation"
		onclick={closeListManager}
	>
		<div
			role="presentation"
			onclick={(event) => event.stopPropagation()}
			class="w-full max-w-lg"
		>
			<Panel floating>
				<div class="flex items-center justify-between gap-3">
					<h2 class="text-lg font-semibold text-(--text)">Manage lists</h2>
					<button
						onclick={closeListManager}
						class="text-sm text-(--muted) transition hover:text-(--text)"
					>
						Close
					</button>
				</div>

				<div class="mt-4 flex gap-2">
					<input
						bind:value={newListName}
						placeholder="New list name"
						onkeydown={(event) => {
							if (event.key === 'Enter') void handleCreate();
						}}
						class="min-w-0 flex-1 rounded-xl border border-(--border) bg-(--ink-soft) px-3.5 py-2.5 text-sm text-(--text) outline-none placeholder:text-(--muted-dim) focus:border-(--accent)/60"
					/>
					<Button size="sm" onclick={handleCreate}>Create</Button>
				</div>

				<div class="mt-4 grid max-h-[60vh] gap-2 overflow-y-auto">
					{#each listsStore.items as list (list.id)}
						<ListManagerRow {list} />
					{/each}
					{#if listsStore.items.length === 0}
						<p class="py-4 text-center text-sm text-(--muted-dim)">No lists yet.</p>
					{/if}
				</div>
			</Panel>
		</div>
	</div>

	<svelte:window
		onkeydown={(event) => {
			if (event.key === 'Escape') {
				closeListManager();
			}
		}}
	/>
{/if}
