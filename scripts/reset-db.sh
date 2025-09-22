#!/bin/bash

echo "🔄 Resetting database..."

# Stop any running processes
pkill -f "next dev" || true

# Remove all database files
rm -f prisma/dev.db*
rm -f dev.db*
find . -name "*.db*" -delete

# Clear Next.js cache
rm -rf .next

# Regenerate Prisma client
bunx prisma generate

# Reset database with migrations
bunx prisma migrate reset --force

echo "✅ Database reset complete!"
echo "🚀 You can now restart your dev server with: bun run dev"
