# ============================================================
# Stage 1 – builder: install deps, generate Prisma, compile TS
# ============================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Generate Prisma client (needs schema.prisma)
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# ============================================================
# Stage 2 – production: lean runtime image
# ============================================================
FROM node:18-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy only what is needed
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

# Entrypoint: sync schema + seed before starting (for local Postgres / fresh DB)
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 5000

ENTRYPOINT ["/entrypoint.sh"]
