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
      const remainingAmount = Math.max(0, this.safeNumber(debt.amount) - paidAmount);
      return { ...debt, currency, paidAmount: this.round2(paidAmount), remainingAmount: this.round2(remainingAmount) };
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

    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: false });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) throw new BadRequestException('Excel sheet topilmadi');

    // QARZ13 format:
    // 4-qator header: A=Nomer, B=Klient, C=Tel, D=Srok, E=Dollar, F=Sum
    // 5-qator data boshlanadi. 1-3 qator title/bo'sh bo'lishi mumkin.
    const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '', raw: false });
    const rows = matrix.slice(4); // Excel row 5+

    if (!rows.length) throw new BadRequestException('Excel bo‘sh');

    if (mode === 'replace') {
      // Excel/1C qarzlar yagona manba: importdan oldin company ichidagi barcha eski qarz/payments tozalanadi.
      await this.prisma.payment.deleteMany({
        where: { debt: { client: { companyId } } },
      });

      await this.prisma.debt.deleteMany({
        where: { client: { companyId } },
      });
    }

    let clientsCreated = 0;
    let clientsUpdated = 0;
    let debtsCreated = 0;
    let skipped = 0;
    let totalUZS = 0;
    let totalUSD = 0;

    for (const row of rows) {
      const fullName = this.cleanText(row?.[1]); // B
      const phone = this.normalizePhone(row?.[2]); // C
      const dueDate = this.parseExcelDate(row?.[3]); // D
      const usdAmount = this.safeNumber(row?.[4]); // E
      const uzsAmount = this.safeNumber(row?.[5]); // F

      if (this.shouldSkipRow(fullName, usdAmount, uzsAmount)) {
        skipped++;
        continue;
      }

      const debtsToCreate: Array<{ amount: number; currency: 'UZS' | 'USD' }> = [];
      if (usdAmount > 0) debtsToCreate.push({ amount: usdAmount, currency: 'USD' });
      if (uzsAmount > 0) debtsToCreate.push({ amount: uzsAmount, currency: 'UZS' });

      if (!debtsToCreate.length) {
        skipped++;
        continue;
      }

      let client = await this.findClient(companyId, fullName, phone);

      if (client) {
        client = await this.prisma.client.update({
          where: { id: client.id },
          data: {
            fullName,
            phone: phone || client.phone,
            normalizedPhone: phone || client.normalizedPhone,
            notes: this.mergeNote(client.notes, 'EXCEL_IMPORT_CLIENT'),
          },
        });
        clientsUpdated++;
      } else {
        client = await this.prisma.client.create({
          data: {
            companyId,
            fullName,
            phone: phone || this.noPhone(companyId, fullName),
            normalizedPhone: phone || null,
            address: null,
            guarantorName: null,
            guarantorPhone: null,
            notes: 'EXCEL_IMPORT_CLIENT',
          },
        });
        clientsCreated++;
      }

      for (const debt of debtsToCreate) {
        await this.prisma.debt.create({
          data: {
            clientId: client.id,
            amount: this.round2(debt.amount),
            currency: debt.currency,
            dueDate,
            status: 'ACTIVE',
            comment: `EXCEL_IMPORT:QARZ13:${debt.currency}`,
          },
        });

        debtsCreated++;
        if (debt.currency === 'USD') totalUSD += debt.amount;
        else totalUZS += debt.amount;
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

  private async findClient(companyId: string, fullName: string, normalizedPhone?: string) {
    if (normalizedPhone) {
      const byPhone = await this.prisma.client.findFirst({ where: { companyId, normalizedPhone } });
      if (byPhone) return byPhone;
    }
    return this.prisma.client.findFirst({ where: { companyId, fullName } });
  }

  private shouldSkipRow(fullName: string, usdAmount: number, uzsAmount: number) {
    const name = this.cleanText(fullName).toLowerCase();
    if (!name) return true;
    if (['итог', 'jami', 'total'].includes(name)) return true;
    if (name.includes('итог')) return true;
    if (name === 'неизвестный' || name === 'unknown') return true;
    if (usdAmount <= 0 && uzsAmount <= 0) return true;
    return false;
  }

  private cleanText(value: any) {
    return String(value ?? '').replace(/\s+/g, ' ').trim();
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

  private safeNumber(value: any) {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? Math.abs(value) : 0;

    const raw = String(value).trim();
    if (!raw) return 0;

    const clean = raw
      .replace(/\s/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '');

    if (!clean || clean === '-' || clean === '.') return 0;
    const normalized = clean.includes('.') ? clean.replace(/\.(?=.*\.)/g, '') : clean;
    const n = Number(normalized);
    return Number.isFinite(n) ? Math.abs(n) : 0;
  }

  private parseExcelDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    const text = String(value).trim();
    const match = text.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const year = Number(match[3]);
      return new Date(Date.UTC(year, month - 1, day));
    }

    const date = new Date(text);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private noPhone(companyId: string, key: string) {
    return `excel-no-phone-${companyId.slice(0, 6)}-${String(key).replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || Date.now()}`;
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
