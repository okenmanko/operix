const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const SUPER_ADMIN_PHONE = '+998 88 296 25 00';
const SUPER_ADMIN_PASSWORD = '16317342826gvrgqqs3w';

async function main() {
  const password = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);

  const company = await prisma.company.upsert({
    where: { id: 'operix-super-admin-company' },
    update: {
      name: 'Operix Admin',
      phone: SUPER_ADMIN_PHONE,
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      enabledModules: [
        'CRM',
        'HR',
        'DELIVERY',
        'MOYSKLAD',
        'ONE_C',
        'ANALYTICS',
        'KPI',
        'AI_DIRECTOR',
      ],
    },
    create: {
      id: 'operix-super-admin-company',
      name: 'Operix Admin',
      phone: SUPER_ADMIN_PHONE,
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      enabledModules: [
        'CRM',
        'HR',
        'DELIVERY',
        'MOYSKLAD',
        'ONE_C',
        'ANALYTICS',
        'KPI',
        'AI_DIRECTOR',
      ],
    },
  });

  await prisma.user.deleteMany({
    where: {
      OR: [
        { phone: SUPER_ADMIN_PHONE },
        { phone: '998882962500' },
        { phone: '+998882962500' },
      ],
    },
  });

  await prisma.user.create({
    data: {
      fullName: 'Aziz',
      phone: SUPER_ADMIN_PHONE,
      password,
      role: 'SUPER_ADMIN',
      isActive: true,
      companyId: company.id,
    },
  });

  console.log('✅ SUPER ADMIN READY');
  console.log('Login:', SUPER_ADMIN_PHONE);
  console.log('Password:', SUPER_ADMIN_PASSWORD);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
