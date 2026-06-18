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
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });

    if (!rows.length) throw new BadRequestException('Excel bo‘sh');

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
      const normalized = this.normalizeRow(row);
      const fullName = this.pick(normalized, ['mijoz', 'client', 'klient', 'kontragent', 'контрагент', 'клиент', 'fio', 'name', 'ism', 'fullname']);
      const phone = this.normalizePhone(this.pick(normalized, ['telefon', 'phone', 'tel', 'номер', 'телефон']));
      const address = this.pick(normalized, ['address', 'manzil', 'адрес']);
      const comment = this.pick(normalized, ['comment', 'izoh', 'komment', 'комментарий', 'изох']);

      if (!fullName) {
        skipped++;
        continue;
      }

      const uzsAmount = this.pickAmount(normalized, ['uzs', 'sum', 'som', 'so‘m', 'som qarz', 'sum qarz', 'сум', 'сумма сум', 'qarz uzs', 'debt uzs']);
      const usdAmount = this.pickAmount(normalized, ['usd', 'dollar', '$', 'доллар', 'доллар qarz', 'qarz usd', 'debt usd']);
      const commonAmount = this.pickAmount(normalized, ['qarz', 'debt', 'amount', 'summa', 'сумма']);
      const commonCurrency = this.normalizeCurrency(this.pick(normalized, ['currency', 'valyuta', 'валюта']));

      const debtsToCreate: Array<{ amount: number; currency: string }> = [];
      if (uzsAmount > 0) debtsToCreate.push({ amount: uzsAmount, currency: 'UZS' });
      if (usdAmount > 0) debtsToCreate.push({ amount: usdAmount, currency: 'USD' });
      if (!debtsToCreate.length && commonAmount > 0) debtsToCreate.push({ amount: commonAmount, currency: commonCurrency });

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
            address: address || client.address,
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
            address: address || null,
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
            amount: item.amount,
            currency: item.currency,
            status: 'ACTIVE',
            comment: ['EXCEL_IMPORT', comment].filter(Boolean).join(': '),
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

  private async findClient(companyId: string, fullName: string, normalizedPhone?: string) {
    if (normalizedPhone) {
      const byPhone = await this.prisma.client.findFirst({ where: { companyId, normalizedPhone } });
      if (byPhone) return byPhone;
    }
    return this.prisma.client.findFirst({ where: { companyId, fullName } });
  }

  private normalizeRow(row: Record<string, any>) {
    const next: Record<string, any> = {};
    for (const [key, value] of Object.entries(row || {})) {
      const cleanKey = String(key || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .replace(/[’']/g, '')
        .replace(/_/g, ' ');
      next[cleanKey] = value;
    }
    return next;
  }

  private pick(row: Record<string, any>, keys: string[]) {
    for (const key of keys) {
      const direct = row[key.toLowerCase()];
      if (direct !== undefined && direct !== null && String(direct).trim() !== '') return String(direct).trim();
      const found = Object.entries(row).find(([rowKey]) => rowKey.includes(key.toLowerCase()));
      if (found && String(found[1]).trim() !== '') return String(found[1]).trim();
    }
    return '';
  }

  private pickAmount(row: Record<string, any>, keys: string[]) {
    const value = this.pick(row, keys);
    return this.safeNumber(value);
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
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const clean = String(value).replace(/\s/g, '').replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
    const normalized = clean.includes('.') ? clean.replace(/\.(?=.*\.)/g, '') : clean;
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
