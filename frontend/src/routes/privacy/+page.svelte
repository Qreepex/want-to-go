<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import Panel from '$lib/components/ui/Panel.svelte';
</script>

<Seo title="Privacy Policy" description="How Want To Go handles your data." />

<main class="flex h-screen justify-center overflow-y-auto px-6 py-10">
	<div class="w-full max-w-3xl">
		<nav class="mb-6 flex items-center gap-4 text-sm text-(--muted)">
			<a href="/" class="hover:text-(--text)">&larr; Back to Want To Go</a>
			<a href="/legal-notice" class="hover:text-(--text)">Legal Notice</a>
		</nav>

		<Panel class="space-y-6">
			<div>
				<h1 class="text-3xl font-semibold tracking-tight text-(--text) md:text-4xl">
					Privacy Policy
				</h1>
				<p class="mt-2 text-sm text-(--muted-dim)">Last updated: 2026-07-08</p>
			</div>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">1. Who we are</h2>
				<p class="text-sm text-(--muted) md:text-base">
					Want To Go is operated by Ben Schiemann. If you have questions about this policy or your
					data, contact <a href="mailto:ai@qreepex.xyz" class="text-(--accent-strong) underline"
						>ai@qreepex.xyz</a
					>. Full operator details are on the
					<a href="/legal-notice" class="underline">Legal Notice</a> page.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">2. Account &amp; sign-in</h2>
				<p class="text-sm text-(--muted) md:text-base">
					Want To Go uses OAuth-based sign-in. We only store an account ID and username &mdash; we
					never collect or store your email address or a password. Your session is authenticated
					with a token stored in your browser's local storage.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">3. Places data</h2>
				<p class="text-sm text-(--muted) md:text-base">
					Places you save (name, location, notes, links, and images) are stored in our database and
					linked to your account. This data is private and is not shown to other users. Any images
					you upload are stored in object storage and served back to you when viewing your places.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">4. Third-party services</h2>
				<p class="text-sm text-(--muted) md:text-base">
					When you search for a location, your search query is sent to third-party geocoding
					providers &mdash; <a
						href="https://nominatim.openstreetmap.org"
						target="_blank"
						rel="noreferrer"
						class="underline">OpenStreetMap Nominatim</a
					>
					and
					<a href="https://photon.komoot.io" target="_blank" rel="noreferrer" class="underline"
						>Photon (Komoot)</a
					> &mdash; to resolve place names and coordinates. These providers process your query under their
					own privacy policies.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">5. Data retention &amp; deletion</h2>
				<p class="text-sm text-(--muted) md:text-base">
					Your account and place data are kept for as long as your account exists. To request
					deletion of your account and all associated data, contact <a
						href="mailto:ai@qreepex.xyz"
						class="text-(--accent-strong) underline">ai@qreepex.xyz</a
					>.
				</p>
			</section>

			<section class="space-y-2">
				<h2 class="text-lg font-semibold text-(--text)">6. Cookies &amp; local storage</h2>
				<p class="text-sm text-(--muted) md:text-base">
					We do not use tracking or advertising cookies. We use your browser's local storage only to
					keep you signed in.
				</p>
			</section>
		</Panel>
	</div>
</main>
