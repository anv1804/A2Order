# syntax=docker/dockerfile:1

# -------------------------------------------------------------
# 1. Base Node 22 Alpine
# -------------------------------------------------------------
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# -------------------------------------------------------------
# 2. Dependencies
# -------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/server/package.json ./apps/server/
COPY apps/client/package.json ./apps/client/
COPY apps/cms/package.json ./apps/cms/
RUN npm ci

# -------------------------------------------------------------
# 3. Builder
# -------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run prisma:generate --workspace=apps/server
RUN npm run build

# -------------------------------------------------------------
# 4. Production Server Runner (Fastify + Socket.io)
# -------------------------------------------------------------
FROM base AS server
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

# Copy generated Prisma engine & dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/prisma ./apps/server/prisma
COPY --from=builder /app/apps/server/package.json ./apps/server/package.json
COPY package.json ./

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]

# -------------------------------------------------------------
# 5. Production Gateway (Nginx Reverse Proxy & Web SPAs)
# -------------------------------------------------------------
FROM nginx:1.27-alpine AS gateway
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html/client
COPY --from=builder /app/apps/cms/dist /usr/share/nginx/html/cms
COPY deploy/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
