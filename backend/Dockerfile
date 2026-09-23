FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
RUN corepack enable && pnpm install --frozen-lockfile

FROM deps AS build
COPY backend backend
RUN pnpm --filter @communications-day/backend run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/backend/node_modules backend/node_modules
COPY --from=build /app/backend/dist backend/dist
COPY backend/migrations backend/dist/migrations
COPY backend/package.json backend/package.json
EXPOSE 3000
CMD ["node", "backend/dist/src/server.js"]
