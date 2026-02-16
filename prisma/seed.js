const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const companies = [
  { name: 'Dr. B-Esth Esztétikai Klinika', tiktokAccountId: '_000qZAcx0RdCb5A2qNQ-WmgbjYxbQq-dlPL' },
  { name: 'Tópark Étterem Dunaharaszti', tiktokAccountId: '_000YVfMNF1pI7HB_hFvXurmjIHS79otUSjz' },
  { name: 'Nint', tiktokAccountId: '_00072RTMsPFhEL10pmqxrP8iXYJexyvlAyO' },
  { name: 'DruITZ', tiktokAccountId: '_0003zN8N5BV50TkS3DvTpFvJh7m5cM5Wr0I' },
  { name: 'Losmonos Mexican', tiktokAccountId: '_000Y5wLJHEGpyqzM-XcbtlQ5tk6WyqQ5SZ3' },
  { name: 'Smokey Monkies BBQ', tiktokAccountId: '_000g67wQQwlxH9259tRnAAcrxOAq_xueSOP' },
  { name: 'Drink Station', tiktokAccountId: '_000LrXYRnU_QVr9NL3SYDWjts-MEPsikmUs' },
  { name: 'Trófea Grill Étterem', tiktokAccountId: '_000baZoN0pwFvd9Tbl0eO6PCuocEsMx1l4I' },
  { name: 'CAP Marketing', tiktokAccountId: '_000AsjG8AtBUD-14DwxeUet7n3HjUg1RiOJ' },
  { name: 'TODO', tiktokAccountId: '_000XWJRA8c2xG8sY3h33TSWCL203M1Tlr_D' },
];

async function main() {
  console.log('Seeding database...');

  // Create companies
  for (const company of companies) {
    const created = await prisma.company.upsert({
      where: { id: company.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') },
      update: { name: company.name, tiktokAccountId: company.tiktokAccountId },
      create: {
        name: company.name,
        tiktokAccountId: company.tiktokAccountId,
        status: 'ACTIVE',
      },
    });
    console.log(`  Company: ${created.name} (${created.id})`);
  }

  // Create admin user from env vars
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@capmarketing.hu';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: adminEmail,
      name: 'Admin',
      passwordHash,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });
  console.log(`  Admin user: ${admin.email} (${admin.id})`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
