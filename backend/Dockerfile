# Build context is the monorepo root (npm workspaces share a single lockfile):
#   docker build -f backend/Dockerfile -t want-to-go-backend .
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --include-workspace-root

COPY backend/tsconfig.json backend/tsconfig.json
COPY tsconfig.base.json ./
COPY backend/src backend/src
RUN npm run build --workspace backend

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
RUN npm ci --workspace backend --omit=dev --include-workspace-root && npm cache clean --force

COPY --from=build /app/backend/dist backend/dist
COPY backend/drizzle backend/drizzle

USER node
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]
