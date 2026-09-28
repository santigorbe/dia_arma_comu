FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json
RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
COPY frontend frontend
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_MAP_TILE_URL
ENV VITE_MAP_TILE_URL=$VITE_MAP_TILE_URL
RUN pnpm --filter @communications-day/frontend run build

FROM node:22-alpine
WORKDIR /app
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/frontend/node_modules frontend/node_modules
COPY --from=build /app/frontend/dist frontend/dist
COPY frontend/package.json frontend/package.json
COPY frontend/vite.config.ts frontend/vite.config.ts
COPY frontend/src/pwa/cachePolicy.ts frontend/src/pwa/cachePolicy.ts
WORKDIR /app/frontend
EXPOSE 5173
CMD ["node", "node_modules/vite/bin/vite.js", "preview", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
