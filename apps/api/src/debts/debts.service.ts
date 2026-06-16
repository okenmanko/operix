import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    const debts = await this.prisma.debt.findMany({
      where: {
        client: { companyId },
      },
      include: {
        client: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return debts.map((debt: any) => {
      const paidAmount = (debt.payments || [])
        .filter((payment: any) => payment.currency === debt.currency)
        .reduce((sum: number, payment: any) => sum + Number(payment.amount || 0), 0);

      return {
        ...debt,
        paidAmount,
        remainingAmount: Number(debt.amount || 0) - paidAmount,
      };
    });
  }

  async create(companyId: string, body: any) {
    const client = await this.prisma.client.findFirst({
      where: { id: body.clientId, companyId },
    });

    if (!client) throw new NotFoundException('Mijoz topilmadi');

    return this.prisma.debt.create({
      data: {
        clientId: client.id,
        amount: Number(body.amount || 0),
        currency: body.currency || 'UZS',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        comment: body.comment || null,
        status: body.status || 'ACTIVE',
      },
      include: { client: true, payments: true },
    });
  }

  async update(companyId: string, id: string, body: any) {
    const debt = await this.prisma.debt.findFirst({
      where: {
        id,
        client: { companyId },
      },
      include: { client: true },
    });

    if (!debt) throw new NotFoundException('Qarz topilmadi');

    return this.prisma.debt.update({
      where: { id },
      data: {
        amount: body.amount !== undefined ? Number(body.amount) : debt.amount,
        currency: body.currency || debt.currency,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : debt.dueDate,
        comment: body.comment !== undefined ? body.comment : debt.comment,
        status: body.status || debt.status,
      },
      include: { client: true, payments: true },
    });
  }

  async remove(companyId: string, id: string) {
    const debt = await this.prisma.debt.findFirst({
      where: { id, client: { companyId } },
    });

    if (!debt) throw new NotFoundException('Qarz topilmadi');

    await this.prisma.payment.deleteMany({ where: { debtId: id } });
    await this.prisma.debt.delete({ where: { id } });

    return { ok: true };
  }

  async exportExcel(companyId: string) {
    const debts = await this.findAll(companyId);

    const rows = debts.map((debt: any, index: number) => ({
      Nomer: index + 1,
      Mijoz: debt.client?.fullName || '',
      Telefon: debt.client?.phone || '',
      Summa: debt.amount,
      Valyuta: debt.currency,
      Tolangan: debt.paidAmount || 0,
      Qoldiq: debt.remainingAmount || debt.amount,
      Muddat: debt.dueDate || '',
      Status: debt.status,
      Izoh: debt.comment || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 16 }, { wch: 10 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 30 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Debts');

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}
