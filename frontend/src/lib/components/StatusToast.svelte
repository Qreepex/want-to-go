<script lang="ts">
	let { message = null } = $props<{ message?: string | null }>();
</script>

{#if message}
	<div class="fixed left-1/2 top-4 -translate-x-1/2 sm:top-6" style="z-index: 1000;">
		<div
			class="rounded-full border border-white/10 bg-slate-950/80 px-4 py-2 text-sm text-slate-100 shadow-2xl shadow-black/40 backdrop-blur"
		>
			{message}
		</div>
	</div>
{/if}
