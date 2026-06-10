import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async create(
    companyId: string,
    data: {
      debtId: string;
      amount: number;
      currency: string;
      method?: string;
      comment?: string;
    },
  ) {
    const debt = await this.prisma.debt.findFirst({
      where: {
        id: data.debtId,
        client: {
          companyId,
        },
      },
      include: {
        payments: true,
        client: true,
      },
    });

    if (!debt) {
      throw new NotFoundException('Qarz topilmadi');
    }

    if (data.currency !== debt.currency) {
      throw new BadRequestException('To‘lov valyutasi qarz valyutasi bilan bir xil bo‘lishi kerak');
    }

    const payment = await this.prisma.payment.create({
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

    const paidAmount =
      debt.payments
        .filter((p) => p.currency === debt.currency)
        .reduce((sum, p) => sum + Number(p.amount), 0) + Number(data.amount);

    const remainingAmount = Number(debt.amount) - paidAmount;

    if (remainingAmount <= 0) {
      await this.prisma.debt.update({
        where: { id: debt.id },
        data: { status: 'PAID' },
      });
    } else if (paidAmount > 0) {
      await this.prisma.debt.update({
        where: { id: debt.id },
        data: { status: 'PARTIAL' },
      });
    }

    await this.telegram.sendMessage(
      [
        '💵 <b>Yangi to‘lov qo‘shildi</b>',
        '',
        `👤 Mijoz: <b>${this.telegram.safe(payment.debt.client.fullName)}</b>`,
        `📞 Telefon: ${this.telegram.safe(payment.debt.client.phone)}`,
        `💰 To‘lov: <b>${this.telegram.money(Number(payment.amount), payment.currency)}</b>`,
        `🏷 Usul: ${this.telegram.safe(payment.method)}`,
        `💬 Izoh: ${this.telegram.safe(payment.comment)}`,
      ].join('\n'),
    );

    return payment;
  }

  findAll(companyId: string, debtId?: string) {
    return this.prisma.payment.findMany({
      where: {
        ...(debtId ? { debtId } : {}),
        debt: {
          client: {
            companyId,
          },
        },
      },
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

  async remove(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id,
        debt: {
          client: {
            companyId,
          },
        },
      },
      include: {
        debt: {
          include: {
            client: true,
            payments: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('To‘lov topilmadi');
    }

    const deletedPayment = await this.prisma.payment.delete({
      where: { id },
    });

    const otherPayments = payment.debt.payments.filter((p) => p.id !== payment.id);
    const paidAmount = otherPayments
      .filter((p) => p.currency === payment.debt.currency)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    await this.prisma.debt.update({
      where: { id: payment.debt.id },
      data: {
        status: paidAmount <= 0 ? 'ACTIVE' : paidAmount >= Number(payment.debt.amount) ? 'PAID' : 'PARTIAL',
      },
    });

    await this.telegram.sendMessage(
      [
        '🗑 <b>To‘lov o‘chirildi</b>',
        '',
        `👤 Mijoz: <b>${this.telegram.safe(payment.debt.client.fullName)}</b>`,
        `💰 Summa: <b>${this.telegram.money(Number(payment.amount), payment.currency)}</b>`,
      ].join('\n'),
    );

    return deletedPayment;
  }
}
