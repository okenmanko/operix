import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

type ImportDebtItem = {
  fullName: string;
  phone: string;
  dueDate: Date | null;
  usdAmount: number;
  uzsAmount: number;
  rowNumber: number;
};

@Injectable()
export class DebtsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(companyId: string) {
    const debts = await this.prisma.debt.findMany({
      where: { client: { companyId } },
      include: { client: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });

    return debts.map((debt: any) => {
      const currency = this.normalizeCurrency(debt.currency);
      const paidAmount = (debt.payments || [])
        .filter((payment: any) => this.normalizeCurrency(payment.currency) === currency)
        .reduce((sum: number, payment: any) => sum + this.safeNumber(payment.amount), 0);
      const remainingAmount = Math.max(0, this.safeNumber(debt.amount) - paidAmount);

      return { ...debt, currency, paidAmount, remainingAmount };
    });
  }

  async create(companyId: string, body: any) {
    const client = await this.prisma.client.findFirst({ where: { id: body.clientId, companyId } });
    if (!client) throw new NotFoundException('Mijoz topilmadi');

    return this.prisma.debt.create({
      data: {
        clientId: client.id,
        amount: this.safeNumber(body.amount),
        currency: this.normalizeCurrency(body.currency),
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        comment: body.comment || null,
        status: body.status || 'ACTIVE',
      },
      include: { client: true, payments: true },
    });
  }

  async update(companyId: string, id: string, body: any) {
    const debt = await this.prisma.debt.findFirst({ where: { id, client: { companyId } }, include: { client: true } });
    if (!debt) throw new NotFoundException('Qarz topilmadi');

    return this.prisma.debt.update({
      where: { id },
      data: {
        amount: body.amount !== undefined ? this.safeNumber(body.amount) : debt.amount,
        currency: body.currency ? this.normalizeCurrency(body.currency) : debt.currency,
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : debt.dueDate,
        comment: body.comment !== undefined ? body.comment : debt.comment,
        status: body.status || debt.status,
      },
      include: { client: true, payments: true },
    });
  }

  async remove(companyId: string, id: string) {
    const debt = await this.prisma.debt.findFirst({ where: { id, client: { companyId } } });
    if (!debt) throw new NotFoundException('Qarz topilmadi');

    await this.prisma.payment.deleteMany({ where: { debtId: id } });
    await this.prisma.debt.delete({ where: { id } });
    return { ok: true };
  }

