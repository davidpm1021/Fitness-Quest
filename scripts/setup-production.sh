#!/bin/bash
# Production setup script for Fitness Quest

echo "🚀 Setting up Fitness Quest for production..."

# Run Prisma migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Seed monsters
echo "🐉 Seeding monsters..."
npx tsx prisma/seed-monsters.ts

echo "✅ Production setup complete!"
echo "Your app is ready to use!"
