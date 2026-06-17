import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const memoryProducts = new Map<string, any[]>();
const memoryWarehouses = new Map<string, any[]>();
const memoryStock = new Map<string, any[]>();

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async products(companyId: string) {
    const products = await this.rawProducts(companyId);
    const stockRows = await this.rawStock(companyId);
    return products.map((product) => this.attachProductStock(product, stockRows));
  }

  async warehouses(companyId: string) {
    const warehouses = await this.rawWarehouses(companyId);
    const products = await this.rawProducts(companyId);
    const stockRows = await this.rawStock(companyId);

    return warehouses.map((warehouse) => {
      const rows = stockRows.filter((row) => row.warehouseId === warehouse.id || this.sameWarehouse(row.warehouseName, warehouse.name));
      const productCount = new Set(rows.map((row) => row.productId || this.stockProductKey(row))).size;
      const totalQuantity = rows.reduce((sum, row) => sum + this.safeNumber(row.quantity), 0);
      const totalValue = rows.reduce((sum, row) => {
        const product = products.find((p) => p.id === row.productId || this.sameProduct(row, p));
        const price = this.safeNumber(row.price || product?.salePrice || product?.price);
        return sum + this.safeNumber(row.quantity) * price;
      }, 0);

      return { ...warehouse, productCount, totalQuantity, totalValue };
    });
  }

  async summary(companyId: string) {
    const products = await this.products(companyId);
    const warehouses = await this.warehouses(companyId);

    return {
      products: products.length,
      warehouses: warehouses.length,
      totalQuantity: products.reduce((sum, product) => sum + this.safeNumber(product.stock), 0),
      totalValue: products.reduce((sum, product) => sum + this.safeNumber(product.stockValue), 0),
      topWarehouses: warehouses.slice().sort((a, b) => this.safeNumber(b.totalValue) - this.safeNumber(a.totalValue)).slice(0, 10),
    };
  }

  async warehouseDetail(companyId: string, id: string) {
    const warehouses = await this.warehouses(companyId);
    const warehouse = warehouses.find((item) => item.id === id || item.name === id);
    if (!warehouse) return { warehouse: null, items: [], totalQuantity: 0, totalValue: 0 };

    const products = await this.rawProducts(companyId);
    const stockRows = await this.rawStock(companyId);
    const rows = stockRows.filter((row) => row.warehouseId === warehouse.id || this.sameWarehouse(row.warehouseName, warehouse.name));

    const items = rows
      .map((row) => {
        const product = products.find((p) => p.id === row.productId || this.sameProduct(row, p));
        const price = this.safeNumber(row.price || product?.salePrice || product?.price);
        const quantity = this.safeNumber(row.quantity);
        return {
          productId: product?.id || row.productId || '',
          name: product?.name || row.productName,
          sku: product?.sku || row.sku || '',
          barcode: product?.barcode || row.barcode || '',
          category: product?.category || '',
          quantity,
          price,
          value: quantity * price,
          currency: product?.currency || row.currency || 'UZS',
        };
      })
      .filter((item) => item.quantity !== 0)
      .sort((a, b) => b.value - a.value);

    return {
      warehouse,
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: items.reduce((sum, item) => sum + item.value, 0),
    };
  }

  async createProduct(companyId: string, body: any) {
    const prismaAny = this.prisma as any;
    const data = this.toProductData(companyId, body);
    if (prismaAny.product?.create) return prismaAny.product.create({ data });

    const list = memoryProducts.get(companyId) || [];
    const item = { id: `product_${Date.now()}_${Math.random().toString(16).slice(2)}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.unshift(item);
    memoryProducts.set(companyId, list);
    return item;
  }

  async createWarehouse(companyId: string, body: any) {
    const prismaAny = this.prisma as any;
    const data = this.toWarehouseData(companyId, body);
    if (prismaAny.warehouse?.create) return prismaAny.warehouse.create({ data });

    const list = memoryWarehouses.get(companyId) || [];
    const item = { id: `warehouse_${Date.now()}_${Math.random().toString(16).slice(2)}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.unshift(item);
    memoryWarehouses.set(companyId, list);
    return item;
  }

  async upsertProductFromMoysklad(companyId: string, item: any) {
    const prismaAny = this.prisma as any;
    const name = String(item?.name || '').trim();
    if (!name) return { action: 'skipped', product: null };

    const externalId = this.extractExternalId(item);
    const sku = String(item?.article || item?.code || '').trim();
    const barcode = this.pickBarcode(item);

    const data = this.toProductData(companyId, {
      externalId,
      name,
      sku,
      barcode,
      model: item?.code || '',
      category: String(item?.pathName || item?.productFolder?.name || '').trim(),
      description: [item?.description || '', externalId ? `MoySklad ID: ${externalId}` : ''].filter(Boolean).join('\n'),
      costPrice: this.pickMoyskladBuyPrice(item),
      salePrice: this.pickMoyskladPrice(item),
      currency: this.pickCurrency(item) || 'UZS',
      isActive: true,
    });

    if (prismaAny.product?.findFirst && prismaAny.product?.update && prismaAny.product?.create) {
      const existing =
        (externalId ? await prismaAny.product.findFirst({ where: { companyId, externalId } }) : null) ||
        (sku ? await prismaAny.product.findFirst({ where: { companyId, sku } }) : null) ||
        (barcode ? await prismaAny.product.findFirst({ where: { companyId, barcode } }) : null) ||
        (await prismaAny.product.findFirst({ where: { companyId, name } }));

      if (existing) {
        const product = await prismaAny.product.update({ where: { id: existing.id }, data });
        return { action: 'updated', product };
      }

      const product = await prismaAny.product.create({ data });
      return { action: 'created', product };
    }

    const list = memoryProducts.get(companyId) || [];
    const index = list.findIndex((p) => (externalId && p.externalId === externalId) || (sku && p.sku === sku) || (barcode && p.barcode === barcode) || p.name === name);
    if (index >= 0) {
      list[index] = { ...list[index], ...data, updatedAt: new Date().toISOString() };
      memoryProducts.set(companyId, list);
      return { action: 'updated', product: list[index] };
    }

    const product = { id: `product_${Date.now()}_${Math.random().toString(16).slice(2)}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.unshift(product);
    memoryProducts.set(companyId, list);
    return { action: 'created', product };
  }

  async upsertWarehouseFromMoysklad(companyId: string, item: any) {
    const prismaAny = this.prisma as any;
    const name = String(item?.name || '').trim();
    if (!name) return { action: 'skipped', warehouse: null };

    const externalId = this.extractExternalId(item);
    const data = this.toWarehouseData(companyId, { externalId, name, address: item?.address || '', isActive: true });

    if (prismaAny.warehouse?.findFirst && prismaAny.warehouse?.update && prismaAny.warehouse?.create) {
      const existing =
        (externalId ? await prismaAny.warehouse.findFirst({ where: { companyId, externalId } }) : null) ||
        (await prismaAny.warehouse.findFirst({ where: { companyId, name } }));

      if (existing) {
        const warehouse = await prismaAny.warehouse.update({ where: { id: existing.id }, data });
        return { action: 'updated', warehouse };
      }

      const warehouse = await prismaAny.warehouse.create({ data });
      return { action: 'created', warehouse };
    }

    const list = memoryWarehouses.get(companyId) || [];
    const index = list.findIndex((w) => (externalId && w.externalId === externalId) || w.name === name);
    if (index >= 0) {
      list[index] = { ...list[index], ...data, updatedAt: new Date().toISOString() };
      memoryWarehouses.set(companyId, list);
      return { action: 'updated', warehouse: list[index] };
    }

    const warehouse = { id: `warehouse_${Date.now()}_${Math.random().toString(16).slice(2)}`, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    list.unshift(warehouse);
    memoryWarehouses.set(companyId, list);
    return { action: 'created', warehouse };
  }

  async replaceStockFromMoysklad(companyId: string, rows: any[]) {
    const prismaAny = this.prisma as any;
    const normalizedRows: any[] = [];

    for (const item of rows) {
      const productName = String(item?.name || item?.assortment?.name || '').trim();
      const sku = String(item?.article || item?.code || item?.assortment?.article || item?.assortment?.code || '').trim();
      const barcode = this.pickBarcode(item) || this.pickBarcode(item?.assortment || {});
      const productExternalId = this.extractExternalId(item?.assortment || item);
      const price = this.pickMoyskladPrice(item?.assortment || item) || this.safeNumber(item?.price) / 100;
      const currency = this.pickCurrency(item?.assortment || item) || 'UZS';

      const stockByStore = item?.stockByStore || item?.stockByWarehouse || item?.byStore || item?.stores || [];
      if (Array.isArray(stockByStore) && stockByStore.length) {
        for (const storeRow of stockByStore) {
          const warehouseName = String(storeRow?.name || storeRow?.store?.name || storeRow?.warehouse?.name || storeRow?.meta?.name || 'Umumiy').trim();
          const warehouseExternalId = this.extractExternalId(storeRow?.store || storeRow?.warehouse || storeRow);
          const quantity = this.safeNumber(storeRow?.stock ?? storeRow?.quantity ?? storeRow?.count ?? 0);
          if (!productName || !warehouseName || quantity === 0) continue;
          normalizedRows.push({ productName, sku, barcode, productExternalId, warehouseName, warehouseExternalId, quantity, price, currency });
        }
      } else {
        const quantity = this.safeNumber(item?.stock ?? item?.quantity ?? item?.count ?? 0);
        if (productName && quantity !== 0) normalizedRows.push({ productName, sku, barcode, productExternalId, warehouseName: 'Umumiy', warehouseExternalId: 'general', quantity, price, currency });
      }
    }

    memoryStock.set(companyId, normalizedRows);

    if (prismaAny.inventoryBalance?.deleteMany && prismaAny.inventoryBalance?.upsert) {
      await prismaAny.inventoryBalance.deleteMany({ where: { companyId } });

      for (const row of normalizedRows) {
        const product = await this.ensureProductFromStockRow(companyId, row);
        const warehouse = await this.ensureWarehouseFromStockRow(companyId, row);
        if (!product?.id || !warehouse?.id) continue;

        const externalKey = `${product.id}:${warehouse.id}`;
        await prismaAny.inventoryBalance.upsert({
          where: { companyId_externalKey: { companyId, externalKey } },
          update: { quantity: row.quantity, price: row.price || product.salePrice || 0, currency: product.currency || row.currency || 'UZS', productId: product.id, warehouseId: warehouse.id },
          create: { companyId, externalKey, quantity: row.quantity, price: row.price || product.salePrice || 0, currency: product.currency || row.currency || 'UZS', productId: product.id, warehouseId: warehouse.id },
        });
      }
    }

    return { rows: normalizedRows.length, totalQuantity: normalizedRows.reduce((sum, row) => sum + this.safeNumber(row.quantity), 0) };
  }

  private async rawProducts(companyId: string) {
    const prismaAny = this.prisma as any;
    if (prismaAny.product?.findMany) return prismaAny.product.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
    return memoryProducts.get(companyId) || [];
  }

  private async rawWarehouses(companyId: string) {
    const prismaAny = this.prisma as any;
    if (prismaAny.warehouse?.findMany) return prismaAny.warehouse.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
    return memoryWarehouses.get(companyId) || [];
  }

  private async rawStock(companyId: string) {
    const prismaAny = this.prisma as any;
    if (prismaAny.inventoryBalance?.findMany) {
      const rows = await prismaAny.inventoryBalance.findMany({
        where: { companyId },
        include: { product: true, warehouse: true },
        orderBy: { updatedAt: 'desc' },
      });

      return rows.map((row: any) => ({
        productId: row.productId,
        productName: row.product?.name || '',
        sku: row.product?.sku || '',
        barcode: row.product?.barcode || '',
        warehouseId: row.warehouseId,
        warehouseName: row.warehouse?.name || '',
        quantity: row.quantity,
        price: row.price || row.product?.salePrice || 0,
        currency: row.currency || row.product?.currency || 'UZS',
      }));
    }
    return memoryStock.get(companyId) || [];
  }

  private attachProductStock(product: any, stockRows: any[]) {
    const rows = stockRows.filter((row) => row.productId === product.id || this.sameProduct(row, product));
    const stock = rows.reduce((sum, row) => sum + this.safeNumber(row.quantity), 0);
    const price = this.safeNumber(product.salePrice || product.price || rows[0]?.price || 0);
    return {
      ...product,
      stock,
      stockValue: stock * price,
      warehouses: rows.map((row) => ({ warehouseId: row.warehouseId, warehouseName: row.warehouseName, quantity: this.safeNumber(row.quantity), price, value: this.safeNumber(row.quantity) * price })),
    };
  }

  private async ensureProductFromStockRow(companyId: string, row: any) {
    const prismaAny = this.prisma as any;
    const existing =
      (row.productExternalId ? await prismaAny.product.findFirst({ where: { companyId, externalId: row.productExternalId } }) : null) ||
      (row.sku ? await prismaAny.product.findFirst({ where: { companyId, sku: row.sku } }) : null) ||
      (row.barcode ? await prismaAny.product.findFirst({ where: { companyId, barcode: row.barcode } }) : null) ||
      await prismaAny.product.findFirst({ where: { companyId, name: row.productName } });

    if (existing) return existing;

    return prismaAny.product.create({
      data: this.toProductData(companyId, { externalId: row.productExternalId || null, name: row.productName, sku: row.sku, barcode: row.barcode, salePrice: row.price || 0, currency: row.currency || 'UZS', isActive: true }),
    });
  }

  private async ensureWarehouseFromStockRow(companyId: string, row: any) {
    const prismaAny = this.prisma as any;
    const existing =
      (row.warehouseExternalId && row.warehouseExternalId !== 'general' ? await prismaAny.warehouse.findFirst({ where: { companyId, externalId: row.warehouseExternalId } }) : null) ||
      await prismaAny.warehouse.findFirst({ where: { companyId, name: row.warehouseName } });

    if (existing) return existing;

    return prismaAny.warehouse.create({ data: this.toWarehouseData(companyId, { externalId: row.warehouseExternalId === 'general' ? null : row.warehouseExternalId, name: row.warehouseName || 'Umumiy', isActive: true }) });
  }

  private toProductData(companyId: string, body: any) {
    return {
      companyId,
      externalId: body.externalId || null,
      name: String(body.name || body.title || '').trim(),
      sku: body.sku || null,
      barcode: body.barcode || null,
      model: body.model || null,
      category: body.category || null,
      description: body.description || null,
      costPrice: this.safeNumber(body.costPrice || body.buyPrice),
      salePrice: this.safeNumber(body.salePrice || body.price),
      currency: body.currency || 'UZS',
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
  }

  private toWarehouseData(companyId: string, body: any) {
    return { companyId, externalId: body.externalId || null, name: String(body.name || '').trim(), address: body.address || null, isActive: body.isActive === undefined ? true : Boolean(body.isActive) };
  }

  private pickMoyskladPrice(item: any) {
    const value = item?.salePrices?.[0]?.value ?? item?.salePrices?.[0]?.price ?? item?.price ?? 0;
    const n = this.safeNumber(value);
    return n > 100000 ? n / 100 : n;
  }

  private pickMoyskladBuyPrice(item: any) {
    const value = item?.buyPrice?.value ?? item?.buyPrice?.price ?? 0;
    const n = this.safeNumber(value);
    return n > 100000 ? n / 100 : n;
  }

  private pickBarcode(item: any) {
    const barcodes = item?.barcodes || [];
    const first = Array.isArray(barcodes) ? barcodes[0] : null;
    return String(first?.ean13 || first?.ean8 || first?.code || item?.barcode || '').trim();
  }

  private pickCurrency(item: any) {
    const raw = String(item?.currency?.name || item?.currency?.code || item?.salePrices?.[0]?.currency?.name || item?.salePrices?.[0]?.currency?.code || '').toUpperCase();
    if (raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ')) return 'USD';
    if (raw.includes('UZS') || raw.includes('СУМ') || raw.includes('SO')) return 'UZS';
    return '';
  }

  private extractExternalId(item: any) {
    const href = String(item?.meta?.href || item?.href || '').trim();
    const fromHref = href ? href.split('/').pop()?.split('?')[0] : '';
    return String(item?.id || fromHref || '').trim() || null;
  }

  private sameProduct(row: any, product: any) {
    const rowSku = String(row.sku || '').trim().toLowerCase();
    const rowBarcode = String(row.barcode || '').trim().toLowerCase();
    const rowName = String(row.productName || '').trim().toLowerCase();
    const productSku = String(product.sku || '').trim().toLowerCase();
    const productBarcode = String(product.barcode || '').trim().toLowerCase();
    const productName = String(product.name || '').trim().toLowerCase();
    return Boolean((rowSku && productSku && rowSku === productSku) || (rowBarcode && productBarcode && rowBarcode === productBarcode) || (rowName && productName && rowName === productName));
  }

  private sameWarehouse(a: string, b: string) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  private stockProductKey(row: any) {
    return `${row.productId || ''}|${row.sku || ''}|${row.barcode || ''}|${row.productName || ''}`;
  }

  private safeNumber(value: any) {
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }
}
