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
    let activeDebts = 0;
    let closedDebts = 0;
    let overdueDebts = 0;

    const todayKey = new Date().toISOString().slice(0, 10);
    const now = new Date();

    const debtCards = debts.map((debt: any) => {
      const currency = this.normalizeCurrency(debt.currency);
      const amount = this.safeNumber(debt.amount);
      const paid = (debt.payments || [])
        .filter((payment: any) => this.normalizeCurrency(payment.currency) === currency)
        .reduce((sum: number, payment: any) => sum + this.safeNumber(payment.amount), 0);

      const remaining = Math.max(0, amount - paid);
      const isClosed = debt.status === 'CLOSED' || remaining <= 0;
      const isOverdue = !isClosed && debt.dueDate && new Date(debt.dueDate) < now;

      if (currency === 'USD') {
        totalDebtsUSD += amount;
        totalPaidUSD += paid;
      } else {
        totalDebtsUZS += amount;
        totalPaidUZS += paid;
      }

      if (isClosed) closedDebts += 1;
      else activeDebts += 1;
      if (isOverdue) overdueDebts += 1;

      return {
        id: debt.id,
        clientId: debt.clientId,
        clientName: debt.client?.fullName || '',
        fullName: debt.client?.fullName || '',
        phone: debt.client?.phone || '',
        amount,
        total: remaining,
        currency,
        paid,
        remaining,
        status: isClosed ? 'CLOSED' : debt.status || 'ACTIVE',
        dueDate: debt.dueDate,
      };
    });

    const todayPaymentsUZS = payments
      .filter((payment: any) => new Date(payment.createdAt).toISOString().slice(0, 10) === todayKey)
      .filter((payment: any) => this.normalizeCurrency(payment.currency) === 'UZS')
      .reduce((sum: number, payment: any) => sum + this.safeNumber(payment.amount), 0);

    const todayPaymentsUSD = payments
      .filter((payment: any) => new Date(payment.createdAt).toISOString().slice(0, 10) === todayKey)
      .filter((payment: any) => this.normalizeCurrency(payment.currency) === 'USD')
      .reduce((sum: number, payment: any) => sum + this.safeNumber(payment.amount), 0);

    const topDebtors = debtCards
      .filter((debt) => debt.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 20)
      .map((debt) => ({
        id: debt.id,
        clientId: debt.clientId,
        fullName: debt.fullName,
        clientName: debt.clientName,
        phone: debt.phone,
        total: debt.remaining,
        remaining: debt.remaining,
        currency: debt.currency,
      }));

    return {
      clientsCount,
      debtsCount: debts.length,
      paymentsCount: payments.length,
      activeDebts,
      closedDebts,
      overdueDebts,
      activeDebtsCount: activeDebts,

      totalDebtsUZS,
      totalDebtsUSD,
      totalPaidUZS,
      totalPaidUSD,
      remainingUZS: Math.max(0, totalDebtsUZS - totalPaidUZS),
      remainingUSD: Math.max(0, totalDebtsUSD - totalPaidUSD),

      todayPayments: todayPaymentsUZS,
      todayPaymentsUZS,
      todayPaymentsUSD,

      topDebtors,
      topDebtorsUZS: topDebtors.filter((item) => item.currency === 'UZS').slice(0, 10),
      topDebtorsUSD: topDebtors.filter((item) => item.currency === 'USD').slice(0, 10),
      recentPayments: payments.slice(0, 10),
    };
  }

  private safeNumber(value: any) {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }

  private normalizeCurrency(value: any) {
    const raw = String(value || 'UZS').trim().toUpperCase();
    return raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ') ? 'USD' : 'UZS';
  }
}
