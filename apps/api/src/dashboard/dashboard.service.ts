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
        orderBy: { createdAt: 'desc' },
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

    const now = new Date();

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
        clientId: debt.clientId,
        fullName: debt.client?.fullName || '',
        clientName: debt.client?.fullName || '',
        phone: debt.client?.phone || '',
        amount,
        total: remaining,
        currency: debt.currency,
        paid,
        remaining,
        status: debt.status,
        dueDate: debt.dueDate,
      };
    });

    const todayKey = now.toISOString().slice(0, 10);

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
    const closedDebts = debtCards.filter((debt) => debt.status === 'CLOSED' || debt.remaining <= 0);
    const overdueDebts = activeDebts.filter((debt) => debt.dueDate && new Date(debt.dueDate) < now);

    const topDebtorsUZS = activeDebts
      .filter((debt) => debt.currency === 'UZS')
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 10);

    const topDebtorsUSD = activeDebts
      .filter((debt) => debt.currency === 'USD')
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 10);

    const topDebtors = activeDebts
      .slice()
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 10);

    return {
      clientsCount,
      debtsCount: debts.length,
      activeDebtsCount: activeDebts.length,
      activeDebts: activeDebts.length,
      closedDebts: closedDebts.length,
      overdueDebts: overdueDebts.length,
      paymentsCount: payments.length,

      totalDebtsUZS,
      totalDebtsUSD,
      totalPaidUZS,
      totalPaidUSD,
      remainingUZS: totalDebtsUZS - totalPaidUZS,
      remainingUSD: totalDebtsUSD - totalPaidUSD,

      todayPayments: todayPaymentsUZS,
      todayPaymentsUZS,
      todayPaymentsUSD,

      topDebtors,
      topDebtorsUZS,
      topDebtorsUSD,

      recentPayments: payments.slice(0, 10),
    };
  }
}
