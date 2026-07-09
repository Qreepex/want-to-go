// Prerendered at build time so social/crawler bots (which don't run JS) see
// real og:*/twitter:* tags instead of the generic SPA shell.
export const prerender = true;
export const ssr = true;
