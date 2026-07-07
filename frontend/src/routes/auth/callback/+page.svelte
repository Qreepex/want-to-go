<script lang="ts">
	import { goto } from '$app/navigation';
	import { getBackendUrl, setStoredToken } from '$lib/api';
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

<svelte:head>
	<title>Signing in</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center px-6 text-center">
	<div
		class="max-w-md rounded-4xl border border-white/10 bg-(--panel) p-8 shadow-2xl shadow-slate-950/40 backdrop-blur"
	>
		<p class="text-sm uppercase tracking-[0.4em] text-cyan-300">Want To Go</p>
		<h1 class="mt-4 text-3xl font-semibold text-white">{status}</h1>
		<p class="mt-3 text-sm text-slate-300">
			If redirecting takes too long, return to the home page and try again.
		</p>
	</div>
</main>
