# ============================
# 1. Base build stage
# ============================
FROM node:20-bullseye AS builder

WORKDIR /app

# Install required OS packages for Prisma & builds
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    bash \
    netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better caching
COPY package.json package-lock.json* ./

# Install ALL dependencies (dev + prod) for build
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Build the Next.js app
ENV NODE_ENV=production
RUN npm run build

# ============================
# 2. Runtime stage
# ============================
FROM node:20-bullseye AS runner

WORKDIR /app

# Install only what's needed for runtime
RUN apt-get update && apt-get install -y \
    bash \
    netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

# Copy package files & node_modules from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules

# Copy Prisma schema (migrations run at startup)
COPY --from=builder /app/prisma ./prisma

# Copy built Next.js app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./next.config.js

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
