#!/bin/bash
set -e

# Extract DB host from DATABASE_URL (mysql://user:pass@host:3306/dbname)
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's/.*@([^:/]+).*/\1/')

echo "⏳ Waiting for database at $DB_HOST:3306..."
for i in {1..30}; do
  if nc -z "$DB_HOST" 3306; then
    echo "✅ Database is ready."
    break
  fi
  echo "   ...retrying ($i/30)"
  sleep 2
done

# Fail if DB never came up
if ! nc -z "$DB_HOST" 3306; then
  echo "❌ Database not reachable. Exiting."
  exit 1
fi

# Run pending Prisma migrations
echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations complete. Starting app..."
exec "$@"
