# 1. Base image
FROM node:20-bullseye

# 2. Install required OS packages
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    bash \
    netcat-openbsd \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 3. Copy only package.json and lock file (install deps first for caching)
COPY package.json package-lock.json* ./
RUN npm ci

# 4. Copy Prisma schema
COPY prisma ./prisma

# 5. Copy the rest of the application
COPY . .

# 6. Copy entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

# Entrypoint for DB wait/migrations, then run dev server
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
