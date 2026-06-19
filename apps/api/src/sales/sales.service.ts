import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type CheckoutItem = {
  stockItemId?: string;
  productId?: string;
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

  private safeNumber(value: any) {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }

  async searchProducts(companyId: string, q: string) {
    const clean = String(q || '').trim();
    if (clean.length < 1) return [];

    const terms = clean
      .toLowerCase()
      .split(/\s+/)
      .map((x) => x.trim())
      .filter(Boolean);

    const rows = await this.prisma.product.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { name: { contains: clean, mode: 'insensitive' } },
          { sku: { contains: clean, mode: 'insensitive' } },
          { model: { contains: clean, mode: 'insensitive' } },
          { barcode: { contains: clean, mode: 'insensitive' } },
          { category: { contains: clean, mode: 'insensitive' } },
          ...terms.flatMap((term) => [
            { name: { contains: term, mode: 'insensitive' } },
            { sku: { contains: term, mode: 'insensitive' } },
            { model: { contains: term, mode: 'insensitive' } },
            { barcode: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } },
          ]),
        ],
      } as any,
      include: {
        stockItems: {
          where: { status: 'IN_STOCK' },
          include: { warehouse: true },
          take: 5,
          orderBy: { createdAt: 'asc' },
        },
      } as any,
      take: 30,
      orderBy: { updatedAt: 'desc' },
    } as any);

    return rows.map((product: any) => {
      const stockItems = Array.isArray(product.stockItems) ? product.stockItems : [];
      const firstStock = stockItems[0];
      return {
        id: product.id,
        productId: product.id,
        name: product.name,
        productName: product.name,
        sku: product.sku || product.model || '',
        model: product.model || product.sku || '',
        barcode: product.barcode || '',
        category: product.category || '',
        warehouseName: firstStock?.warehouse?.name || '',
        stockItemId: firstStock?.id || null,
        stock: stockItems.length,
        salePrice: this.safeNumber(firstStock?.salePrice ?? product.salePrice ?? product.price ?? 0),
        costPrice: this.safeNumber(firstStock?.costPrice ?? product.costPrice ?? 0),
        currency: firstStock?.currency || product.currency || 'USD',
      };
    });
  }

  async scan(companyId: string, code: string) {
    const clean = String(code || '').trim();
    if (!clean) throw new BadRequestException('QR kod yoki mahsulot nomini kiriting');

    const item = await this.prisma.stockItem.findFirst({
      where: {
        companyId,
        OR: [{ qrCode: clean }, { serialNumber: clean }],
      },
      include: { product: true, warehouse: true },
    });

    if (item) {
      if (item.status !== 'IN_STOCK') {
        throw new BadRequestException(`Bu tovar sotuvga yaroqsiz: ${item.status}`);
      }

      return {
        id: item.id,
        stockItemId: item.id,
        qrCode: item.qrCode,
        serialNumber: item.serialNumber,
        status: item.status,
        productId: item.productId,
        productName: item.product?.name,
        sku: item.product?.sku,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse?.name,
        stock: 1,
        salePrice: item.salePrice ?? item.product?.salePrice ?? 0,
        currency: item.currency || item.product?.currency || 'USD',
      };
    }

    const found = await this.searchProducts(companyId, clean);
    if (!found.length) throw new NotFoundException('Tovar topilmadi');
    return found[0];
  }

  async checkout(companyId: string, userId: string, body: any) {
    const items = Array.isArray(body?.items) ? (body.items as CheckoutItem[]) : [];
    if (!items.length) throw new BadRequestException('Savat bo‘sh');

    const method = String(body?.method || 'CASH').toUpperCase();
    const currency = String(body?.currency || 'USD').toUpperCase();
    const customerName = body?.customerName ? String(body.customerName) : null;
    const customerPhone = body?.customerPhone ? String(body.customerPhone) : null;
    const comment = body?.comment ? String(body.comment) : null;
    const discount = this.safeNumber(body?.discount);

    return this.prisma.$transaction(async (tx) => {
      const saleItems: any[] = [];
      let subtotal = 0;

      for (const row of items) {
        const quantity = Math.max(1, Math.floor(this.safeNumber(row.quantity || 1)));

        if (row.stockItemId || row.qrCode) {
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

          const price = this.safeNumber(row.price ?? found.salePrice ?? found.product?.salePrice ?? 0);
          if (price < 0) throw new BadRequestException('Narx noto‘g‘ri');
          subtotal += price;

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
            quantity: 1,
            price,
            total: price,
          });

          continue;
        }

        if (!row.productId) throw new NotFoundException('Savatdagi mahsulot topilmadi');

        const product = await tx.product.findFirst({
          where: { id: row.productId, companyId },
        });
        if (!product) throw new NotFoundException('Mahsulot topilmadi');

        const price = this.safeNumber(row.price ?? product.salePrice ?? 0);
        if (price < 0) throw new BadRequestException('Narx noto‘g‘ri');
        subtotal += price * quantity;

        const stockItems = await tx.stockItem.findMany({
          where: { companyId, productId: product.id, status: 'IN_STOCK' },
          take: quantity,
          orderBy: { createdAt: 'asc' },
        });

        for (const stock of stockItems) {
          await tx.stockItem.update({
            where: { id: stock.id },
            data: { status: 'SOLD', salePrice: price, currency },
          });
          await tx.stockMovement.create({
            data: {
              companyId,
              productId: product.id,
              stockItemId: stock.id,
              warehouseId: stock.warehouseId,
              type: 'OUT',
              quantity: 1,
              reason: 'SALE',
              comment: 'POS sotuv',
            },
          });
        }

        if (stockItems.length < quantity) {
          await tx.stockMovement.create({
            data: {
              companyId,
              productId: product.id,
              type: 'OUT',
              quantity,
              reason: 'SALE',
              comment: 'POS sotuv product-level',
            },
          });
        }

        saleItems.push({
          productId: product.id,
          quantity,
          price,
          total: price * quantity,
        });
      }

      const totalAmount = Math.max(subtotal - discount, 0);

      const sale = await tx.sale.create({
        data: {
          companyId,
          cashierId: userId,
          saleNumber: saleNumber(),
          subtotal,
          totalAmount,
          discount,
          currency,
          method,
          status: 'COMPLETED',
          customerName,
          customerPhone,
          comment,
          items: { create: saleItems },
        },
        include: { items: true },
      });

      await tx.cashflow.create({
        data: {
          companyId,
          type: 'INCOME',
          amount: totalAmount,
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

    const rows = await this.prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
      take: 300,
    });

    return rows;
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
