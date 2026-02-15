#!/usr/bin/env node

/**
 * One-time migration: set adminId on all existing companies
 * that don't have one yet, using the first ADMIN user.
 *
 * Usage: DATABASE_URL=... node backend/scripts/migrateAdminOwnership.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const prisma = require('../lib/prisma');

async function main() {
  // Find the first admin user
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    orderBy: { createdAt: 'asc' },
  });

  if (!admin) {
    console.log('No ADMIN user found. Skipping migration.');
    return;
  }

  console.log(`Using admin: ${admin.email} (${admin.id})`);

  // Update all companies without an adminId
  const result = await prisma.company.updateMany({
    where: { adminId: null },
    data: { adminId: admin.id },
  });

  console.log(`Updated ${result.count} companies with adminId = ${admin.id}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
