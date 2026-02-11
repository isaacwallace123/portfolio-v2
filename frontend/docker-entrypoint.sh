#!/bin/sh
set -e

# Fix ownership on the uploads volume (host mount may be root-owned)
chown -R nextjs:nodejs /app/public/uploads

# Seed default icons into the uploads volume
if [ -d /app/default-icons ]; then
  mkdir -p /app/public/uploads/icons
  echo "Seeding default icons..."
  for f in /app/default-icons/*; do
    name=$(basename "$f")
    [ ! -f "/app/public/uploads/icons/$name" ] && cp "$f" "/app/public/uploads/icons/$name"
  done
  chown -R nextjs:nodejs /app/public/uploads/icons
fi

echo "Pushing database schema..."
su-exec nextjs node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate

echo "Seeding categories and skills..."
su-exec nextjs node prisma/seed.js

echo "Creating admin user from environment..."
su-exec nextjs node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' }
    });

    if (existing) {
      console.log('✅ Admin user already exists:', existing.email);
      await prisma.\$disconnect();
      return;
    }

    // Create admin user with placeholder password
    // (actual auth uses ADMIN_PASSWORD_HASH_ENCRYPTED from env)
    const admin = await prisma.user.create({
      data: {
        id: 'admin-1',
        email: process.env.ADMIN_EMAIL || 'admin@example.com',
        password: 'placeholder', // Your auth system uses ADMIN_PASSWORD_HASH_ENCRYPTED
        role: 'admin',
      }
    });

    console.log('✅ Created admin user:', admin.email);
    await prisma.\$disconnect();
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    await prisma.\$disconnect();
    process.exit(1);
  }
}

createAdmin();
"

echo "Starting Next.js server..."
exec su-exec nextjs node server.js
