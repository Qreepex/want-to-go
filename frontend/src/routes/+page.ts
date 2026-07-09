// Prerendered at build time so social/crawler bots (which don't run JS) see
// real og:*/twitter:* tags for the landing page instead of the generic SPA shell.
export const prerender = true;
export const ssr = true;
