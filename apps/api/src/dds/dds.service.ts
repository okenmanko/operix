import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

@Injectable()
export class DdsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(companyId: string, data: any) {
    return this.prisma.cashflow.create({
      data: {
        companyId,
        type: data.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
        amount: Number(data.amount || 0),
        currency: data.currency || 'UZS',
        category: data.category || null,
        method: data.method || null,
        description: data.description || null,
        referenceId: data.referenceId || null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      },
    });
  }

  async list(companyId: string, query: any) {
    return this.prisma.cashflow.findMany({
      where: {
        companyId,
        ...(query.type ? { type: query.type } : {}),
        ...(query.currency ? { currency: query.currency } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Number(query.take || 100),
    });
  }

  async summary(companyId: string, currency = 'UZS') {
    const rows = await this.prisma.cashflow.findMany({ where: { companyId, currency } });
    const income = rows.filter((x) => x.type === 'INCOME').reduce((s, x) => s + x.amount, 0);
    const expense = rows.filter((x) => x.type === 'EXPENSE').reduce((s, x) => s + x.amount, 0);
    return { income, expense, profit: income - expense, currency, count: rows.length };
  }

  async monthly(companyId: string, currency = 'UZS', months = 12) {
    const from = new Date();
    from.setMonth(from.getMonth() - months + 1);
    from.setDate(1);
    from.setHours(0, 0, 0, 0);

    const rows = await this.prisma.cashflow.findMany({
      where: { companyId, currency, createdAt: { gte: from } },
      orderBy: { createdAt: 'asc' },
    });

    const map = new Map<string, { month: string; income: number; expense: number; profit: number }>();
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = monthKey(d);
      map.set(key, { month: key, income: 0, expense: 0, profit: 0 });
    }

    rows.forEach((row) => {
      const key = monthKey(row.createdAt);
      const item = map.get(key) || { month: key, income: 0, expense: 0, profit: 0 };
      if (row.type === 'INCOME') item.income += row.amount;
      if (row.type === 'EXPENSE') item.expense += row.amount;
      item.profit = item.income - item.expense;
      map.set(key, item);
    });

    return Array.from(map.values());
  }

  async categories(companyId: string, currency = 'UZS') {
    const rows = await this.prisma.cashflow.findMany({ where: { companyId, currency } });
    const grouped = new Map<string, { category: string; income: number; expense: number }>();
    rows.forEach((row) => {
      const category = row.category || 'Boshqa';
      const item = grouped.get(category) || { category, income: 0, expense: 0 };
      if (row.type === 'INCOME') item.income += row.amount;
      if (row.type === 'EXPENSE') item.expense += row.amount;
      grouped.set(category, item);
    });
    return Array.from(grouped.values()).sort((a, b) => b.income + b.expense - (a.income + a.expense));
  }
}
