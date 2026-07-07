<script lang="ts">
	import { goto } from '$app/navigation';
	import { getStoredToken } from '$lib/api';
	import { onMount } from 'svelte';

	onMount(async () => {
		if (!!getStoredToken()) {
			goto('/app');
		}
	});
</script>

<svelte:head>
	<meta
		name="description"
		content="A map-based travel bucket list with OAuth login, saved places, and geocoded search."
	/>
</svelte:head>
