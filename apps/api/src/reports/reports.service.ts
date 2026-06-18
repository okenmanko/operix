import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async report(companyId: string) {
    const [debts, payments] = await Promise.all([
      this.prisma.debt.findMany({
        where: { client: { companyId } },
        include: { client: true, payments: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.payment.findMany({
        where: { debt: { client: { companyId } } },
        include: { debt: { include: { client: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    let totalDebtsUZS = 0;
    let totalDebtsUSD = 0;
    let totalPaidUZS = 0;
    let totalPaidUSD = 0;

    const debtRows = debts.map((debt: any) => {
      const currency = this.normalizeCurrency(debt.currency);
      const paid = (debt.payments || [])
        .filter((payment: any) => this.normalizeCurrency(payment.currency) === currency)
        .reduce((sum: number, payment: any) => sum + this.safeNumber(payment.amount), 0);

      const amount = this.safeNumber(debt.amount);
      const remaining = Math.max(0, amount - paid);

      if (currency === 'UZS') {
        totalDebtsUZS += amount;
        totalPaidUZS += paid;
      } else {
        totalDebtsUSD += amount;
        totalPaidUSD += paid;
      }

      return {
        id: debt.id,
        fullName: debt.client?.fullName || '',
        clientName: debt.client?.fullName || '',
        phone: debt.client?.phone || '',
        amount,
        total: remaining,
        currency,
        paid,
        remaining,
        status: debt.status,
        dueDate: debt.dueDate,
      };
    });

    const active = debtRows.filter((debt) => debt.status !== 'CLOSED' && debt.remaining > 0);
    const closed = debtRows.filter((debt) => debt.status === 'CLOSED' || debt.remaining <= 0);
    const now = new Date();
    const overdue = active.filter((debt) => debt.dueDate && new Date(debt.dueDate) < now);

    const dailyMap = new Map<string, { date: string; total: number; currency: string }>();
    for (const payment of payments as any[]) {
      const currency = this.normalizeCurrency(payment.currency);
      const date = new Date(payment.createdAt).toISOString().slice(0, 10);
      const key = `${date}:${currency}`;
      const old = dailyMap.get(key) || { date, total: 0, currency };
      old.total += this.safeNumber(payment.amount);
      dailyMap.set(key, old);
    }

    const dailyPayments = Array.from(dailyMap.values())
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30);

    const topDebtors = active
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 30)
      .map((debt) => ({
        fullName: debt.fullName,
        clientName: debt.clientName,
        phone: debt.phone,
        total: debt.remaining,
        remaining: debt.remaining,
        currency: debt.currency,
      }));

    const payload = {
      activeDebts: active.length,
      closedDebts: closed.length,
      overdueDebts: overdue.length,
      totalDebtsUZS,
      totalDebtsUSD,
      totalPaidUZS,
      totalPaidUSD,
      remainingUZS: Math.max(0, totalDebtsUZS - totalPaidUZS),
      remainingUSD: Math.max(0, totalDebtsUSD - totalPaidUSD),
      statuses: { active: active.length, closed: closed.length, overdue: overdue.length },
      uzs: { totalDebt: totalDebtsUZS, paid: totalPaidUZS, remaining: Math.max(0, totalDebtsUZS - totalPaidUZS) },
      usd: { totalDebt: totalDebtsUSD, paid: totalPaidUSD, remaining: Math.max(0, totalDebtsUSD - totalPaidUSD) },
      dailyPayments,
      topDebtors,
      debtRows,
    };

    return payload;
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
