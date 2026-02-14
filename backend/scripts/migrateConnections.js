#!/usr/bin/env node
// ============================================
// MIGRATION: company.tiktokAccountId -> IntegrationConnection
// Idempotent - safe to run multiple times
// ============================================

require('dotenv').config();
const prisma = require('../lib/prisma');

async function migrate() {
  console.log('Starting connection migration...\n');

  const companies = await prisma.company.findMany({
    where: {
      tiktokAccountId: { not: null },
    },
    select: {
      id: true,
      name: true,
      tiktokAccountId: true,
    },
  });

  console.log(`Found ${companies.length} companies with tiktokAccountId\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const company of companies) {
    try {
      const existing = await prisma.integrationConnection.findUnique({
        where: {
          companyId_provider_externalAccountId: {
            companyId: company.id,
            provider: 'TIKTOK_ORGANIC',
            externalAccountId: company.tiktokAccountId,
          },
        },
      });

      if (existing) {
        console.log(`  SKIP: ${company.name} - already migrated`);
        skipped++;
        continue;
      }

      await prisma.integrationConnection.create({
        data: {
          companyId: company.id,
          provider: 'TIKTOK_ORGANIC',
          status: 'CONNECTED',
          externalAccountId: company.tiktokAccountId,
          externalAccountName: `${company.name} TikTok`,
        },
      });

      console.log(`  OK: ${company.name} -> TIKTOK_ORGANIC (${company.tiktokAccountId})`);
      created++;
    } catch (error) {
      console.error(`  ERROR: ${company.name} - ${error.message}`);
      errors++;
    }
  }

  console.log(`\nMigration complete:`);
  console.log(`  Created: ${created}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);

  await prisma.$disconnect();
}

migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
