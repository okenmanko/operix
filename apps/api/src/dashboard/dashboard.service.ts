import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(companyId?: string) {
    const clientWhere = companyId ? { companyId } : {};
    const debtWhere = companyId ? { client: { companyId } } : {};
    const paymentWhere = companyId ? { debt: { client: { companyId } } } : {};

    const [clientsCount, debts, payments] = await Promise.all([
      this.prisma.client.count({ where: clientWhere }),
      this.prisma.debt.findMany({
        where: debtWhere,
        include: { client: true, payments: true },
      }),
      this.prisma.payment.findMany({
        where: paymentWhere,
        include: { debt: { include: { client: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let totalDebtsUZS = 0;
    let totalDebtsUSD = 0;
    let totalPaidUZS = 0;
    let totalPaidUSD = 0;

    const debtCards = debts.map((debt: any) => {
      const paid = (debt.payments || [])
        .filter((payment: any) => payment.currency === debt.currency)
        .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);

      const amount = Number(debt.amount || 0);
      const remaining = amount - paid;

      if (debt.currency === 'UZS') {
        totalDebtsUZS += amount;
        totalPaidUZS += paid;
      }

      if (debt.currency === 'USD') {
        totalDebtsUSD += amount;
        totalPaidUSD += paid;
      }

      return {
        id: debt.id,
        clientName: debt.client?.fullName || '',
        phone: debt.client?.phone || '',
        amount,
        currency: debt.currency,
        paid,
        remaining,
        status: debt.status,
        dueDate: debt.dueDate,
      };
    });

    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    const todayPayments = payments.filter((payment: any) =>
      new Date(payment.createdAt).toISOString().slice(0, 10) === todayKey,
    );

    const todayPaymentsUZS = todayPayments
      .filter((payment: any) => payment.currency === 'UZS')
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);

    const todayPaymentsUSD = todayPayments
      .filter((payment: any) => payment.currency === 'USD')
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);

    const activeDebts = debtCards.filter((debt) => debt.status !== 'CLOSED' && debt.remaining > 0);

    return {
      clientsCount,
      debtsCount: debts.length,
      activeDebtsCount: activeDebts.length,
      paymentsCount: payments.length,

      totalDebtsUZS,
      totalDebtsUSD,
      totalPaidUZS,
      totalPaidUSD,
      remainingUZS: totalDebtsUZS - totalPaidUZS,
      remainingUSD: totalDebtsUSD - totalPaidUSD,

      todayPaymentsUZS,
      todayPaymentsUSD,

      topDebtorsUZS: activeDebts
        .filter((debt) => debt.currency === 'UZS')
        .sort((a, b) => b.remaining - a.remaining)
        .slice(0, 10),

      topDebtorsUSD: activeDebts
        .filter((debt) => debt.currency === 'USD')
        .sort((a, b) => b.remaining - a.remaining)
        .slice(0, 10),

      recentPayments: payments.slice(0, 10),
    };
  }
}