  async importExcel(companyId: string, buffer?: Buffer, mode = 'replace') {
    if (!buffer?.length) throw new BadRequestException('Excel fayl topilmadi');

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new BadRequestException('Excel varaq topilmadi');

    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: '',
      blankrows: false,
      raw: false,
    });

    const rows = this.parseQarz13Rows(matrix);
    if (!rows.length) {
      throw new BadRequestException('Excel ichidan qarzdor topilmadi. Format: 4-qator header, A=Nomer, B=Klient, C=Tel, D=Srok, E=Dollar, F=Sum.');
    }

    if (mode === 'replace') {
      await this.prisma.debt.deleteMany({
        where: {
          client: { companyId },
          comment: { contains: 'EXCEL_IMPORT' },
        },
      });
    }

    let clientsCreated = 0;
    let clientsUpdated = 0;
    let debtsCreated = 0;
    let skipped = 0;
    let totalUZS = 0;
    let totalUSD = 0;

    for (const row of rows) {
      if (!row.fullName) {
        skipped++;
        continue;
      }

      const debtsToCreate: Array<{ amount: number; currency: string }> = [];
      if (row.usdAmount > 0) debtsToCreate.push({ amount: row.usdAmount, currency: 'USD' });
      if (row.uzsAmount > 0) debtsToCreate.push({ amount: row.uzsAmount, currency: 'UZS' });

      if (!debtsToCreate.length) {
        skipped++;
        continue;
      }

      let client = await this.findClient(companyId, row.fullName, row.phone);
      if (client) {
        client = await this.prisma.client.update({
          where: { id: client.id },
          data: {
            fullName: row.fullName,
            phone: row.phone || client.phone,
            normalizedPhone: row.phone || client.normalizedPhone,
          },
        });
        clientsUpdated++;
      } else {
        client = await this.prisma.client.create({
          data: {
            companyId,
            fullName: row.fullName,
            phone: row.phone || this.noPhone(companyId, row.fullName),
            normalizedPhone: row.phone || null,
            address: null,
            guarantorName: null,
            guarantorPhone: null,
            notes: 'EXCEL_IMPORT_CLIENT',
          },
        });
        clientsCreated++;
      }

      for (const item of debtsToCreate) {
        await this.prisma.debt.create({
          data: {
            clientId: client.id,
            amount: this.round2(item.amount),
            currency: item.currency,
            dueDate: row.dueDate,
            status: 'ACTIVE',
            comment: `EXCEL_IMPORT:QARZ13:ROW_${row.rowNumber}`,
          },
        });

        debtsCreated++;
        if (item.currency === 'USD') totalUSD += item.amount;
        else totalUZS += item.amount;
      }
    }

    return {
      ok: true,
      mode,
      rows: rows.length,
      clientsCreated,
      clientsUpdated,
      debtsCreated,
      skipped,
      totalUZS: this.round2(totalUZS),
      totalUSD: this.round2(totalUSD),
      message: `Excel import: ${debtsCreated} ta qarz, UZS ${this.round2(totalUZS).toLocaleString('ru-RU')}, USD ${this.round2(totalUSD).toLocaleString('ru-RU')}`,
    };
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
      { wch: 10 }, { wch: 34 }, { wch: 20 }, { wch: 16 }, { wch: 10 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 34 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Debts');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  private parseQarz13Rows(matrix: any[][]): ImportDebtItem[] {
    const result: ImportDebtItem[] = [];

    // QARZ13 format:
    // 4-qator: A=Nomer, B=Klient, C=Tel, D=Srok, E=Dollar, F=Sum
    // Data: 5-qator va pastga
    for (let i = 4; i < matrix.length; i++) {
      const row = matrix[i] || [];
      const fullName = String(row[1] || '').trim();
      const phone = this.normalizePhone(row[2]);
      const dueDate = this.parseExcelDate(row[3]);
      const usdAmount = this.safeNumber(row[4]);
      const uzsAmount = this.safeNumber(row[5]);

      if (!fullName && !phone && usdAmount <= 0 && uzsAmount <= 0) continue;
      if (!fullName) continue;

      result.push({
        fullName,
        phone,
        dueDate,
        usdAmount,
        uzsAmount,
        rowNumber: i + 1,
      });
    }

    return result;
  }

  private async findClient(companyId: string, fullName: string, normalizedPhone?: string) {
    if (normalizedPhone) {
      const byPhone = await this.prisma.client.findFirst({ where: { companyId, normalizedPhone } });
      if (byPhone) return byPhone;
    }
    return this.prisma.client.findFirst({ where: { companyId, fullName } });
  }

  private normalizePhone(value: any) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 9) return `998${digits}`;
    return digits;
  }

  private normalizeCurrency(value: any) {
    const raw = String(value || 'UZS').trim().toUpperCase();
    return raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ') ? 'USD' : 'UZS';
  }

  private parseExcelDate(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    const raw = String(value).trim();
    if (!raw) return null;

    const m = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]) - 1;
      let year = Number(m[3]);
      if (year < 100) year += 2000;
      const date = new Date(year, month, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private safeNumber(value: any) {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.abs(value) : 0;

    const raw = String(value).trim();
    if (!raw) return 0;

    const clean = raw
      .replace(/\u00A0/g, ' ')
      .replace(/\s/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '');

    if (!clean || clean === '-' || clean === '.') return 0;

    const normalized = clean.includes('.')
      ? clean.replace(/\.(?=.*\.)/g, '')
      : clean;

    const n = Number(normalized);
    return Number.isFinite(n) ? Math.abs(n) : 0;
  }

  private noPhone(companyId: string, key: string) {
    return `excel-no-phone-${companyId.slice(0, 6)}-${String(key).replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || Date.now()}`;
  }

  private round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
