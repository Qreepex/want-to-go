// No route in this app uses server-side load functions or endpoints; everything
// fetches from the backend API client-side. Disabling SSR turns the whole app into
// a static SPA, which is what adapter-static's `fallback` mode requires.
export const ssr = false;
