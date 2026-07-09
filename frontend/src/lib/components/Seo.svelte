<script lang="ts">
	import { page } from '$app/state';
	import { defaultDescription, defaultOgImage, siteName, siteUrl } from '$lib/config/site';

	let {
		title,
		description = defaultDescription,
		image = defaultOgImage,
		type = 'website',
		noindex = false
	}: {
		title: string;
		description?: string;
		image?: string;
		type?: 'website' | 'article';
		noindex?: boolean;
	} = $props();

	let fullTitle = $derived(title === siteName ? title : `${title} · ${siteName}`);
	let canonicalUrl = $derived(`${siteUrl}${page.url.pathname}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalUrl} />
	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}

	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />
</svelte:head>
