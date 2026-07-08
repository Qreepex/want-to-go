<script lang="ts">
	import { goto } from '$app/navigation';
	import { getStoredToken } from '$lib/api/token';
	import Landing from '$lib/components/Landing.svelte';
	import Spinner from '$lib/components/ui/Spinner.svelte';
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

<svelte:head>
	<title>Want To Go</title>
	<meta
		name="description"
		content="A map-based travel bucket list with OAuth login, saved places, and geocoded search."
	/>
</svelte:head>

{#if checkingAuth}
	<main class="flex h-screen items-center justify-center">
		<Spinner />
	</main>
{:else}
	<Landing />
{/if}
