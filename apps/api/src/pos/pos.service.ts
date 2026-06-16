import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async today(companyId: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { companyId, type: 'OUT', createdAt: { gte: startOfToday() } },
      include: { product: true, stockItem: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const soldCount = movements.length;

    const totalUZS = movements.reduce((sum, m) => {
      const price = m.stockItem?.salePrice || m.product?.salePrice || 0;
      const currency = m.stockItem?.currency || m.product?.currency || 'UZS';
      return currency === 'UZS' ? sum + Number(price || 0) : sum;
    }, 0);

    const totalUSD = movements.reduce((sum, m) => {
      const price = m.stockItem?.salePrice || m.product?.salePrice || 0;
      const currency = m.stockItem?.currency || m.product?.currency || 'UZS';
      return currency === 'USD' ? sum + Number(price || 0) : sum;
    }, 0);

    return { soldCount, totalUZS, totalUSD, movements };
  }

  async scan(companyId: string, qrCode: string) {
    const code = String(qrCode || '').trim();
    if (!code) throw new BadRequestException('QR kod kerak');

    const item = await this.prisma.stockItem.findFirst({
      where: { companyId, qrCode: code },
      include: { product: true, warehouse: true },
    });

    if (!item) throw new NotFoundException('QR topilmadi');

    return {
      id: item.id,
      qrCode: item.qrCode,
      status: item.status,
      serialNumber: item.serialNumber,
      salePrice: item.salePrice || item.product.salePrice || 0,
      currency: item.currency || item.product.currency || 'UZS',
      product: item.product,
      warehouse: item.warehouse,
    };
  }

  async sell(companyId: string, body: any) {
    const qrCodes = Array.isArray(body.qrCodes) ? body.qrCodes : [body.qrCode].filter(Boolean);
    if (qrCodes.length === 0) throw new BadRequestException('Kamida bitta QR kerak');

    const sold: any[] = [];

    for (const rawCode of qrCodes) {
      const qrCode = String(rawCode || '').trim();
      const item = await this.prisma.stockItem.findFirst({
        where: { companyId, qrCode },
        include: { product: true, warehouse: true },
      });

      if (!item) throw new NotFoundException(`QR topilmadi: ${qrCode}`);

      if (!['IN_STOCK', 'RESERVED', 'RETURNED'].includes(item.status)) {
        throw new BadRequestException(`Bu tovar sotilmaydi. QR: ${qrCode}. Status: ${item.status}`);
      }

      const updated = await this.prisma.stockItem.update({
        where: { id: item.id },
        data: { status: 'SOLD', comment: body.comment?.trim() || item.comment },
        include: { product: true, warehouse: true },
      });

      await this.prisma.stockMovement.create({
        data: {
          companyId,
          productId: item.productId,
          stockItemId: item.id,
          warehouseId: item.warehouseId,
          type: 'OUT',
          quantity: 1,
          reason: 'POS sale',
          comment: body.comment?.trim() || null,
          referenceId: body.referenceId || null,
        },
      });

      const amount = Number(item.salePrice || item.product.salePrice || 0);
      const currency = item.currency || item.product.currency || 'UZS';

      if (amount > 0) {
        await this.prisma.cashflow.create({
          data: {
            companyId,
            type: 'INCOME',
            amount,
            currency,
            category: 'SALE',
            method: body.method || 'CASH',
            description: `POS sale: ${item.product.name}`,
            referenceId: item.id,
          },
        });
      }

      sold.push(updated);
    }

    return { ok: true, count: sold.length, sold };
  }
}
