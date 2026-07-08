<script lang="ts">
	import { goto } from '$app/navigation';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { beginLogin } from '$lib/dashboard/actions';

	function openApp(): void {
		goto('/app');
	}
</script>

<main class="h-screen overflow-y-auto px-6 py-10">
	<div class="mx-auto flex max-w-5xl flex-col gap-16">
		<nav class="flex items-center justify-between">
			<div class="inline-flex items-center gap-2 text-sm font-semibold text-(--text)">
				<span class="h-1.5 w-1.5 rounded-full bg-(--accent)"></span>
				Want To Go
			</div>
			<Button variant="ghost" size="sm" onclick={beginLogin}>Sign in</Button>
		</nav>

		<section class="max-w-2xl">
			<Badge>Map-based travel bucket list</Badge>
			<h1 class="mt-6 text-4xl font-semibold tracking-tight text-(--text) md:text-6xl">
				Save your next trip on a map, not in a notes app.
			</h1>
			<p class="mt-4 max-w-xl text-base text-(--muted) md:text-lg">
				Search places, pin them to the map, and keep private travel ideas tied to your Authentik
				account.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<Button onclick={beginLogin}>Get started</Button>
			</div>
			<p class="mt-6 text-sm text-(--muted-dim)">
				OAuth users only store an ID and username. Place data stays private to your account.
			</p>
		</section>

		<section class="grid gap-4 sm:grid-cols-3">
			<Panel>
				<h2 class="text-base font-semibold text-(--text)">Pin it on the map</h2>
				<p class="mt-2 text-sm text-(--muted)">
					Search anywhere in the world and drop a pin the moment you hear about a place worth
					visiting.
				</p>
			</Panel>
			<Panel>
				<h2 class="text-base font-semibold text-(--text)">Keep the details</h2>
				<p class="mt-2 text-sm text-(--muted)">
					Attach notes, photos, and links to every place so you remember why you saved it.
				</p>
			</Panel>
			<Panel>
				<h2 class="text-base font-semibold text-(--text)">Private by default</h2>
				<p class="mt-2 text-sm text-(--muted)">
					Your list is tied to your account and never shown to anyone else.
				</p>
			</Panel>
		</section>

		<footer
			class="flex flex-wrap items-center justify-between gap-4 border-t border-(--border) pt-6 text-sm text-(--muted-dim)"
		>
			<span>&copy; {new Date().getFullYear()} Want To Go</span>
			<div class="flex gap-4">
				<a href="/privacy" class="hover:text-(--text)">Privacy Policy</a>
				<a href="/legal-notice" class="hover:text-(--text)">Legal Notice</a>
			</div>
		</footer>
	</div>
</main>
