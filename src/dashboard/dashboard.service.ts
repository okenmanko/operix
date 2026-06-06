import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const clientsCount = await this.prisma.client.count();
    const debtsCount = await this.prisma.debt.count();
    const paymentsCount = await this.prisma.payment.count();

    const uzsDebts = await this.prisma.debt.aggregate({
      where: { currency: 'UZS' },
      _sum: { amount: true },
    });

    const usdDebts = await this.prisma.debt.aggregate({
      where: { currency: 'USD' },
      _sum: { amount: true },
    });

    const todayPaymentsUZS = await this.prisma.payment.aggregate({
      where: {
        currency: 'UZS',
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    const todayPaymentsUSD = await this.prisma.payment.aggregate({
      where: {
        currency: 'USD',
        createdAt: { gte: todayStart },
      },
      _sum: { amount: true },
    });

    const overdueDebtsCount = await this.prisma.debt.count({
      where: {
        status: 'ACTIVE',
        dueDate: { lt: new Date() },
      },
    });

    const topDebtors = await this.prisma.debt.findMany({
      take: 5,
      orderBy: { amount: 'desc' },
      include: {
        client: true,
        payments: true,
      },
    });

    return {
      clientsCount,
      debtsCount,
      paymentsCount,
      totalDebtsUZS: uzsDebts._sum.amount || 0,
      totalDebtsUSD: usdDebts._sum.amount || 0,
      todayPaymentsUZS: todayPaymentsUZS._sum.amount || 0,
      todayPaymentsUSD: todayPaymentsUSD._sum.amount || 0,
      overdueDebtsCount,
      topDebtors,
    };
  }
}