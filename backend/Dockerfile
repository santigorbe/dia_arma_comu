FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY diploma/package.json diploma/package-lock.json diploma/
RUN corepack enable && pnpm install --frozen-lockfile && npm ci --omit=optional --prefix diploma

FROM deps AS build
COPY backend backend
RUN pnpm --filter @communications-day/backend run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules node_modules
COPY --from=deps /app/backend/node_modules backend/node_modules
COPY --from=deps /app/diploma/node_modules diploma/node_modules
COPY --from=build /app/backend/dist backend/dist
COPY backend/migrations backend/dist/migrations
COPY backend/package.json backend/package.json
COPY diploma/app.js diploma/app.js
COPY diploma/plantilla_diploma.pptx diploma/plantilla_diploma.pptx
COPY diploma/fonts diploma/fonts
EXPOSE 3000
CMD ["node", "backend/dist/src/server.js"]
