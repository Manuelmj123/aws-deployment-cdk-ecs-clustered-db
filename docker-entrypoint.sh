#!/bin/bash
set -e

echo "⏳ Waiting for database to be ready..."
until nc -z db 3306; do
  sleep 1
done
echo "✅ Database is ready."

# Install any missing dependencies without requiring rebuild
echo "📦 Installing missing dependencies..."
npm install

# Generate Prisma client for correct platform
echo "🚀 Generating Prisma Client..."
npx prisma generate

# Run any pending migrations
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete. Starting app..."
exec "$@"
