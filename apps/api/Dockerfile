FROM node:20-alpine AS base
WORKDIR /app

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
# Stub web package.json so npm workspaces doesn't fail (we don't build web here)
COPY apps/web/package.json ./apps/web/
RUN npm ci --workspace=apps/api --workspace=packages/database --include-workspace-root --ignore-scripts

# ── builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY tsconfig.base.json ./
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Generate Prisma client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build NestJS API
RUN npm run build --workspace=apps/api

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/package.json ./

EXPOSE 3001
CMD ["node", "apps/api/dist/main"]
