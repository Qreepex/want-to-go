import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
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
			adapter: adapter({
				fallback: 'index.html'
			})
		})
	]
});
