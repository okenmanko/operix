import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

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
      const remainingAmount = this.round2(Math.max(0, this.safeNumber(debt.amount) - paidAmount));

      return {
        ...debt,
        currency,
        paidAmount: this.round2(paidAmount),
        remainingAmount,
      };
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
    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    });

    if (!matrix.length) throw new BadRequestException('Excel bo‘sh');

    if (mode === 'replace') {
      await this.prisma.payment.deleteMany({ where: { debt: { client: { companyId } } } });
      await this.prisma.debt.deleteMany({ where: { client: { companyId } } });
    }

    let rowsRead = 0;
    let rowsProcessed = 0;
    let clientsCreated = 0;
    let clientsUpdated = 0;
    let debtsCreated = 0;
    let skipped = 0;
    let negativeRows = 0;
    let totalUZS = 0;
    let totalUSD = 0;
    const skippedRows: Array<{ row: number; reason: string; name?: string }> = [];

    // QARZ13 format:
    // 4-qator header: A=Nomer, B=Klient, C=Tel, D=Srok, E=Dollar, F=Sum
    // 5-qator data boshlanadi. 0-based index = 4.
    for (let index = 4; index < matrix.length; index++) {
      const row = matrix[index] || [];
      const excelRow = index + 1;
      const name = this.cleanText(row[1]);
      const phoneRaw = this.cleanText(row[2]);
      const dueDate = this.parseDate(row[3]);
      const usdAmount = this.safeNumber(row[4]);
      const uzsAmount = this.safeNumber(row[5]);

      const rawAny = row.map((x) => this.cleanText(x)).join('').trim();
      if (!rawAny) continue;
      rowsRead++;

      if (this.isTotalRow(name) || this.isUnknownClient(name)) {
        skipped++;
        skippedRows.push({ row: excelRow, reason: 'TOTAL_OR_UNKNOWN', name });
        continue;
      }

      if (!name) {
        skipped++;
        skippedRows.push({ row: excelRow, reason: 'NO_CLIENT_NAME' });
        continue;
      }

      const debtsToCreate: Array<{ amount: number; currency: 'USD' | 'UZS' }> = [];

      if (usdAmount < 0 || uzsAmount < 0) {
        negativeRows++;
        skipped++;
        skippedRows.push({ row: excelRow, reason: 'NEGATIVE_AMOUNT_SKIPPED', name });
        continue;
      }

      if (usdAmount > 0) debtsToCreate.push({ amount: this.round2(usdAmount), currency: 'USD' });
      if (uzsAmount > 0) debtsToCreate.push({ amount: this.round2(uzsAmount), currency: 'UZS' });

      if (!debtsToCreate.length) {
        skipped++;
        skippedRows.push({ row: excelRow, reason: 'NO_DEBT_AMOUNT', name });
        continue;
      }

      const normalizedPhone = this.normalizePhone(phoneRaw);
      let client = await this.findClient(companyId, name, normalizedPhone);

      if (client) {
        client = await this.prisma.client.update({
          where: { id: client.id },
          data: {
            fullName: name,
            phone: phoneRaw || client.phone,
            normalizedPhone: normalizedPhone || client.normalizedPhone,
            notes: this.mergeNote(client.notes, 'EXCEL_QARZ13_CLIENT'),
          },
        });
        clientsUpdated++;
      } else {
        client = await this.prisma.client.create({
          data: {
            companyId,
            fullName: name,
            phone: phoneRaw || this.noPhone(companyId, name, excelRow),
            normalizedPhone: normalizedPhone || null,
            address: null,
            guarantorName: null,
            guarantorPhone: null,
            notes: 'EXCEL_QARZ13_CLIENT',
          },
        });
        clientsCreated++;
      }

      for (const item of debtsToCreate) {
        await this.prisma.debt.create({
          data: {
            clientId: client.id,
            amount: item.amount,
            currency: item.currency,
            dueDate,
            status: 'ACTIVE',
            comment: `EXCEL_QARZ13_ROW:${excelRow}`,
          },
        });
        debtsCreated++;
        if (item.currency === 'USD') totalUSD += item.amount;
        else totalUZS += item.amount;
      }

      rowsProcessed++;
    }

    return {
      ok: true,
      source: 'EXCEL_QARZ13',
      mode,
      rowsRead,
      rowsProcessed,
      clientsCreated,
      clientsUpdated,
      debtsCreated,
      skipped,
      negativeRows,
      totalUZS: this.round2(totalUZS),
      totalUSD: this.round2(totalUSD),
      importedUzsTotal: this.round2(totalUZS),
      importedUsdTotal: this.round2(totalUSD),
      skippedRows: skippedRows.slice(0, 30),
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
      Muddat: debt.dueDate ? new Date(debt.dueDate).toLocaleDateString('ru-RU') : '',
      Status: debt.status,
      Izoh: debt.comment || '',
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 10 }, { wch: 34 }, { wch: 28 }, { wch: 16 }, { wch: 10 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }, { wch: 34 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Debts');
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }

  private async findClient(companyId: string, fullName: string, normalizedPhone?: string) {
    if (normalizedPhone) {
      const byPhone = await this.prisma.client.findFirst({ where: { companyId, normalizedPhone } });
      if (byPhone) return byPhone;
    }
    return this.prisma.client.findFirst({ where: { companyId, fullName } });
  }

  private cleanText(value: any) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
  }

  private isUnknownClient(name: string) {
    const raw = this.cleanText(name).toLowerCase();
    return raw === 'неизвестный' || raw === 'unknown' || raw === 'no name' || raw === 'nomsiz';
  }

  private isTotalRow(name: string) {
    const raw = this.cleanText(name).toLowerCase();
    return raw.includes('итог') || raw.includes('jami') || raw.includes('total');
  }

  private parseDate(value: any) {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const raw = this.cleanText(value);
    const match = raw.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})$/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3]);
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizePhone(value: any) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    const uzPhone = digits.match(/(?:998)?\d{9}/)?.[0] || digits.slice(0, 12);
    if (uzPhone.length === 9) return `998${uzPhone}`;
    return uzPhone;
  }

  private normalizeCurrency(value: any) {
    const raw = String(value || 'UZS').trim().toUpperCase();
    return raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ') ? 'USD' : 'UZS';
  }

  private safeNumber(value: any) {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

    const raw = String(value).trim();
    if (!raw) return 0;

    const hasNegative = /^\s*-/.test(raw);
    const clean = raw
      .replace(/\s/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '');
    const normalized = clean.includes('.') ? clean.replace(/\.(?=.*\.)/g, '') : clean;
    const n = Number(normalized);
    if (!Number.isFinite(n)) return 0;
    return hasNegative || n < 0 ? -Math.abs(n) : Math.abs(n);
  }

  private noPhone(companyId: string, key: string, row: number) {
    return `excel-no-phone-${companyId.slice(0, 6)}-${row}-${String(key).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12) || Date.now()}`;
  }

  private mergeNote(oldNote?: string | null, next?: string) {
    const clean = this.cleanText(next);
    if (!clean) return oldNote || null;
    if (String(oldNote || '').includes(clean)) return oldNote || null;
    return [oldNote, clean].filter(Boolean).join('\n');
  }

  private round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
