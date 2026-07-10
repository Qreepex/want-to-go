<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<svelte:head>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="theme-color" content="#262626" />
	<link rel="icon" href="/brand-icon.svg" type="image/svg+xml" />
	<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
	<link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
	<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>
{@render children()}
