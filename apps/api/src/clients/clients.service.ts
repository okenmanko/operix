import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

type ParsedQarz13Row = {
  number: string;
  fullName: string;
  phone: string;
  dueDate: Date | null;
  usd: number;
  uzs: number;
  rowNumber: number;
  isTotal: boolean;
};

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(companyId: string) {
    return this.prisma.client.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(companyId: string, body: any) {
    return this.prisma.client.create({
      data: {
        companyId,
        fullName: body.fullName || body.name || '',
        phone: body.phone || this.noPhone(companyId, body.fullName || body.name || 'client'),
        address: body.address || null,
        guarantorName: body.guarantorName || null,
        guarantorPhone: body.guarantorPhone || null,
      },
    });
  }

  async update(companyId: string, id: string, body: any) {
    const client = await this.prisma.client.findFirst({ where: { id, companyId } });
    if (!client) throw new NotFoundException('Mijoz topilmadi');

    return this.prisma.client.update({
      where: { id },
      data: {
        fullName: body.fullName ?? client.fullName,
        phone: body.phone ?? client.phone,
        address: body.address ?? client.address,
        guarantorName: body.guarantorName ?? client.guarantorName,
        guarantorPhone: body.guarantorPhone ?? client.guarantorPhone,
      },
    });
  }

  async importExcel(buffer: Buffer, companyId: string) {
    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      cellNF: true,
      cellText: true,
      raw: true,
      defval: '',
    } as any);

    const oldClients = await this.prisma.client.findMany({
      where: { companyId },
      select: { id: true },
    });

    const oldClientIds = oldClients.map((client) => client.id);

    // QARZ13 — to‘liq qarzdorlar bazasi. Eski debtlar aralashmasin.
    if (oldClientIds.length) {
      await this.prisma.debt.deleteMany({
        where: { clientId: { in: oldClientIds } },
      });
    }

    let rowsProcessed = 0;
    let clientsCreated = 0;
    let clientsUpdated = 0;
    let debtsCreated = 0;
    let skipped = 0;
    let emptyRows = 0;

    let importedUsdTotal = 0;
    let importedUzsTotal = 0;
    let excelUsdTotal = 0;
    let excelUzsTotal = 0;

    let negativeRows = 0;
    const negativeSamples: any[] = [];
    const skippedSamples: any[] = [];
    const debugSamples: any[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet?.['!ref']) continue;

      const range = XLSX.utils.decode_range(sheet['!ref']);
      const headerRow = this.detectQarz13HeaderRow(sheet, range);
      const startRow = headerRow >= 0 ? headerRow + 1 : 4;

      for (let r = startRow; r <= range.e.r; r++) {
        const row = this.readQarz13Row(sheet, r);

        if (row.isTotal) {
          excelUsdTotal = row.usd;
          excelUzsTotal = row.uzs;
          continue;
        }

        if (this.isEmptyRow(row)) {
          emptyRows++;
          continue;
        }

        if (!row.fullName) {
          skipped++;
          if (skippedSamples.length < 15) skippedSamples.push(row);
          continue;
        }

        rowsProcessed++;

        if (row.usd < 0 || row.uzs < 0) {
          negativeRows++;
          if (negativeSamples.length < 20) negativeSamples.push(row);
        }

        if (debugSamples.length < 10) debugSamples.push(row);

        const safePhone = row.phone || this.noPhone(companyId, `${row.number}-${row.fullName}-${r + 1}`);

        let client = row.phone
          ? await this.prisma.client.findFirst({ where: { companyId, phone: row.phone } })
          : null;

        if (!client) {
          client = await this.prisma.client.findFirst({
            where: { companyId, fullName: row.fullName },
          });
        }

        if (client) {
          client = await this.prisma.client.update({
            where: { id: client.id },
            data: {
              fullName: row.fullName,
              phone: row.phone || client.phone,
            },
          });
          clientsUpdated++;
        } else {
          client = await this.prisma.client.create({
            data: {
              companyId,
              fullName: row.fullName,
              phone: safePhone,
              address: null,
              guarantorName: null,
              guarantorPhone: null,
            },
          });
          clientsCreated++;
        }

        // Muhim:
        // Excelda minus bor bo‘lsa, uni qarzdor qilib ko‘rsatmaymiz.
        // Positive summalar import qilinadi. Minuslar faqat response’da negativeSamples’da ko‘rinadi.
        if (row.usd > 0) {
          await this.prisma.debt.create({
            data: {
              clientId: client.id,
              amount: row.usd,
              currency: 'USD',
              dueDate: row.dueDate,
              comment: `QARZ13 import №${row.number || row.rowNumber}`,
              status: 'ACTIVE',
            },
          });
          debtsCreated++;
          importedUsdTotal += row.usd;
        }

        if (row.uzs > 0) {
          await this.prisma.debt.create({
            data: {
              clientId: client.id,
              amount: row.uzs,
              currency: 'UZS',
              dueDate: row.dueDate,
              comment: `QARZ13 import №${row.number || row.rowNumber}`,
              status: 'ACTIVE',
            },
          });
          debtsCreated++;
          importedUzsTotal += row.uzs;
        }
      }
    }

    return {
      mode: 'QARZ13_AUTO_FINAL',
      expectedFormat: 'A=Номер, B=Клиент, C=Тел, D=Срок, E=Доллар, F=Сум',
      rowsProcessed,
      clientsCreated,
      clientsUpdated,
      debtsCreated,
      skipped,
      emptyRows,
      negativeRows,
      importedUsdTotal,
      importedUzsTotal,
      excelUsdTotal,
      excelUzsTotal,
      positiveMinusExcelUsd: importedUsdTotal - excelUsdTotal,
      positiveMinusExcelUzs: importedUzsTotal - excelUzsTotal,
      debugSamples,
      negativeSamples,
      skippedSamples,
    };
  }

  async exportExcel(companyId: string) {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
      include: { debts: true } as any,
      orderBy: { createdAt: 'asc' },
    });

    const rows: any[] = [];
    let index = 1;
    let totalUsd = 0;
    let totalUzs = 0;

    for (const client of clients as any[]) {
      const debts = (client.debts || []).filter((debt: any) => debt.status !== 'CLOSED' && Number(debt.amount || 0) > 0);

      for (const debt of debts) {
        const usd = debt.currency === 'USD' ? Number(debt.amount || 0) : '';
        const uzs = debt.currency === 'UZS' ? Number(debt.amount || 0) : '';

        if (typeof usd === 'number') totalUsd += usd;
        if (typeof uzs === 'number') totalUzs += uzs;

        rows.push({
          'Номер': index++,
          'Клиент': client.fullName || '',
          'Тел': this.publicPhone(client.phone),
          'Срок': debt.dueDate ? this.formatDate(debt.dueDate) : '',
          'Доллар': usd,
          'Сум': uzs,
        });
      }
    }

    rows.push({
      'Номер': '',
      'Клиент': 'Итог:',
      'Тел': '',
      'Срок': '',
      'Доллар': totalUsd,
      'Сум': totalUzs,
    });

    return this.buildQarz13Workbook(rows);
  }

  async importTemplate() {
    const rows = [
      {
        'Номер': 1,
        'Клиент': 'SHAXODAT APA AGROBANK',
        'Тел': '906115120 910415950 RAVSHAN',
        'Срок': '16.05.2026',
        'Доллар': 2000,
        'Сум': '',
      },
      {
        'Номер': 2,
        'Клиент': 'ZAFAR XBK',
        'Тел': '1',
        'Срок': '28.02.2023',
        'Доллар': '',
        'Сум': 6755000,
      },
      {
        'Номер': '',
        'Клиент': 'Итог:',
        'Тел': '',
        'Срок': '',
        'Доллар': 2000,
        'Сум': 6755000,
      },
    ];

    return this.buildQarz13Workbook(rows, true);
  }

  private detectQarz13HeaderRow(sheet: XLSX.WorkSheet, range: XLSX.Range) {
    for (let r = range.s.r; r <= Math.min(range.e.r, 30); r++) {
      const a = this.norm(this.cellText(sheet, r, 0));
      const b = this.norm(this.cellText(sheet, r, 1));
      const c = this.norm(this.cellText(sheet, r, 2));
      const d = this.norm(this.cellText(sheet, r, 3));
      const e = this.norm(this.cellText(sheet, r, 4));
      const f = this.norm(this.cellText(sheet, r, 5));

      if (
        a.includes('номер') &&
        b.includes('клиент') &&
        c.includes('тел') &&
        d.includes('срок') &&
        e.includes('доллар') &&
        f.includes('сум')
      ) {
        return r;
      }
    }

    return 3;
  }

  private readQarz13Row(sheet: XLSX.WorkSheet, r: number): ParsedQarz13Row {
    const number = this.text(this.cellText(sheet, r, 0));
    const fullName = this.cleanName(this.cellText(sheet, r, 1));
    const phone = this.normalizePhone(this.cellText(sheet, r, 2));
    const dueDate = this.parseDate(this.cellValue(sheet, r, 3));
    const usd = this.moneyValue(this.cellValue(sheet, r, 4), this.cellText(sheet, r, 4));
    const uzs = this.moneyValue(this.cellValue(sheet, r, 5), this.cellText(sheet, r, 5));

    const normalizedNumber = this.norm(number);
    const normalizedName = this.norm(fullName);
    const normalizedPhone = this.norm(phone);

    return {
      rowNumber: r + 1,
      number,
      fullName,
      phone,
      dueDate,
      usd,
      uzs,
      isTotal:
        normalizedNumber.includes('итог') ||
        normalizedName.includes('итог') ||
        normalizedPhone.includes('итог'),
    };
  }

  private cellAddress(r: number, c: number) {
    return XLSX.utils.encode_cell({ r, c });
  }

  private cellValue(sheet: XLSX.WorkSheet, r: number, c: number) {
    const cell = sheet[this.cellAddress(r, c)];
    if (!cell) return '';
    return cell.v ?? cell.w ?? '';
  }

  private cellText(sheet: XLSX.WorkSheet, r: number, c: number) {
    const cell = sheet[this.cellAddress(r, c)];
    if (!cell) return '';
    return cell.w ?? cell.v ?? '';
  }

  private isEmptyRow(row: ParsedQarz13Row) {
    return !row.number && !row.fullName && !row.phone && !row.dueDate && row.usd === 0 && row.uzs === 0;
  }

  private cleanName(value: any) {
    return this.text(value)
      .replace(/^\d+[\).,\-\s]+/, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private text(value: any) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  private norm(value: any) {
    return this.text(value)
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/[^\p{L}\p{N}$№]+/gu, '');
  }

  private normalizePhone(value: any): string {
    const text = this.text(value);
    if (!text) return '';
    return text.replace(/\s+/g, ' ').trim();
  }

  private moneyValue(rawValue: any, formattedValue?: any) {
    // Prefer raw numeric value because Excel .xls stores 6 755 000 as 6755000.
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue;

    const candidate = formattedValue !== undefined && formattedValue !== null && formattedValue !== ''
      ? formattedValue
      : rawValue;

    if (candidate === undefined || candidate === null || candidate === '') return 0;

    let raw = String(candidate).trim();
    if (!raw) return 0;

    raw = raw
      .replace(/\u00A0/g, ' ')
      .replace(/[\s']/g, '')
      .replace(/,/g, '.')
      .replace(/[^\d.-]/g, '');

    if (!raw || raw === '-' || raw === '.') return 0;

    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private parseDate(value: any) {
    if (!value) return null;

    if (value instanceof Date) return value;

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }

    const text = this.text(value);
    if (!text) return null;

    const ddmmyyyy = text.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
    if (ddmmyyyy) {
      const day = Number(ddmmyyyy[1]);
      const month = Number(ddmmyyyy[2]);
      let year = Number(ddmmyyyy[3]);
      if (year < 100) year += 2000;
      return new Date(year, month - 1, day);
    }

    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  private formatDate(value: any) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${dd}.${mm}.${yyyy}`;
  }

  private noPhone(companyId: string, seed: string) {
    const safe = String(seed || 'client')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      .slice(0, 40);
    return `NO_PHONE_${companyId}_${safe}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }

  private publicPhone(phone: string) {
    if (!phone || String(phone).startsWith('NO_PHONE_')) return '';
    return phone;
  }

  private buildQarz13Workbook(rows: any[], withGuide = false) {
    const workbook = XLSX.utils.book_new();

    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['Номер', 'Клиент', 'Тел', 'Срок', 'Доллар', 'Сум'],
    });

    worksheet['!cols'] = [
      { wch: 10 },
      { wch: 34 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Лист1');

    if (withGuide) {
      const guide = XLSX.utils.aoa_to_sheet([
        ['QARZ13 FORMAT'],
        [],
        ['A', 'Номер'],
        ['B', 'Клиент'],
        ['C', 'Тел'],
        ['D', 'Срок'],
        ['E', 'Доллар'],
        ['F', 'Сум'],
        [],
        ['Muhim', 'QARZ13.06.26.xls shu formatda avtomatik import bo‘ladi. Minuslar qarz sifatida ko‘rsatilmaydi.'],
      ]);
      guide['!cols'] = [{ wch: 16 }, { wch: 90 }];
      XLSX.utils.book_append_sheet(workbook, guide, "Qo'llanma");
    }

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
  }
}
