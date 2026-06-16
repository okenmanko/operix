import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function asNumber(value: any) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

@Injectable()
export class CashflowService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(companyId: string) {
    const [income, expense, transfers, recent] = await Promise.all([
      this.prisma.cashflow.aggregate({
        where: { companyId, type: 'INCOME' },
        _sum: { amount: true },
      }),
      this.prisma.cashflow.aggregate({
        where: { companyId, type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      this.prisma.cashflow.aggregate({
        where: { companyId, type: 'TRANSFER' },
        _sum: { amount: true },
      }),
      this.prisma.cashflow.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const totalIncome = income._sum.amount || 0;
    const totalExpense = expense._sum.amount || 0;

    return {
      income: totalIncome,
      expense: totalExpense,
      transfer: transfers._sum.amount || 0,
      balance: totalIncome - totalExpense,
      recent,
    };
  }

  async list(
    companyId: string,
    params?: {
      type?: string;
      category?: string;
      method?: string;
      search?: string;
    },
  ) {
    return this.prisma.cashflow.findMany({
      where: {
        companyId,
        type: params?.type || undefined,
        category: params?.category || undefined,
        method: params?.method || undefined,
        OR: params?.search
          ? [
              { description: { contains: params.search, mode: 'insensitive' } },
              { category: { contains: params.search, mode: 'insensitive' } },
              { method: { contains: params.search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async create(companyId: string, data: any) {
    const type = String(data.type || '').trim().toUpperCase();
    const amount = asNumber(data.amount);

    if (!['INCOME', 'EXPENSE', 'TRANSFER'].includes(type)) {
      throw new BadRequestException('type INCOME / EXPENSE / TRANSFER bo‘lishi kerak');
    }

    if (amount <= 0) {
      throw new BadRequestException('Summa 0 dan katta bo‘lishi kerak');
    }

    return this.prisma.cashflow.create({
      data: {
        companyId,
        type,
        amount,
        currency: data.currency || 'UZS',
        category: data.category?.trim() || null,
        method: data.method?.trim() || null,
        description: data.description?.trim() || null,
        referenceId: data.referenceId?.trim() || null,
      },
    });
  }

  async update(companyId: string, id: string, data: any) {
    await this.ensure(companyId, id);

    return this.prisma.cashflow.update({
      where: { id },
      data: {
        type: data.type !== undefined ? String(data.type).toUpperCase() : undefined,
        amount: data.amount !== undefined ? asNumber(data.amount) : undefined,
        currency: data.currency || undefined,
        category: data.category !== undefined ? data.category?.trim() || null : undefined,
        method: data.method !== undefined ? data.method?.trim() || null : undefined,
        description: data.description !== undefined ? data.description?.trim() || null : undefined,
        referenceId: data.referenceId !== undefined ? data.referenceId?.trim() || null : undefined,
      },
    });
  }

  async remove(companyId: string, id: string) {
    await this.ensure(companyId, id);
    await this.prisma.cashflow.delete({ where: { id } });
    return { ok: true };
  }

  async categories(companyId: string) {
    const rows = await this.prisma.cashflow.findMany({
      where: { companyId },
      select: { category: true, method: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    return {
      categories: Array.from(new Set(rows.map((r) => r.category).filter(Boolean))),
      methods: Array.from(new Set(rows.map((r) => r.method).filter(Boolean))),
    };
  }

  private async ensure(companyId: string, id: string) {
    const item = await this.prisma.cashflow.findFirst({ where: { companyId, id } });
    if (!item) throw new NotFoundException('DDS operatsiya topilmadi');
    return item;
  }
}
