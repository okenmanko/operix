import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CheckoutItem = {
  stockItemId?: string;
  qrCode?: string;
  price?: number;
  quantity?: number;
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function saleNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `SALE-${y}${m}${day}-${Date.now()}`;
}

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async scan(companyId: string, code: string) {
    const clean = String(code || '').trim();
    if (!clean) throw new BadRequestException('QR kod kiriting');

    const item = await this.prisma.stockItem.findFirst({
      where: {
        companyId,
        OR: [{ qrCode: clean }, { serialNumber: clean }],
      },
      include: { product: true, warehouse: true },
    });

    if (!item) throw new NotFoundException('Tovar topilmadi');
    if (item.status !== 'IN_STOCK') {
      throw new BadRequestException(`Bu tovar sotuvga yaroqsiz: ${item.status}`);
    }

    return {
      id: item.id,
      qrCode: item.qrCode,
      serialNumber: item.serialNumber,
      status: item.status,
      productId: item.productId,
      productName: item.product?.name,
      sku: item.product?.sku,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse?.name,
      salePrice: item.salePrice ?? item.product?.salePrice ?? 0,
      currency: item.currency || item.product?.currency || 'UZS',
    };
  }

  async checkout(companyId: string, userId: string, body: any) {
    const items = Array.isArray(body?.items) ? (body.items as CheckoutItem[]) : [];
    if (!items.length) throw new BadRequestException('Savat bo‘sh');

    const method = String(body?.method || 'CASH').toUpperCase();
    const currency = String(body?.currency || 'UZS').toUpperCase();
    const customerName = body?.customerName ? String(body.customerName) : null;
    const comment = body?.comment ? String(body.comment) : null;
    const discount = Number(body?.discount || 0);

    return this.prisma.$transaction(async (tx) => {
      const saleItems: any[] = [];
      let total = 0;

      for (const row of items) {
        const found = await tx.stockItem.findFirst({
          where: {
            companyId,
            OR: [
              row.stockItemId ? { id: row.stockItemId } : undefined,
              row.qrCode ? { qrCode: row.qrCode } : undefined,
            ].filter(Boolean) as any[],
          },
          include: { product: true },
        });

        if (!found) throw new NotFoundException('Savatdagi tovar topilmadi');
        if (found.status !== 'IN_STOCK') {
          throw new BadRequestException(`${found.qrCode} allaqachon sotilgan yoki sotuvga yaroqsiz`);
        }

        const price = Number(row.price ?? found.salePrice ?? found.product?.salePrice ?? 0);
        if (price < 0) throw new BadRequestException('Narx noto‘g‘ri');

        total += price;

        await tx.stockItem.update({
          where: { id: found.id },
          data: { status: 'SOLD', salePrice: price, currency },
        });

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: found.productId,
            stockItemId: found.id,
            warehouseId: found.warehouseId,
            type: 'OUT',
            quantity: 1,
            reason: 'SALE',
            comment: 'POS sotuv',
          },
        });

        saleItems.push({
          productId: found.productId,
          stockItemId: found.id,
          warehouseId: found.warehouseId,
          productName: found.product?.name || 'Noma’lum tovar',
          qrCode: found.qrCode,
          serialNumber: found.serialNumber,
          quantity: 1,
          price,
          total: price,
          currency,
        });
      }

      const finalTotal = Math.max(total - discount, 0);

      const sale = await tx.sale.create({
        data: {
          companyId,
          cashierId: userId,
          saleNumber: saleNumber(),
          totalAmount: finalTotal,
          discount,
          currency,
          method,
          status: 'COMPLETED',
          customerName,
          comment,
          items: { create: saleItems },
        },
        include: { items: true },
      });

      await tx.cashflow.create({
        data: {
          companyId,
          type: 'INCOME',
          amount: finalTotal,
          currency,
          category: 'POS_SALE',
          method,
          description: `POS sotuv: ${sale.saleNumber}`,
          referenceId: sale.id,
        },
      });

      return sale;
    });
  }

  async list(companyId: string, filters: { dateFrom?: string; dateTo?: string; currency?: string }) {
    const where: any = { companyId };
    if (filters.currency) where.currency = String(filters.currency).toUpperCase();
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const sales = await this.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
      take: 300,
    });

    return { sales };
  }

  async getOne(companyId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, companyId },
      include: { items: true },
    });
    if (!sale) throw new NotFoundException('Sotuv topilmadi');
    return sale;
  }

  async summary(companyId: string) {
    const now = new Date();
    const todayStart = startOfDay(now);
    const monthStart = startOfMonth(now);

    const [today, month, all, lastSales] = await Promise.all([
      this.prisma.sale.aggregate({ where: { companyId, status: 'COMPLETED', createdAt: { gte: todayStart } }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.sale.aggregate({ where: { companyId, status: 'COMPLETED', createdAt: { gte: monthStart } }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.sale.aggregate({ where: { companyId, status: 'COMPLETED' }, _sum: { totalAmount: true }, _count: true }),
      this.prisma.sale.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 10, include: { items: true } }),
    ]);

    return {
      todaySales: today._sum.totalAmount || 0,
      todayCount: today._count,
      monthSales: month._sum.totalAmount || 0,
      monthCount: month._count,
      totalSales: all._sum.totalAmount || 0,
      totalCount: all._count,
      avgCheck: all._count ? Math.round((all._sum.totalAmount || 0) / all._count) : 0,
      lastSales,
    };
  }
}
