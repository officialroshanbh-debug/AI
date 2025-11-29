#!/bin/bash
# Database sync script for Vercel deployments
# This ensures the database schema is always in sync

set -e

echo "🔄 Syncing database schema..."

# Try migrations first
if prisma migrate deploy; then
  echo "✅ Migrations applied successfully"
else
  echo "⚠️  Migrations failed, using db push as fallback..."
  prisma db push --accept-data-loss --skip-generate
  echo "✅ Database schema synced via db push"
fi

echo "✅ Database sync complete!"

