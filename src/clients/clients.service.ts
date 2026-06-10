import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

function onlyDigits(value?: string | null) {
  return String(value || '').replace(/\D/g, '');
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  private addDebtAmounts(client: any) {
    return {
      ...client,
      debts: client.debts.map((debt: any) => {
        const paidAmount = debt.payments
          .filter((payment: any) => payment.currency === debt.currency)
          .reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);

        return {
          ...debt,
          paidAmount,
          remainingAmount: Number(debt.amount) - paidAmount,
        };
      }),
    };
  }

  create(
    companyId: string,
    data: {
      fullName: string;
      phone: string;
      address?: string;
      guarantorName?: string;
      guarantorPhone?: string;
      notes?: string;
    },
  ) {
    return this.prisma.client.create({
      data: {
        fullName: data.fullName.trim(),
        phone: data.phone.trim(),
        normalizedPhone: onlyDigits(data.phone),
        address: data.address?.trim() || null,
        guarantorName: data.guarantorName?.trim() || null,
        guarantorPhone: data.guarantorPhone?.trim() || null,
        notes: data.notes?.trim() || null,
        companyId,
      },
    });
  }

  async findAll(companyId: string, search?: string) {
    const q = search?.trim();
    const qDigits = onlyDigits(q);

    const clients = await this.prisma.client.findMany({
      where: {
        companyId,
        ...(q
          ? {
              OR: [
                { fullName: { contains: q, mode: 'insensitive' } },
                { phone: { contains: q, mode: 'insensitive' } },
                { normalizedPhone: { contains: qDigits } },
                { address: { contains: q, mode: 'insensitive' } },
                { guarantorName: { contains: q, mode: 'insensitive' } },
                { guarantorPhone: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        debts: {
          include: {
            payments: true,
          },
        },
      },
    });

    return clients.map((client) => this.addDebtAmounts(client));
  }

  async findOne(companyId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        debts: {
          include: {
            payments: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client topilmadi');
    }

    return this.addDebtAmounts(client);
  }

  async update(
    companyId: string,
    id: string,
    data: {
      fullName?: string;
      phone?: string;
      address?: string;
      guarantorName?: string;
      guarantorPhone?: string;
      notes?: string;
    },
  ) {
    const existingClient = await this.prisma.client.findFirst({
      where: { id, companyId },
    });

    if (!existingClient) {
      throw new NotFoundException('Client topilmadi');
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        fullName: data.fullName?.trim(),
        phone: data.phone?.trim(),
        normalizedPhone: data.phone ? onlyDigits(data.phone) : undefined,
        address: data.address !== undefined ? data.address?.trim() || null : undefined,
        guarantorName:
          data.guarantorName !== undefined
            ? data.guarantorName?.trim() || null
            : undefined,
        guarantorPhone:
          data.guarantorPhone !== undefined
            ? data.guarantorPhone?.trim() || null
            : undefined,
        notes: data.notes !== undefined ? data.notes?.trim() || null : undefined,
      },
    });
  }

  private getCell(row: any, keys: string[]) {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim()) {
        return String(row[key]).trim();
      }
    }

    return '';
  }

  async importExcel(buffer: Buffer, companyId: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(sheet, {
      defval: '',
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of rows as any[]) {
      const fullName = this.getCell(row, [
        'fullName',
        'Full Name',
        'Ism',
        'Ism Familiya',
        'Mijoz',
        'Клиент',
        'ФИО',
        'Имя',
      ]);

      const phone = this.getCell(row, [
        'phone',
        'Phone',
        'Telefon',
        'Телефон',
        'Номер',
      ]);

      const address = this.getCell(row, [
        'address',
        'Address',
        'Manzil',
        'Адрес',
      ]);

      const guarantorName = this.getCell(row, [
        'guarantorName',
        'Kafil',
        'Kafil ismi',
        'Гарант',
        'Поручитель',
      ]);

      const guarantorPhone = this.getCell(row, [
        'guarantorPhone',
        'Kafil telefoni',
        'Гарант телефон',
        'Телефон поручителя',
      ]);

      if (!fullName || !phone) {
        skipped++;
        continue;
      }

      const normalizedPhone = onlyDigits(phone);

      const existingClient = await this.prisma.client.findFirst({
        where: {
          companyId,
          OR: [{ phone }, { normalizedPhone }],
        },
      });

      if (existingClient) {
        await this.prisma.client.update({
          where: {
            id: existingClient.id,
          },
          data: {
            fullName,
            phone,
            normalizedPhone,
            address: address || null,
            guarantorName: guarantorName || null,
            guarantorPhone: guarantorPhone || null,
          },
        });

        updated++;
      } else {
        await this.prisma.client.create({
          data: {
            fullName,
            phone,
            normalizedPhone,
            address: address || null,
            guarantorName: guarantorName || null,
            guarantorPhone: guarantorPhone || null,
            companyId,
          },
        });

        created++;
      }
    }

    return {
      created,
      updated,
      skipped,
      total: rows.length,
    };
  }

  async exportExcel(companyId: string) {
    const clients = await this.prisma.client.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        debts: {
          include: {
            payments: true,
          },
        },
      },
    });

    const rows = clients.map((client) => {
      const calc = (currency: string) => {
        const total = client.debts
          .filter((debt) => debt.currency === currency)
          .reduce((sum, debt) => sum + Number(debt.amount), 0);

        const paid = client.debts
          .filter((debt) => debt.currency === currency)
          .reduce(
            (sum, debt) =>
              sum +
              debt.payments
                .filter((payment) => payment.currency === currency)
                .reduce((pSum, payment) => pSum + Number(payment.amount), 0),
            0,
          );

        return { total, paid, remaining: total - paid };
      };

      const uzs = calc('UZS');
      const usd = calc('USD');

      return {
        'Ism Familiya': client.fullName,
        Telefon: client.phone,
        Manzil: client.address || '',
        'Kafil ismi': client.guarantorName || '',
        'Kafil telefoni': client.guarantorPhone || '',
        'Jami qarz UZS': uzs.total,
        'To‘langan UZS': uzs.paid,
        'Qoldiq UZS': uzs.remaining,
        'Jami qarz USD': usd.total,
        'To‘langan USD': usd.paid,
        'Qoldiq USD': usd.remaining,
        'Qarzlar soni': client.debts.length,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    });
  }
}
