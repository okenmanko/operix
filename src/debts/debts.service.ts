import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  private addRemainingAmount(debt: any) {
    const paidAmount = debt.payments.reduce(
      (sum: number, payment: any) => sum + Number(payment.amount),
      0,
    );

    return {
      ...debt,
      paidAmount,
      remainingAmount: Number(debt.amount) - paidAmount,
    };
  }

  async create(data: {
    clientId: string;
    amount: number;
    currency: string;
    dueDate?: string;
    comment?: string;
  }) {
    const debt = await this.prisma.debt.create({
      data: {
        clientId: data.clientId,
        amount: Number(data.amount),
        currency: data.currency,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        comment: data.comment,
      },
      include: {
        client: true,
        payments: true,
      },
    });

    return this.addRemainingAmount(debt);
  }

  async findAll(clientId?: string) {
    const debts = await this.prisma.debt.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        payments: true,
      },
    });

    return debts.map((debt) => this.addRemainingAmount(debt));
  }
}