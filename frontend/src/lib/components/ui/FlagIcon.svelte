<script lang="ts">
	let { countryCode, class: className = '' } = $props<{
		countryCode: string | null | undefined;
		class?: string;
	}>();

	const code = $derived(countryCode && countryCode.length === 2 ? countryCode.toLowerCase() : null);
</script>

{#if code}
	<span class="fi fi-{code} shrink-0 rounded-[3px] {className}" aria-hidden="true"></span>
{/if}
