const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const negative = await prisma.debt.findMany({
    where: {
      amount: {
        lte: 0,
      },
    },
    select: {
      id: true,
      amount: true,
      currency: true,
      comment: true,
      client: {
        select: {
          fullName: true,
          phone: true,
        },
      },
    },
  });

  console.log('Negative / zero debts found:', negative.length);

  for (const debt of negative.slice(0, 20)) {
    console.log({
      client: debt.client?.fullName,
      phone: debt.client?.phone,
      amount: debt.amount,
      currency: debt.currency,
      comment: debt.comment,
    });
  }

  const deleted = await prisma.debt.deleteMany({
    where: {
      amount: {
        lte: 0,
      },
    },
  });

  console.log('Deleted:', deleted.count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
