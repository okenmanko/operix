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

    const totalValueUZS = items
      .filter((item) => this.normalizeCurrency(item.currency) === 'UZS')
      .reduce((sum, item) => sum + item.value, 0);
    const totalValueUSD = items
      .filter((item) => this.normalizeCurrency(item.currency) === 'USD')
      .reduce((sum, item) => sum + item.value, 0);

    return {
      warehouse,
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: totalValueUSD || totalValueUZS,
      totalValueUZS,
      totalValueUSD,
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
      const currency = this.pickCurrency(item?.assortment || item) || this.pickCurrency(item) || 'UZS';
      const price = this.pickMoyskladPrice(item?.assortment || item) || this.normalizePrice(item?.price ?? item?.salePrice ?? 0, currency);

      const stockByStore = item?.stockByStore || item?.stockByWarehouse || item?.byStore || item?.stores || item?.storeStock || [];
      if (Array.isArray(stockByStore) && stockByStore.length) {
        for (const storeRow of stockByStore) {
          const storeObj = storeRow?.store || storeRow?.warehouse || storeRow?.stockStore || storeRow;
          const warehouseName = String(storeObj?.name || storeRow?.name || storeRow?.storeName || storeRow?.warehouseName || 'Umumiy').trim();
          const warehouseExternalId = this.extractExternalId(storeObj) || this.extractExternalId(storeRow) || warehouseName;
          const quantity = this.safeNumber(storeRow?.stock ?? storeRow?.quantity ?? storeRow?.count ?? storeRow?.value ?? 0);
          if (!productName || !warehouseName || quantity === 0) continue;
          normalizedRows.push({ productName, sku, barcode, productExternalId, warehouseName, warehouseExternalId, quantity, price, currency });
        }
      } else {
        const warehouseName = String(item?.store?.name || item?.warehouse?.name || item?.stockStore?.name || item?.storeName || 'Umumiy').trim();
        const warehouseExternalId = this.extractExternalId(item?.store || item?.warehouse || item?.stockStore || {}) || warehouseName;
        const quantity = this.safeNumber(item?.stock ?? item?.quantity ?? item?.count ?? item?.value ?? 0);
        if (productName && quantity !== 0) normalizedRows.push({ productName, sku, barcode, productExternalId, warehouseName, warehouseExternalId, quantity, price, currency });
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
    const priceRow = Array.isArray(item?.salePrices) ? item.salePrices[0] : null;
    const value = priceRow?.value ?? priceRow?.price ?? item?.price ?? 0;
    const currency = this.pickCurrency(priceRow) || this.pickCurrency(item) || 'UZS';
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

    // Digi World MoySklad'da USD narxlar ko'pincha 45.000 / 45000 ko'rinishida saqlangan.
    // Bu 45$ degani. Shu uchun USD'dagi ortiqcha 000 kesiladi.
    if (cur === 'USD') {
      if (n >= 1000 && Number.isInteger(n) && n % 1000 === 0) return n / 1000;
      if (n >= 100000 && Number.isInteger(n) && n % 100 === 0) return n / 100;
      return n;
    }

    // UZS narxlar haqiqiy so'm bo'lib qoladi. Faqat juda katta minor-unit qiymatlar /100 qilinadi.
    if (n >= 10000000000 && Number.isInteger(n) && n % 100 === 0) return n / 100;
    return n;
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
      item?.salePrices?.[0]?.currency?.isoCode ||
      item?.salePrices?.[0]?.currency?.name ||
      item?.salePrices?.[0]?.currency?.code ||
      item?.priceType?.currency?.isoCode ||
      item?.priceType?.currency?.name ||
      item?.priceType?.currency?.code ||
      item?.name ||
      '',
    ).toUpperCase();
    if (raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ')) return 'USD';
    if (raw.includes('UZS') || raw.includes('СУМ') || raw.includes('SO')) return 'UZS';
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
    const n = Number(value || 0);
    return Number.isFinite(n) ? n : 0;
  }
}
