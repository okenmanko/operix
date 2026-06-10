import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class DebtsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  private addRemainingAmount(debt: any) {
    const paidAmount = debt.payments
      .filter((payment: any) => payment.currency === debt.currency)
      .reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);

    return {
      ...debt,
      paidAmount,
      remainingAmount: Number(debt.amount) - paidAmount,
    };
  }

  async create(
    companyId: string,
    data: {
      clientId: string;
      amount: number;
      currency: string;
      dueDate?: string;
      comment?: string;
    },
  ) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        companyId,
      },
    });

    if (!client) {
      throw new NotFoundException('Mijoz topilmadi');
    }

    const debt = await this.prisma.debt.create({
      data: {
        clientId: data.clientId,
        amount: Number(data.amount),
        currency: data.currency,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        comment: data.comment?.trim() || null,
        status: 'ACTIVE',
      },
      include: {
        client: true,
        payments: true,
      },
    });

    await this.telegram.sendMessage(
      [
        '🧾 <b>Yangi qarz qo‘shildi</b>',
        '',
        `👤 Mijoz: <b>${this.telegram.safe(debt.client.fullName)}</b>`,
        `📞 Telefon: ${this.telegram.safe(debt.client.phone)}`,
        `💰 Summa: <b>${this.telegram.money(Number(debt.amount), debt.currency)}</b>`,
        `📅 Muddat: ${
          debt.dueDate
            ? new Date(debt.dueDate).toLocaleDateString('ru-RU')
            : '-'
        }`,
        `💬 Izoh: ${this.telegram.safe(debt.comment || '-')}`,
      ].join('\n'),
    );

    return this.addRemainingAmount(debt);
  }

  async findAll(companyId: string, clientId?: string) {
    const debts = await this.prisma.debt.findMany({
      where: {
        ...(clientId ? { clientId } : {}),
        client: {
          companyId,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        payments: true,
      },
    });

    return debts.map((debt) => this.addRemainingAmount(debt));
  }

  async close(companyId: string, id: string) {
    const debt = await this.prisma.debt.findFirst({
      where: {
        id,
        client: {
          companyId,
        },
      },
      include: {
        client: true,
        payments: true,
      },
    });

    if (!debt) {
      throw new NotFoundException('Qarz topilmadi');
    }

    const updatedDebt = await this.prisma.debt.update({
      where: { id },
      data: {
        status: 'CLOSED',
      },
      include: {
        client: true,
        payments: true,
      },
    });

    await this.telegram.sendMessage(
      [
        '✅ <b>Qarz yopildi</b>',
        '',
        `👤 Mijoz: <b>${this.telegram.safe(updatedDebt.client.fullName)}</b>`,
        `📞 Telefon: ${this.telegram.safe(updatedDebt.client.phone)}`,
        `💰 Qarz: <b>${this.telegram.money(Number(updatedDebt.amount), updatedDebt.currency)}</b>`,
      ].join('\n'),
    );

    return this.addRemainingAmount(updatedDebt);
  }

  async remove(companyId: string, id: string) {
    const debt = await this.prisma.debt.findFirst({
      where: {
        id,
        client: {
          companyId,
        },
      },
      include: {
        client: true,
        payments: true,
      },
    });

    if (!debt) {
      throw new NotFoundException('Qarz topilmadi');
    }

    await this.prisma.payment.deleteMany({
      where: {
        debtId: id,
      },
    });

    const deletedDebt = await this.prisma.debt.delete({
      where: { id },
    });

    await this.telegram.sendMessage(
      [
        '🗑 <b>Qarz o‘chirildi</b>',
        '',
        `👤 Mijoz: <b>${this.telegram.safe(debt.client.fullName)}</b>`,
        `📞 Telefon: ${this.telegram.safe(debt.client.phone)}`,
        `💰 Summa: <b>${this.telegram.money(Number(debt.amount), debt.currency)}</b>`,
      ].join('\n'),
    );

    return deletedDebt;
  }
}
