<script lang="ts">
	import { goto } from '$app/navigation';
	import { getStoredToken } from '$lib/api/token';
	import { loginUrl } from '$lib/api';
	import { setPendingListJoin } from '$lib/api/pendingListJoin';
	import { joinSharedList } from '$lib/dashboard/actions';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	let status = $state('Joining list...');

	onMount(() => {
		const token = page.params.token;

		if (!token) {
			status = 'Missing invite token.';
			return;
		}

		if (!getStoredToken()) {
			setPendingListJoin(token);
			window.location.href = loginUrl();
			return;
		}

		joinSharedList(token)
			.then(() => goto('/app'))
			.catch((error) => {
				status = error instanceof Error ? error.message : 'Unable to join list.';
			});
	});
</script>

<svelte:head>
	<title>Joining list</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-6 text-center">
	<div class="max-w-md rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-2xl shadow-black/40">
		<p class="text-xs text-(--accent-strong)">Want To Go</p>
		<h1 class="mt-4 text-3xl font-semibold text-(--text)">{status}</h1>
		<p class="mt-3 text-sm text-(--muted)">
			If redirecting takes too long, return to the home page and try again.
		</p>
	</div>
</main>
