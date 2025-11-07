#!/bin/bash

# SheetLeader Deployment Script
# This script pulls the latest changes and rebuilds the application

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Pull latest changes from git
echo "📥 Pulling latest changes..."
git pull

# Stop all containers
echo "🛑 Stopping containers..."
docker compose down

# Remove old build volumes to ensure fresh build
echo "🗑️  Removing old build volumes..."
docker volume rm sheetleader_frontend-dist 2>/dev/null || echo "Volume doesn't exist yet, skipping..."

# Rebuild and start containers (force recreate to ensure fresh build)
echo "🔨 Building and starting containers..."
docker compose up -d --build --force-recreate

# Wait a moment for containers to start
sleep 5

# Ensure database directory exists
echo "📁 Ensuring database directory exists..."
docker compose exec -T backend mkdir -p /app/data

# Push database schema (creates tables if they don't exist)
echo "🗄️  Pushing database schema..."
docker compose exec -T backend bunx drizzle-kit push || echo "⚠️  Schema push failed"

# Run database migrations
echo "🗄️  Running database migrations..."
docker compose exec -T backend bunx drizzle-kit migrate || echo "⚠️  Migration failed or no new migrations to run"

# Show container status
echo ""
echo "📊 Container Status:"
docker compose ps

# Show recent logs
echo ""
echo "📝 Recent logs:"
docker compose logs --tail=20

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  View backend logs: docker-compose logs -f backend"
echo "  View caddy logs: docker-compose logs -f caddy"
echo "  Restart service: docker-compose restart [service-name]"
