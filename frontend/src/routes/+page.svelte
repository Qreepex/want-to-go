<script lang="ts">
	import { goto } from '$app/navigation';
	import { getStoredToken } from '$lib/api/token';
	import Landing from '$lib/components/Landing.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
	import { siteName } from '$lib/config/site';
	import { onMount } from 'svelte';

	let checkingAuth = $state(true);

	onMount(() => {
		if (getStoredToken()) {
			goto('/app');
			return;
		}
		checkingAuth = false;
	});
</script>

<Seo title={siteName} />

{#if checkingAuth}
	<main class="flex h-screen items-center justify-center">
		<Spinner />
	</main>
{:else}
	<Landing />
{/if}
