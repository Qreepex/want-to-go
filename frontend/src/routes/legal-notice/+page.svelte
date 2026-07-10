<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
	import { siteName } from '$lib/config/site';
</script>

<Seo title="Legal Notice" description="Legal notice / Impressum for {siteName}." />

<main class="flex h-screen justify-center overflow-y-auto px-6 py-10">
	<div class="w-full max-w-3xl">
		<nav class="mb-6 flex items-center gap-4 text-sm text-(--muted)">
			<a href="/" class="hover:text-(--text)">&larr; Back to {siteName}</a>
			<a href="/privacy" class="hover:text-(--text)">Privacy Policy</a>
		</nav>

		<Panel class="space-y-6">
			<h1 class="text-3xl font-semibold tracking-tight text-(--text) md:text-4xl">Legal Notice</h1>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">Information according to &sect; 5 TMG</h2>
				<p class="text-sm text-(--muted) md:text-base">
					Ben Schiemann<br />
					<span class="text-(--muted-dim)">Reinbeker Weg 70, 21465 Wentorf</span>
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">Contact</h2>
				<p class="text-sm text-(--muted) md:text-base">
					Email: <a href="mailto:go@schiemann.work" class="text-(--accent-strong) underline"
						>go@schiemann.work</a
					>
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">Responsible for content</h2>
				<p class="text-sm text-(--muted) md:text-base">
					Ben Schiemann (address as above), responsible according to &sect; 55 (2) RStV.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">Disclaimer</h2>
				<p class="text-sm text-(--muted) md:text-base">
					This is a personal, non-commercial project. Despite careful checks, we accept no liability
					for the content of external links; the operators of linked pages are solely responsible
					for their content.
				</p>
			</section>
		</Panel>
	</div>
</main>
