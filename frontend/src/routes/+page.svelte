<script lang="ts">
	import { goto } from '$app/navigation';
	import { getStoredToken } from '$lib/api/token';
	import Login from '$lib/components/Login.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		if (getStoredToken()) {
			goto('/app');
		}
	});
</script>

<svelte:head>
	<title>Want To Go</title>
	<meta
		name="description"
		content="A map-based travel bucket list with OAuth login, saved places, and geocoded search."
	/>
</svelte:head>

<Login />
