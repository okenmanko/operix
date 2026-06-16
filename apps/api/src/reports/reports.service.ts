import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async report(companyId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { client: { companyId } },
      include: { client: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    const payments = await this.prisma.payment.findMany({
      where: { debt: { client: { companyId } } },
      include: { debt: { include: { client: true } } },
      orderBy: { createdAt: 'desc' },
    });

    let totalDebtsUZS = 0;
    let totalDebtsUSD = 0;
    let totalPaidUZS = 0;
    let totalPaidUSD = 0;

    const debtRows = debts.map((debt: any) => {
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

    const active = debtRows.filter((debt) => debt.status !== 'CLOSED' && debt.remaining > 0);
    const closed = debtRows.filter((debt) => debt.status === 'CLOSED' || debt.remaining <= 0);
    const now = new Date();
    const overdue = active.filter((debt) => debt.dueDate && new Date(debt.dueDate) < now);

    const dailyPayments = payments.slice(0, 20).map((payment: any) => ({
      id: payment.id,
      clientName: payment.debt?.client?.fullName || '',
      amount: Number(payment.amount || 0),
      currency: payment.currency,
      method: payment.method,
      createdAt: payment.createdAt,
    }));

    const topDebtors = active
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 20);

    return {
      statuses: {
        active: active.length,
        closed: closed.length,
        overdue: overdue.length,
      },
      uzs: {
        totalDebt: totalDebtsUZS,
        paid: totalPaidUZS,
        remaining: totalDebtsUZS - totalPaidUZS,
      },
      usd: {
        totalDebt: totalDebtsUSD,
        paid: totalPaidUSD,
        remaining: totalDebtsUSD - totalPaidUSD,
      },
      dailyPayments,
      topDebtors,
    };
  }
}
