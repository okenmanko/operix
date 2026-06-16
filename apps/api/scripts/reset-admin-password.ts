import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = '16317342826gvrgqqs3w';
  const hash = await bcrypt.hash(password, 10);

  const result = await prisma.user.updateMany({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { phone: '+998 88 296 25 00' },
        { phone: '+998882962500' },
      ],
    },
    data: {
      password: hash,
      phone: '+998882962500',
      isActive: true,
    },
  });

  console.log('UPDATED:', result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });