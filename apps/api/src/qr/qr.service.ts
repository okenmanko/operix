import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function makeQrCode(companyId: string) {
  const company = companyId.replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  const time = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OPX-${company}-${time}-${rnd}`;
}

function toLimit(value?: string) {
  const n = Number(value || 120);
  if (!Number.isFinite(n)) return 120;
  return Math.min(Math.max(Math.floor(n), 1), 500);
}

@Injectable()
export class QrService {
  constructor(private readonly prisma: PrismaService) {}

  async labels(
    companyId: string,
    params: { productId?: string; warehouseId?: string; status?: string; limit?: string },
  ) {
    const items = await this.prisma.stockItem.findMany({
      where: {
        companyId,
        productId: params.productId || undefined,
        warehouseId: params.warehouseId || undefined,
        status: params.status || undefined,
      },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: 'desc' },
      take: toLimit(params.limit),
    });

    return items.map((item) => ({
      id: item.id,
      qrCode: item.qrCode,
      serialNumber: item.serialNumber,
      status: item.status,
      costPrice: item.costPrice,
      salePrice: item.salePrice,
      currency: item.currency,
      comment: item.comment,
      createdAt: item.createdAt,
      productId: item.productId,
      productName: item.product.name,
      productSku: item.product.sku,
      productBrand: item.product.brand,
      productModel: item.product.model,
      warehouseId: item.warehouseId,
      warehouseName: item.warehouse.name,
    }));
  }

  async items(companyId: string, params: { productId?: string; warehouseId?: string; status?: string }) {
    return this.prisma.stockItem.findMany({
      where: {
        companyId,
        productId: params.productId || undefined,
        warehouseId: params.warehouseId || undefined,
        status: params.status || undefined,
      },
      include: { product: true, warehouse: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async item(companyId: string, id: string) {
    const item = await this.prisma.stockItem.findFirst({
      where: { id, companyId },
      include: {
        product: true,
        warehouse: true,
        stockMovements: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });

    if (!item) throw new NotFoundException('QR tovar topilmadi');
    return item;
  }

  async reissue(companyId: string, id: string, reason?: string) {
    const item = await this.prisma.stockItem.findFirst({ where: { id, companyId } });
    if (!item) throw new NotFoundException('QR tovar topilmadi');

    if (item.status === 'SOLD') {
      throw new BadRequestException('Sotilgan tovar uchun QR qayta chiqarilmaydi');
    }

    const oldQr = item.qrCode;
    const updated = await this.prisma.stockItem.update({
      where: { id },
      data: {
        qrCode: makeQrCode(companyId),
        comment: reason ? `QR qayta chiqarildi. Eski QR: ${oldQr}. Sabab: ${reason}` : `QR qayta chiqarildi. Eski QR: ${oldQr}`,
      },
      include: { product: true, warehouse: true },
    });

    await this.prisma.stockMovement.create({
      data: {
        companyId,
        productId: item.productId,
        stockItemId: item.id,
        warehouseId: item.warehouseId,
        type: 'QR_REISSUE',
        quantity: 1,
        reason: 'QR qayta chiqarildi',
        comment: reason || null,
      },
    });

    return updated;
  }

  async updateComment(companyId: string, id: string, comment?: string) {
    const item = await this.prisma.stockItem.findFirst({ where: { id, companyId } });
    if (!item) throw new NotFoundException('QR tovar topilmadi');

    return this.prisma.stockItem.update({
      where: { id },
      data: { comment: String(comment || '').trim() || null },
      include: { product: true, warehouse: true },
    });
  }
}
