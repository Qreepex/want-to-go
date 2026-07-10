<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { beginLogin } from '$lib/dashboard/actions';
</script>

<main class="flex min-h-screen items-center justify-center px-6 py-10">
	<section
		class="max-w-3xl rounded-3xl border border-(--border) bg-(--surface) p-8 shadow-2xl shadow-black/40 md:p-12"
	>
		<div
			class="inline-flex items-center gap-2 rounded-full border border-(--border) px-3 py-1 text-xs text-(--muted)"
		>
			<span class="h-1.5 w-1.5 rounded-full bg-(--accent)"></span>
			Want To Go
		</div>
		<h1 class="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-(--text) md:text-6xl">
			Save your next trip on a map, not in a notes app.
		</h1>
		<p class="mt-4 max-w-xl text-base text-(--muted) md:text-lg">
			Search places, pin them to the map, and keep private travel ideas tied to your account.
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<Button onclick={beginLogin}>Sign in</Button>
		</div>
	</section>
</main>
