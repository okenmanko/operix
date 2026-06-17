import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('operix123', 10);

  const company = await prisma.company.upsert({
    where: { id: 'operix-super-company' },
    update: {},
    create: {
      id: 'operix-super-company',
      name: 'Operix Super Admin',
      phone: '+998882962500',
      status: 'ACTIVE',
      subscriptionPlan: 'PRO',
      enabledModules: [
        'CRM',
        'DEBTS',
        'PAYMENTS',
        'REPORTS',
        'INVENTORY',
        'WAREHOUSES',
        'QR',
        'STOCK',
        'DELIVERY',
        'DDS',
        'ANALYTICS',
        'POS',
        'HR',
        'KPI',
        'AI_DIRECTOR',
      ],
    },
  });

  await prisma.user.upsert({
    where: { phone: '+998882962500' },
    update: {
      password,
      role: 'SUPER_ADMIN',
      isActive: true,
      companyId: company.id,
    },
    create: {
      fullName: 'Super Admin',
      phone: '+998882962500',
      password,
      role: 'SUPER_ADMIN',
      isActive: true,
      companyId: company.id,
    },
  });

  console.log('✅ Super Admin yaratildi');
  console.log('Phone: +998882962500');
  console.log('Password: operix123');
  console.log('Master key: OPERIX_MASTER_KEY_2026');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });