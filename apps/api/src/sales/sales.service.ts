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

  private normalizeSearch(value: any) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9а-яё]+/gi, "")
      .trim();
  }

  private buildSearchText(product: any) {
    return [
      product?.name,
      product?.productName,
      product?.sku,
      product?.model,
      product?.barcode,
      product?.category,
      product?.brand,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  private productScore(product: any, query: string) {
    const raw = String(query || "").trim().toLowerCase();
    const compactQuery = this.normalizeSearch(raw);
    const text = this.buildSearchText(product);
    const compactText = this.normalizeSearch(text);
    const barcode = this.normalizeSearch(product?.barcode);
    const sku = this.normalizeSearch(product?.sku || product?.model);
    const terms = raw.split(/\s+/).map((x) => x.trim()).filter(Boolean);
    const compactTerms = terms.map((x) => this.normalizeSearch(x)).filter(Boolean);

    if (!raw) return 0;
    if (barcode && barcode === compactQuery) return 1000;
    if (sku && sku === compactQuery) return 950;
    if (compactText.startsWith(compactQuery)) return 900;
    if (text.includes(raw)) return 850;
    if (compactText.includes(compactQuery)) return 800;
    if (compactTerms.length && compactTerms.every((term) => compactText.includes(term))) return 740;
    if (terms.length && terms.every((term) => text.includes(term))) return 700;
    if (compactTerms.some((term) => compactText.includes(term))) return 420;
    return 0;
  }

  async searchProducts(companyId: string, q: string) {
    const clean = String(q || '').trim();
    if (clean.length < 1) return [];

    const prismaAny = this.prisma as any;

    const [products, balanceRows] = await Promise.all([
      prismaAny.product.findMany({
        where: { companyId, isActive: true },
        take: 1200,
        orderBy: { updatedAt: 'desc' },
      }),
      prismaAny.inventoryBalance?.findMany
        ? prismaAny.inventoryBalance.findMany({
            where: { companyId },
            include: { product: true, warehouse: true },
            take: 5000,
            orderBy: { updatedAt: 'desc' },
          })
        : Promise.resolve([]),
    ]);

    const balanceByProduct = new Map<string, any[]>();
    for (const row of Array.isArray(balanceRows) ? balanceRows : []) {
      const productId = row?.productId || row?.product?.id;
      if (!productId) continue;
      const list = balanceByProduct.get(productId) || [];
      list.push(row);
      balanceByProduct.set(productId, list);
    }

    const results = (products || [])
      .map((product: any) => {
        const rows = balanceByProduct.get(product.id) || [];
        const score = this.productScore(product, clean);
        const stock = rows.length
          ? rows.reduce((sum: number, row: any) => sum + this.safeNumber(row.quantity), 0)
          : 0;
        const firstBalance = rows.find((row: any) => this.safeNumber(row.quantity) > 0) || rows[0] || null;
        const salePrice = this.safeNumber(
          firstBalance?.price ?? firstBalance?.salePrice ?? product.salePrice ?? product.price ?? 0,
        );
        const costPrice = this.safeNumber(
          firstBalance?.costPrice ?? product.costPrice ?? 0,
        );

        return {
          id: product.id,
          productId: product.id,
          name: product.name,
          productName: product.name,
          sku: product.sku || product.model || '',
          model: product.model || product.sku || '',
          barcode: product.barcode || '',
          category: product.category || '',
          warehouseName: firstBalance?.warehouse?.name || '',
          stockItemId: null,
          stock,
          salePrice,
          costPrice,
          currency: 'USD',
          _score: score,
        };
      })
      .filter((item: any) => item._score > 0)
      .sort((a: any, b: any) => b._score - a._score || this.safeNumber(b.stock) - this.safeNumber(a.stock) || String(a.name).localeCompare(String(b.name)))
      .slice(0, 25)
      .map(({ _score, ...item }: any) => item);

    // Fallback: old stock-item based search if product catalogue did not return anything.
    if (results.length) return results;

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
      take: 25,
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
