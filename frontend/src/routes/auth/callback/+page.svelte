<script lang="ts">
	import { goto } from '$app/navigation';
	import { getBackendUrl } from '$lib/api/client';
	import { setStoredToken } from '$lib/api/token';
	import Seo from '$lib/components/Seo.svelte';
	import { onMount } from 'svelte';

	let status = $state('Completing sign-in...');

	onMount(() => {
		const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ''));
		const query = new URLSearchParams(window.location.search);
		const token = fragment.get('token') ?? query.get('token');

		if (!token) {
			const code = query.get('code');
			const state = query.get('state');

			if (code && state) {
				window.location.replace(
					`${getBackendUrl()}/auth/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
				);
				return;
			}

			status = 'Missing authentication token.';
			return;
		}

		setStoredToken(token);
		goto('/');
	});
</script>

<Seo title="Signing in" noindex />

<main class="flex min-h-screen items-center justify-center px-6 text-center">
	<div
		class="max-w-md rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-2xl shadow-black/40"
	>
		<p class="text-xs text-(--accent-strong)">Want To Go</p>
		<h1 class="mt-4 text-3xl font-semibold text-(--text)">{status}</h1>
		<p class="mt-3 text-sm text-(--muted)">
			If redirecting takes too long, return to the home page and try again.
		</p>
	</div>
</main>
