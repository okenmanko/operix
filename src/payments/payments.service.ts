import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: {
    debtId: string;
    amount: number;
    currency: string;
    method?: string;
    comment?: string;
  }) {
    return this.prisma.payment.create({
      data: {
        debtId: data.debtId,
        amount: Number(data.amount),
        currency: data.currency,
        method: data.method,
        comment: data.comment,
      },
      include: {
        debt: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  findAll(debtId?: string) {
    return this.prisma.payment.findMany({
      where: debtId ? { debtId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        debt: {
          include: {
            client: true,
          },
        },
      },
    });
  }
}