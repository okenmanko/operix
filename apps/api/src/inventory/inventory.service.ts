import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const memoryProducts = new Map<string, any[]>();
const memoryWarehouses = new Map<string, any[]>();
const memoryStock = new Map<string, any[]>();

type StockRow = {
  productName: string;
  sku?: string;
  barcode?: string;
  productExternalId?: string | null;
  warehouseName: string;
  warehouseExternalId?: string | null;
  quantity: number;
  price: number;
  currency: string;
};

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
    const stockRows = await this.rawStock(companyId);

    return warehouses.map((warehouse) => {
      const rows = stockRows.filter((row) => row.warehouseId === warehouse.id || this.sameWarehouse(row.warehouseName, warehouse.name));
      const productCount = new Set(rows.map((row) => row.productId || this.stockProductKey(row))).size;
      const totalQuantity = rows.reduce((sum, row) => sum + this.safeNumber(row.quantity), 0);
      const totalValueUZS = rows
        .filter((row) => this.normalizeCurrency(row.currency) === 'UZS')
        .reduce((sum, row) => sum + this.safeNumber(row.quantity) * this.safeNumber(row.price), 0);
      const totalValueUSD = rows
        .filter((row) => this.normalizeCurrency(row.currency) === 'USD')
        .reduce((sum, row) => sum + this.safeNumber(row.quantity) * this.safeNumber(row.price), 0);

      return {
        ...warehouse,
        productCount,
        totalQuantity,
        totalValue: totalValueUSD || totalValueUZS,
        totalValueUZS: this.round2(totalValueUZS),
        totalValueUSD: this.round2(totalValueUSD),
      };
    });
  }

  async summary(companyId: string) {
    const products = await this.products(companyId);
    const warehouses = await this.warehouses(companyId);

    return {
      products: products.length,
      warehouses: warehouses.length,
      totalQuantity: products.reduce((sum, product) => sum + this.safeNumber(product.stock), 0),
      totalValueUZS: this.round2(products.reduce((sum, product) => sum + this.safeNumber(product.stockValueUZS), 0)),
      totalValueUSD: this.round2(products.reduce((sum, product) => sum + this.safeNumber(product.stockValueUSD), 0)),
      totalValue: this.round2(products.reduce((sum, product) => sum + this.safeNumber(product.stockValueUSD || product.stockValueUZS), 0)),
      topWarehouses: warehouses.slice().sort((a, b) => this.safeNumber(b.totalQuantity) - this.safeNumber(a.totalQuantity)).slice(0, 10),
    };
  }

  async warehouseDetail(companyId: string, id: string) {
    const warehouses = await this.warehouses(companyId);
    const warehouse = warehouses.find((item) => item.id === id || item.name === id);
    if (!warehouse) return { warehouse: null, items: [], totalQuantity: 0, totalValue: 0, totalValueUZS: 0, totalValueUSD: 0 };

    const products = await this.rawProducts(companyId);
    const stockRows = await this.rawStock(companyId);
    const rows = stockRows.filter((row) => row.warehouseId === warehouse.id || this.sameWarehouse(row.warehouseName, warehouse.name));

    const items = rows
      .map((row) => {
        const product = products.find((p) => p.id === row.productId || this.sameProduct(row, p));
        const currency = this.normalizeCurrency(row.currency || product?.currency || 'UZS');
        const price = this.safeNumber(row.price || product?.salePrice || product?.price || 0);
        const quantity = this.safeNumber(row.quantity);
        return {
          productId: product?.id || row.productId || '',
          name: product?.name || row.productName || 'Nomsiz mahsulot',
          sku: product?.sku || row.sku || '',
          barcode: product?.barcode || row.barcode || '',
          category: product?.category || '',
          quantity,
          price,
          value: this.round2(quantity * price),
          currency,
        };
      })
      .filter((item) => item.quantity !== 0)
      .sort((a, b) => b.value - a.value);

    const totalValueUZS = items.filter((item) => item.currency === 'UZS').reduce((sum, item) => sum + item.value, 0);
    const totalValueUSD = items.filter((item) => item.currency === 'USD').reduce((sum, item) => sum + item.value, 0);

    return {
      warehouse,
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: this.round2(totalValueUSD || totalValueUZS),
      totalValueUZS: this.round2(totalValueUZS),
      totalValueUSD: this.round2(totalValueUSD),
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
    const currency = this.pickCurrency(item) || 'UZS';

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
      currency,
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
    const normalizedRows: StockRow[] = [];

    const warehouseMap = await this.buildWarehouseMap(companyId);

    for (const item of rows || []) {
      const baseProduct = item?.assortment || item?.product || item?.good || item;
      const productName = String(item?.name || baseProduct?.name || '').trim();
      const sku = String(item?.article || item?.code || baseProduct?.article || baseProduct?.code || '').trim();
      const barcode = this.pickBarcode(item) || this.pickBarcode(baseProduct || {});
      const productExternalId = this.extractExternalId(baseProduct || item);
      const currency = this.pickCurrency(baseProduct) || this.pickCurrency(item) || 'UZS';
      const price = this.pickMoyskladPrice(baseProduct) || this.normalizePrice(item?.price ?? item?.salePrice ?? 0, currency);

      const storeRows = this.extractStoreRows(item);
      for (const storeRow of storeRows) {
        const storeObj = storeRow?.store || storeRow?.warehouse || storeRow?.stockStore || storeRow?.stockByStore || storeRow;
        const warehouseExternalId = this.extractExternalId(storeObj) || this.extractExternalId(storeRow) || null;
        const warehouseName = this.resolveWarehouseName(storeObj, storeRow, warehouseMap, warehouseExternalId);
        const quantity = this.safeNumber(storeRow?.stock ?? storeRow?.quantity ?? storeRow?.count ?? storeRow?.value ?? item?.stock ?? item?.quantity ?? 0);

        if (!productName || !warehouseName || quantity === 0) continue;
        normalizedRows.push({
          productName,
          sku,
          barcode,
          productExternalId,
          warehouseName,
          warehouseExternalId: warehouseExternalId || warehouseName,
          quantity,
          price,
          currency,
        });
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
        const currency = this.normalizeCurrency(row.currency || product.currency || 'UZS');
        const price = this.safeNumber(row.price || product.salePrice || 0);

        await prismaAny.inventoryBalance.upsert({
          where: { companyId_externalKey: { companyId, externalKey } },
          update: { quantity: row.quantity, price, currency, productId: product.id, warehouseId: warehouse.id },
          create: { companyId, externalKey, quantity: row.quantity, price, currency, productId: product.id, warehouseId: warehouse.id },
        });
      }
    }

    return {
      rows: normalizedRows.length,
      products: new Set(normalizedRows.map((row) => row.productExternalId || row.sku || row.barcode || row.productName)).size,
      warehouses: new Set(normalizedRows.map((row) => row.warehouseExternalId || row.warehouseName)).size,
      totalQuantity: normalizedRows.reduce((sum, row) => sum + this.safeNumber(row.quantity), 0),
    };
  }

  private async buildWarehouseMap(companyId: string) {
    const warehouses = await this.rawWarehouses(companyId);
    const map = new Map<string, any>();
    for (const warehouse of warehouses) {
      if (warehouse.externalId) map.set(String(warehouse.externalId), warehouse);
      if (warehouse.name) map.set(String(warehouse.name).trim().toLowerCase(), warehouse);
    }
    return map;
  }

  private extractStoreRows(item: any) {
    const candidates = [item?.stockByStore, item?.stockByWarehouse, item?.byStore, item?.stores, item?.storeStock].filter(Array.isArray);
    if (candidates.length) return candidates.flat();
    return [item];
  }

  private resolveWarehouseName(storeObj: any, storeRow: any, warehouseMap: Map<string, any>, externalId?: string | null) {
    const fromObject = String(storeObj?.name || storeRow?.name || storeRow?.storeName || storeRow?.warehouseName || '').trim();
    if (fromObject) return fromObject;
    if (externalId && warehouseMap.get(externalId)?.name) return warehouseMap.get(externalId).name;
    return 'Umumiy';
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
        currency: this.normalizeCurrency(row.currency || row.product?.currency || 'UZS'),
      }));
    }
    return memoryStock.get(companyId) || [];
  }

  private attachProductStock(product: any, stockRows: any[]) {
    const rows = stockRows.filter((row) => row.productId === product.id || this.sameProduct(row, product));
    const stock = rows.reduce((sum, row) => sum + this.safeNumber(row.quantity), 0);
    const currency = this.normalizeCurrency(product.currency || rows[0]?.currency || 'UZS');
    const price = this.safeNumber(product.salePrice || product.price || rows[0]?.price || 0);
    const stockValue = stock * price;

    return {
      ...product,
      currency,
      stock,
      stockValue: this.round2(stockValue),
      stockValueUZS: currency === 'UZS' ? this.round2(stockValue) : 0,
      stockValueUSD: currency === 'USD' ? this.round2(stockValue) : 0,
      warehouses: rows.map((row) => ({
        warehouseId: row.warehouseId,
        warehouseName: row.warehouseName,
        quantity: this.safeNumber(row.quantity),
        price: this.safeNumber(row.price || price),
        currency: this.normalizeCurrency(row.currency || currency),
        value: this.round2(this.safeNumber(row.quantity) * this.safeNumber(row.price || price)),
      })),
    };
  }

  private async ensureProductFromStockRow(companyId: string, row: StockRow) {
    const prismaAny = this.prisma as any;
    const existing =
      (row.productExternalId ? await prismaAny.product.findFirst({ where: { companyId, externalId: row.productExternalId } }) : null) ||
      (row.sku ? await prismaAny.product.findFirst({ where: { companyId, sku: row.sku } }) : null) ||
      (row.barcode ? await prismaAny.product.findFirst({ where: { companyId, barcode: row.barcode } }) : null) ||
      await prismaAny.product.findFirst({ where: { companyId, name: row.productName } });

    const data = this.toProductData(companyId, {
      externalId: row.productExternalId || null,
      name: row.productName,
      sku: row.sku,
      barcode: row.barcode,
      salePrice: row.price || 0,
      currency: row.currency || 'UZS',
      isActive: true,
    });

    if (existing) {
      return prismaAny.product.update({ where: { id: existing.id }, data });
    }

    return prismaAny.product.create({ data });
  }

  private async ensureWarehouseFromStockRow(companyId: string, row: StockRow) {
    const prismaAny = this.prisma as any;
    const externalId = row.warehouseExternalId && row.warehouseExternalId !== 'general' ? row.warehouseExternalId : null;
    const existing =
      (externalId ? await prismaAny.warehouse.findFirst({ where: { companyId, externalId } }) : null) ||
      await prismaAny.warehouse.findFirst({ where: { companyId, name: row.warehouseName } });

    const data = this.toWarehouseData(companyId, { externalId, name: row.warehouseName || 'Umumiy', isActive: true });

    if (existing) return prismaAny.warehouse.update({ where: { id: existing.id }, data });
    return prismaAny.warehouse.create({ data });
  }

  private toProductData(companyId: string, body: any) {
    const currency = this.normalizeCurrency(body.currency || 'UZS');
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
      currency,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
  }

  private toWarehouseData(companyId: string, body: any) {
    return { companyId, externalId: body.externalId || null, name: String(body.name || '').trim(), address: body.address || null, isActive: body.isActive === undefined ? true : Boolean(body.isActive) };
  }

  private pickMoyskladPrice(item: any) {
    const salePrices = Array.isArray(item?.salePrices) ? item.salePrices : [];
    const preferred =
      salePrices.find((price: any) => this.pickCurrency(price) === 'USD') ||
      salePrices.find((price: any) => /прод|sale|сот/i.test(String(price?.priceType?.name || price?.name || ''))) ||
      salePrices[0];
    const value = preferred?.value ?? preferred?.price ?? item?.price ?? 0;
    const currency = this.pickCurrency(preferred) || this.pickCurrency(item) || 'UZS';
    return this.normalizePrice(value, currency);
  }

  private pickMoyskladBuyPrice(item: any) {
    const value = item?.buyPrice?.value ?? item?.buyPrice?.price ?? 0;
    const currency = this.pickCurrency(item?.buyPrice) || this.pickCurrency(item) || 'UZS';
    return this.normalizePrice(value, currency);
  }

  private normalizePrice(value: any, currency = 'UZS') {
    const n = Math.abs(this.safeNumber(value));
    if (!Number.isFinite(n)) return 0;
    const cur = this.normalizeCurrency(currency);

    if (cur === 'USD') {
      if (n >= 1000 && Number.isInteger(n) && n % 1000 === 0) return this.round2(n / 1000);
      if (n >= 10000 && Number.isInteger(n) && n % 100 === 0) return this.round2(n / 100);
      return this.round2(n);
    }

    if (n >= 10000000000 && Number.isInteger(n) && n % 100 === 0) return this.round2(n / 100);
    return this.round2(n);
  }

  private pickBarcode(item: any) {
    const barcodes = item?.barcodes || [];
    const first = Array.isArray(barcodes) ? barcodes[0] : null;
    return String(first?.ean13 || first?.ean8 || first?.code || item?.barcode || '').trim();
  }

  private pickCurrency(item: any) {
    const raw = String(
      item?.currency?.isoCode ||
      item?.currency?.name ||
      item?.currency?.code ||
      item?.rate?.currency?.isoCode ||
      item?.rate?.currency?.name ||
      item?.salePrices?.[0]?.currency?.isoCode ||
      item?.salePrices?.[0]?.currency?.name ||
      item?.priceType?.currency?.isoCode ||
      item?.priceType?.currency?.name ||
      item?.name ||
      '',
    ).toUpperCase();
    if (raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ')) return 'USD';
    if (raw.includes('UZS') || raw.includes('СУМ') || raw.includes('SO') || raw.includes('UZS')) return 'UZS';
    return '';
  }

  private extractExternalId(item: any) {
    const href = String(item?.meta?.href || item?.href || '').trim();
    const fromHref = href ? href.split('/').pop()?.split('?')[0] : '';
    return String(item?.id || fromHref || '').trim() || null;
  }

  private normalizeCurrency(value: any) {
    const raw = String(value || 'UZS').trim().toUpperCase();
    return raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ') ? 'USD' : 'UZS';
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
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const clean = String(value).replace(/\s/g, '').replace(/,/g, '.').replace(/[^0-9.\-]/g, '');
    const normalized = clean.includes('.') ? clean.replace(/\.(?=.*\.)/g, '') : clean;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  private round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
