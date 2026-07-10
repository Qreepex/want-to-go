# want-to-go Agent Notes

- Monorepo root uses npm workspaces: `frontend` and `backend`.
- Keep changes localized; prefer the existing helpers and route structure instead of introducing new abstractions.

## Architecture

- Backend: Express + TypeScript + Drizzle ORM + `pg`.
- Backend entrypoints are under `backend/src/`; HTTP wiring lives in `backend/src/app.ts` and routes are split across `auth`, `geo`, `places`, and `stats`.
- Backend env loading checks `backend/.env` first, then the parent `.env`.
- CORS allows credentials and defaults `FRONTEND_URL` to `http://localhost:5173`.
- Database schema is in `backend/src/db/schema.ts`; migrations live in `backend/drizzle/migrations/`.
- Users are OAuth-only identities: keep `users.id` and `users.username`, do not add email/password auth fields.
- Places belong to one user and already support `imageUrls` and `socialUrls` as Postgres text arrays.
- Frontend: SvelteKit + Vite + Tailwind CSS + Leaflet.
- Frontend API helpers and auth token storage live in `frontend/src/lib/api/**`; the token key is `want-to-go.auth-token` in `localStorage`.
- Frontend routes include the landing page, `/app`, and `/auth/callback`.

## Commands

- Backend build/check: `npm run build --workspace backend`, `npm run check --workspace backend`.
- Frontend build/check: `npm run build --workspace frontend`, `npm run check --workspace frontend`.
- Workspace dev commands: `npm run dev:backend`, `npm run dev:frontend`.

## Working Rules

- If you change auth, place storage, or API payloads, update both frontend and backend together.
- Preserve the existing route contracts and payload shapes unless the change explicitly requires a coordinated API update.
- Treat the current `README.md` feature backlog as informational only; do not copy it into this file.
