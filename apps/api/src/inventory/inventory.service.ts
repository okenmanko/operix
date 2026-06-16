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
    const stockRows = memoryStock.get(companyId) || [];

    return products.map((product) => this.attachProductStock(product, stockRows));
  }

  async warehouses(companyId: string) {
    const warehouses = await this.rawWarehouses(companyId);
    const products = await this.products(companyId);
    const stockRows = memoryStock.get(companyId) || [];

    return warehouses.map((warehouse) => {
      const rows = stockRows.filter((row) => this.sameWarehouse(row.warehouseName, warehouse.name));
      const productCount = new Set(rows.map((row) => this.stockProductKey(row))).size;
      const totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
      const totalValue = rows.reduce((sum, row) => {
        const product = products.find((p) => this.sameProduct(row, p));
        const price = Number(product?.salePrice || product?.price || 0);
        return sum + Number(row.quantity || 0) * price;
      }, 0);

      return {
        ...warehouse,
        productCount,
        totalQuantity,
        totalValue,
      };
    });
  }

  async summary(companyId: string) {
    const products = await this.products(companyId);
    const warehouses = await this.warehouses(companyId);

    const totalQuantity = products.reduce((sum, product) => sum + Number(product.stock || 0), 0);
    const totalValue = products.reduce((sum, product) => sum + Number(product.stockValue || 0), 0);

    return {
      products: products.length,
      warehouses: warehouses.length,
      totalQuantity,
      totalValue,
      topWarehouses: warehouses
        .slice()
        .sort((a, b) => Number(b.totalValue || 0) - Number(a.totalValue || 0))
        .slice(0, 10),
    };
  }

  async warehouseDetail(companyId: string, id: string) {
    const warehouses = await this.warehouses(companyId);
    const warehouse = warehouses.find((item) => item.id === id || item.name === id);

    if (!warehouse) {
      return { warehouse: null, items: [], totalQuantity: 0, totalValue: 0 };
    }

    const products = await this.products(companyId);
    const stockRows = memoryStock.get(companyId) || [];
    const rows = stockRows.filter((row) => this.sameWarehouse(row.warehouseName, warehouse.name));

    const items = rows
      .map((row) => {
        const product = products.find((p) => this.sameProduct(row, p));
        const price = Number(product?.salePrice || product?.price || 0);
        const quantity = Number(row.quantity || 0);

        return {
          productId: product?.id || '',
          name: product?.name || row.productName,
          sku: product?.sku || row.sku || '',
          barcode: product?.barcode || row.barcode || '',
          category: product?.category || '',
          quantity,
          price,
          value: quantity * price,
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

    if (prismaAny.product?.create) {
      return prismaAny.product.create({ data });
    }

    const list = memoryProducts.get(companyId) || [];
    const item = {
      id: `product_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(item);
    memoryProducts.set(companyId, list);
    return item;
  }

  async createWarehouse(companyId: string, body: any) {
    const prismaAny = this.prisma as any;
    const data = this.toWarehouseData(companyId, body);

    if (prismaAny.warehouse?.create) {
      return prismaAny.warehouse.create({ data });
    }

    const list = memoryWarehouses.get(companyId) || [];
    const item = {
      id: `warehouse_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    list.unshift(item);
    memoryWarehouses.set(companyId, list);
    return item;
  }

  async upsertProductFromMoysklad(companyId: string, item: any) {
    const prismaAny = this.prisma as any;

    const name = String(item?.name || '').trim();
    if (!name) return { action: 'skipped' };

    const sku = String(item?.article || item?.code || '').trim();
    const barcode = String(item?.barcodes?.[0]?.ean13 || item?.barcodes?.[0]?.ean8 || '').trim();

    const data = this.toProductData(companyId, {
      name,
      sku,
      barcode,
      model: item?.code || '',
      category: String(item?.pathName || '').trim(),
      description: [item?.description || '', item?.id ? `MoySklad ID: ${item.id}` : ''].filter(Boolean).join('\n'),
      costPrice: this.pickMoyskladBuyPrice(item),
      salePrice: this.pickMoyskladPrice(item),
      currency: 'USD',
      isActive: true,
    });

    if (prismaAny.product?.findFirst && prismaAny.product?.update && prismaAny.product?.create) {
      const existing =
        (sku ? await prismaAny.product.findFirst({ where: { companyId, sku } }) : null) ||
        (barcode ? await prismaAny.product.findFirst({ where: { companyId, barcode } }) : null) ||
        (await prismaAny.product.findFirst({ where: { companyId, name } }));

      if (existing) {
        await prismaAny.product.update({ where: { id: existing.id }, data });
        return { action: 'updated' };
      }

      await prismaAny.product.create({ data });
      return { action: 'created' };
    }

    const list = memoryProducts.get(companyId) || [];
    const index = list.findIndex((p) => (sku && p.sku === sku) || (barcode && p.barcode === barcode) || p.name === name);

    if (index >= 0) {
      list[index] = { ...list[index], ...data, updatedAt: new Date().toISOString() };
      memoryProducts.set(companyId, list);
      return { action: 'updated' };
    }

    list.unshift({
      id: `product_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    memoryProducts.set(companyId, list);
    return { action: 'created' };
  }

  async upsertWarehouseFromMoysklad(companyId: string, item: any) {
    const prismaAny = this.prisma as any;

    const name = String(item?.name || '').trim();
    if (!name) return { action: 'skipped' };

    const data = this.toWarehouseData(companyId, {
      name,
      address: item?.address || '',
      isActive: true,
    });

    if (prismaAny.warehouse?.findFirst && prismaAny.warehouse?.update && prismaAny.warehouse?.create) {
      const existing = await prismaAny.warehouse.findFirst({ where: { companyId, name } });

      if (existing) {
        await prismaAny.warehouse.update({ where: { id: existing.id }, data });
        return { action: 'updated' };
      }

      await prismaAny.warehouse.create({ data });
      return { action: 'created' };
    }

    const list = memoryWarehouses.get(companyId) || [];
    const index = list.findIndex((w) => w.name === name);

    if (index >= 0) {
      list[index] = { ...list[index], ...data, updatedAt: new Date().toISOString() };
      memoryWarehouses.set(companyId, list);
      return { action: 'updated' };
    }

    list.unshift({
      id: `warehouse_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    memoryWarehouses.set(companyId, list);
    return { action: 'created' };
  }

  async replaceStockFromMoysklad(companyId: string, rows: any[]) {
    const nextRows: any[] = [];

    for (const item of rows) {
      const productName = String(item?.name || item?.assortment?.name || '').trim();
      const sku = String(item?.article || item?.code || item?.assortment?.article || item?.assortment?.code || '').trim();
      const barcode = String(item?.barcodes?.[0]?.ean13 || item?.assortment?.barcodes?.[0]?.ean13 || '').trim();

      const stockByStore = item?.stockByStore || item?.stockByWarehouse || item?.byStore || item?.stores || [];

      if (Array.isArray(stockByStore) && stockByStore.length) {
        for (const storeRow of stockByStore) {
          const warehouseName = String(
            storeRow?.name ||
            storeRow?.store?.name ||
            storeRow?.warehouse?.name ||
            storeRow?.meta?.href ||
            'Sklad'
          ).trim();

          const quantity = Number(storeRow?.stock ?? storeRow?.quantity ?? storeRow?.count ?? 0);

          if (!warehouseName || quantity === 0) continue;

          nextRows.push({ productName, sku, barcode, warehouseName, quantity });
        }
      } else {
        const quantity = Number(item?.stock ?? item?.quantity ?? 0);
        if (quantity !== 0) {
          nextRows.push({ productName, sku, barcode, warehouseName: 'Umumiy', quantity });
        }
      }
    }

    memoryStock.set(companyId, nextRows);

    return {
      rows: nextRows.length,
      totalQuantity: nextRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    };
  }

  private async rawProducts(companyId: string) {
    const prismaAny = this.prisma as any;

    if (prismaAny.product?.findMany) {
      return prismaAny.product.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return memoryProducts.get(companyId) || [];
  }

  private async rawWarehouses(companyId: string) {
    const prismaAny = this.prisma as any;

    if (prismaAny.warehouse?.findMany) {
      return prismaAny.warehouse.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return memoryWarehouses.get(companyId) || [];
  }

  private attachProductStock(product: any, stockRows: any[]) {
    const rows = stockRows.filter((row) => this.sameProduct(row, product));
    const stock = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    const price = Number(product.salePrice || product.price || 0);
    const stockValue = stock * price;

    return {
      ...product,
      stock,
      stockValue,
      warehouses: rows.map((row) => ({
        warehouseName: row.warehouseName,
        quantity: Number(row.quantity || 0),
        price,
        value: Number(row.quantity || 0) * price,
      })),
    };
  }

  private toProductData(companyId: string, body: any) {
    return {
      companyId,
      name: String(body.name || body.title || '').trim(),
      sku: body.sku || null,
      barcode: body.barcode || null,
      model: body.model || null,
      category: body.category || null,
      description: body.description || null,
      costPrice: Number(body.costPrice || body.buyPrice || 0),
      salePrice: Number(body.salePrice || body.price || 0),
      currency: body.currency || 'USD',
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
  }

  private toWarehouseData(companyId: string, body: any) {
    return {
      companyId,
      name: String(body.name || '').trim(),
      address: body.address || null,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
  }

  private pickMoyskladPrice(item: any) {
    const value = item?.salePrices?.[0]?.value ?? item?.salePrices?.[0]?.price ?? 0;
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return 0;
    return n / 100;
  }

  private pickMoyskladBuyPrice(item: any) {
    const value = item?.buyPrice?.value ?? item?.buyPrice?.price ?? 0;
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return 0;
    return n / 100;
  }

  private sameProduct(row: any, product: any) {
    const rowSku = String(row.sku || '').trim().toLowerCase();
    const rowBarcode = String(row.barcode || '').trim().toLowerCase();
    const rowName = String(row.productName || '').trim().toLowerCase();

    const productSku = String(product.sku || '').trim().toLowerCase();
    const productBarcode = String(product.barcode || '').trim().toLowerCase();
    const productName = String(product.name || '').trim().toLowerCase();

    return Boolean(
      (rowSku && productSku && rowSku === productSku) ||
      (rowBarcode && productBarcode && rowBarcode === productBarcode) ||
      (rowName && productName && rowName === productName)
    );
  }

  private sameWarehouse(a: string, b: string) {
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  private stockProductKey(row: any) {
    return `${row.sku || ''}|${row.barcode || ''}|${row.productName || ''}`;
  }
}
