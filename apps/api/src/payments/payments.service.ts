import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.payment.findMany({
      where: { debt: { client: { companyId } } },
      include: { debt: { include: { client: true, payments: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(companyId: string, body: any) {
    const debt = await this.prisma.debt.findFirst({
      where: { id: body.debtId, client: { companyId } },
      include: { payments: true, client: true },
    });

    if (!debt) throw new NotFoundException('Qarz topilmadi');

    const amount = Number(body.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('To‘lov summasi noto‘g‘ri');
    }

    const currency = this.normalizeCurrency(body.currency || debt.currency);
    const debtCurrency = this.normalizeCurrency(debt.currency);
    if (currency !== debtCurrency) {
      throw new BadRequestException(`Bu qarz valyutasi ${debtCurrency}. To‘lov ham ${debtCurrency} bo‘lishi kerak.`);
    }

    const remaining = await this.remainingAmount(debt.id);
    if (amount > remaining) {
      throw new BadRequestException(`To‘lov qoldiqdan katta. Qoldiq: ${remaining.toLocaleString('ru-RU')} ${debtCurrency}`);
    }

    const payment = await this.prisma.payment.create({
      data: {
        debtId: debt.id,
        amount,
        currency,
        method: body.method || 'CASH',
        comment: body.comment || null,
      },
      include: { debt: { include: { client: true } } },
    });

    await this.syncDebtStatus(debt.id);
    return payment;
  }

  async update(companyId: string, id: string, body: any) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, debt: { client: { companyId } } },
    });

    if (!payment) throw new NotFoundException('To‘lov topilmadi');

    const amount = body.amount !== undefined ? Number(body.amount) : Number(payment.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('To‘lov summasi noto‘g‘ri');
    }

    const updated = await this.prisma.payment.update({
      where: { id },
      data: {
        amount,
        currency: body.currency ? this.normalizeCurrency(body.currency) : payment.currency,
        method: body.method !== undefined ? body.method : payment.method,
        comment: body.comment !== undefined ? body.comment : payment.comment,
      },
      include: { debt: { include: { client: true } } },
    });

    await this.syncDebtStatus(payment.debtId);
    return updated;
  }

  async remove(companyId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, debt: { client: { companyId } } } });
    if (!payment) throw new NotFoundException('To‘lov topilmadi');

    await this.prisma.payment.delete({ where: { id } });
    await this.syncDebtStatus(payment.debtId);
    return { ok: true };
  }

  async syncDebtStatus(debtId: string) {
    const debt = await this.prisma.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
    if (!debt) return;

    const debtCurrency = this.normalizeCurrency(debt.currency);
    const paid = (debt.payments || [])
      .filter((payment: any) => this.normalizeCurrency(payment.currency) === debtCurrency)
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);

    const nextStatus = paid >= Number(debt.amount || 0) ? 'CLOSED' : 'ACTIVE';
    await this.prisma.debt.update({ where: { id: debt.id }, data: { status: nextStatus } });
  }

  async exportExcel(companyId: string) {
    const payments = await this.findAll(companyId);
    const rows = payments.map((payment: any, index: number) => ({
      Nomer: index + 1,
      Mijoz: payment.debt?.client?.fullName || '',
      Telefon: payment.debt?.client?.phone || '',
      Summa: payment.amount,
      Valyuta: payment.currency,
      Method: payment.method || '',
      Izoh: payment.comment || '',
      Sana: payment.createdAt,
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 16 },
      { wch: 10 }, { wch: 16 }, { wch: 30 }, { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  private async remainingAmount(debtId: string) {
    const debt = await this.prisma.debt.findUnique({ where: { id: debtId }, include: { payments: true } });
    if (!debt) return 0;
    const currency = this.normalizeCurrency(debt.currency);
    const paid = (debt.payments || [])
      .filter((payment: any) => this.normalizeCurrency(payment.currency) === currency)
      .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);
    return Math.max(0, Number(debt.amount || 0) - paid);
  }

  private normalizeCurrency(value: any) {
    const raw = String(value || 'UZS').trim().toUpperCase();
    return raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ') ? 'USD' : 'UZS';
  }
}
