import { execSync } from 'node:child_process';
import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

function getCommitHash(): string {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
}

export default defineConfig({
	define: {
		__COMMIT_HASH__: JSON.stringify(getCommitHash())
	},
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// The app has no server-side load functions or +server.ts endpoints, so it's
			// deployed as a static SPA to Cloudflare Workers (see wrangler.toml). The
			// `fallback` page handles dynamic routes like /lists/join/[token] client-side.
			// See https://svelte.dev/docs/kit/single-page-apps
			//
			// `/`, `/privacy`, and `/legal-notice` are prerendered (see their +page.ts
			// files) so crawlers get real og:*/twitter:* meta without running JS. The
			// fallback is named `200.html` (unused by Cloudflare) instead of `index.html`
			// so that prerendering doesn't get clobbered by the SPA fallback file -
			// Cloudflare's `single-page-application` not_found_handling always serves the
			// real (prerendered) `index.html` for unmatched routes, which still works as
			// an SPA shell for client-rendered routes like /app.
			adapter: adapter({
				fallback: '200.html'
			}),

			// Emit absolute (root-relative) asset paths instead of the default
			// relative ones. Relative paths break for deep routes like
			// /lists/join/[token]: when Cloudflare's SPA fallback serves
			// index.html/200.html there, `./_app/...` resolves against
			// `/lists/join/`, 404s, and gets re-served as index.html again -
			// which the browser rejects as a JS module (wrong MIME type).
			paths: {
				relative: false
			}
		})
	]
});
