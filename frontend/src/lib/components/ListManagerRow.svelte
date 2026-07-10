<script lang="ts">
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import {
		fetchMembers,
		kickListMember,
		leaveList,
		removeList,
		renameExistingList,
		shareList,
		unshareList
	} from '$lib/dashboard/actions';
	import { listsStore } from '$lib/state/lists.svelte';
	import type { ListMember, ListRecord, ShareRole } from '$lib/types';

	let { list } = $props<{ list: ListRecord }>();

	const roleLabels: Record<string, string> = {
		owner: 'Owner',
		view: 'Viewer',
		add: 'Contributor',
		edit: 'Editor'
	};

	const shareRoleOptions: { value: ShareRole; label: string }[] = [
		{ value: 'view', label: 'Can view' },
		{ value: 'add', label: 'Can add places' },
		{ value: 'edit', label: 'Can add, edit & delete' }
	];

	let isRenaming = $state(false);
	let renameValue = $state(list.name);
	let isShareExpanded = $state(false);
	let members = $state<ListMember[]>([]);
	let membersLoaded = $state(false);
	let shareRoleSelection = $state<ShareRole>('view');
	let deleteConfirmOpen = $state(false);
	let leaveConfirmOpen = $state(false);
	let memberPendingRemoval = $state<ListMember | null>(null);

	const canDelete = $derived(
		list.role !== 'owner' || listsStore.items.filter((item) => item.role === 'owner').length > 1
	);

	const joinUrl = $derived(
		list.shareToken && typeof window !== 'undefined'
			? `${window.location.origin}/lists/join/${list.shareToken}`
			: ''
	);

	async function loadMembers(): Promise<void> {
		members = await fetchMembers(list);
		membersLoaded = true;
	}

	function toggleShare(): void {
		isShareExpanded = !isShareExpanded;

		if (isShareExpanded && !membersLoaded) {
			void loadMembers();
		}
	}

	async function commitRename(): Promise<void> {
		await renameExistingList(list, renameValue);
		isRenaming = false;
	}

	async function copyLink(): Promise<void> {
		if (joinUrl) {
			await navigator.clipboard.writeText(joinUrl);
		}
	}

	async function confirmRemoveMember(): Promise<void> {
		if (!memberPendingRemoval) {
			return;
		}

		await kickListMember(list, memberPendingRemoval.userId);
		memberPendingRemoval = null;
		await loadMembers();
	}
</script>

<div class="rounded-xl border border-(--border) bg-white/2 p-3">
	<div class="flex items-center justify-between gap-2">
		{#if isRenaming}
			<input
				bind:value={renameValue}
				onkeydown={(event) => {
					if (event.key === 'Enter') commitRename();
					if (event.key === 'Escape') isRenaming = false;
				}}
				class="min-w-0 flex-1 rounded-lg border border-(--border) bg-(--ink-soft) px-2.5 py-1.5 text-sm text-(--text) outline-none focus:border-(--accent)/60"
			/>
			<button
				onclick={commitRename}
				class="shrink-0 text-xs text-(--accent-strong) hover:text-(--accent)"
			>
				Save
			</button>
		{:else}
			<span class="truncate text-sm font-medium text-(--text)">{list.name}</span>
			<Badge>{roleLabels[list.role]}</Badge>
		{/if}
	</div>

	<div class="mt-2 flex flex-wrap gap-3 text-xs text-(--muted)">
		{#if list.role === 'owner'}
			<button onclick={() => (isRenaming = !isRenaming)} class="hover:text-(--text)">
				Rename
			</button>
			<button onclick={toggleShare} class="hover:text-(--text)">
				{isShareExpanded ? 'Hide sharing' : 'Share'}
			</button>
			<button
				onclick={() => (deleteConfirmOpen = true)}
				disabled={!canDelete}
				class="text-(--danger) hover:text-(--danger) disabled:cursor-not-allowed disabled:opacity-40"
			>
				Delete
			</button>
		{:else}
			<button
				onclick={() => (leaveConfirmOpen = true)}
				class="text-(--danger) hover:text-(--danger)"
			>
				Leave list
			</button>
		{/if}
	</div>

	{#if isShareExpanded && list.role === 'owner'}
		<div class="mt-3 rounded-lg border border-(--border) bg-(--ink-soft) p-3">
			{#if list.shareToken && list.shareRole}
				<p class="text-xs text-(--muted)">
					Anyone with this link can join as <strong class="text-(--text)"
						>{roleLabels[list.shareRole]}</strong
					>:
				</p>
				<div class="mt-1.5 flex gap-2">
					<input
						readonly
						value={joinUrl}
						class="min-w-0 flex-1 rounded-lg border border-(--border) bg-(--surface) px-2.5 py-1.5 text-xs text-(--muted)"
					/>
					<Button size="sm" variant="ghost" onclick={copyLink}>Copy</Button>
				</div>
				<button
					onclick={() => unshareList(list)}
					class="mt-2 text-xs text-(--danger) hover:text-(--danger)"
				>
					Revoke link
				</button>
			{:else}
				<div class="flex items-end gap-2">
					<div class="flex-1">
						<Select
							label="Access level"
							bind:value={shareRoleSelection}
							options={shareRoleOptions}
						/>
					</div>
					<Button size="sm" onclick={() => shareList(list, shareRoleSelection)}>Create link</Button>
				</div>
			{/if}

			<div class="mt-3">
				<p class="text-xs text-(--muted)">Members</p>
				{#if members.length === 0}
					<p class="mt-1 text-xs text-(--muted-dim)">No one has joined yet.</p>
				{:else}
					<ul class="mt-1 grid gap-1">
						{#each members as member (member.userId)}
							<li class="flex items-center justify-between gap-2 text-xs text-(--text)">
								<span class="truncate">{member.username} · {roleLabels[member.role]}</span>
								<button
									onclick={() => (memberPendingRemoval = member)}
									class="shrink-0 text-(--danger) hover:text-(--danger)"
								>
									Remove
								</button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		</div>
	{/if}
</div>

{#if deleteConfirmOpen}
	<ConfirmDialog
		title="Delete list?"
		message={`Delete "${list.name}" and all places in it. This can't be undone.`}
		confirmLabel="Delete"
		onConfirm={() => {
			deleteConfirmOpen = false;
			void removeList(list);
		}}
		onCancel={() => (deleteConfirmOpen = false)}
	/>
{/if}

{#if leaveConfirmOpen}
	<ConfirmDialog
		title="Leave list?"
		message={`You'll lose access to "${list.name}" until someone shares it with you again.`}
		confirmLabel="Leave"
		onConfirm={() => {
			leaveConfirmOpen = false;
			void leaveList(list);
		}}
		onCancel={() => (leaveConfirmOpen = false)}
	/>
{/if}

{#if memberPendingRemoval}
	<ConfirmDialog
		title="Remove member?"
		message={`${memberPendingRemoval.username} will lose access to "${list.name}".`}
		confirmLabel="Remove"
		onConfirm={confirmRemoveMember}
		onCancel={() => (memberPendingRemoval = null)}
	/>
{/if}
