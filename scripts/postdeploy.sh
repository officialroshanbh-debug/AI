#!/bin/bash
# Postdeploy script for database migrations
# Run this manually after first deployment

echo "Running database migrations..."
prisma migrate deploy
echo "Migrations complete!"
