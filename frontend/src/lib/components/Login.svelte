<script lang="ts">
	import { goto } from '$app/navigation';

	function beginLogin() {
		goto('/auth/login');
	}
</script>

<main class="flex min-h-screen items-center justify-center px-6 py-10">
	<section
		class="max-w-3xl rounded-4xl border border-white/10 bg-(--panel) p-8 shadow-2xl shadow-slate-950/40 backdrop-blur md:p-12"
	>
		<div
			class="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.35em] text-cyan-200"
		>
			<span class="h-2 w-2 rounded-full bg-amber-400"></span>
			Want To Go
		</div>
		<h1 class="mt-6 max-w-2xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
			Save your next trip on a map, not in a notes app.
		</h1>
		<p class="mt-4 max-w-xl text-base text-slate-300 md:text-lg">
			Search places, pin them to the map, and keep private travel ideas tied to your Authentik
			account.
		</p>
		<div class="mt-8 flex flex-wrap gap-3">
			<button
				onclick={beginLogin}
				class="rounded-full bg-amber-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-amber-300"
			>
				Sign in with Authentik
			</button>
		</div>
		<p class="mt-6 text-sm text-slate-400">
			OAuth users only store an ID and username. Place data stays private to your account.
		</p>
	</section>
</main>
