import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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
  costPrice: number;
  salePrice: number;
  currency: string;
  reserve?: number;
  inTransit?: number;
  available?: number;
  daysOnStock?: number;
};

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async products(companyId: string) {
    const products = await this.rawProducts(companyId);
    const stockRows = await this.rawStock(companyId);
    return products.map((product) =>
      this.attachProductStock(product, stockRows),
    );
  }

  async warehouses(companyId: string) {
    const warehouses = await this.rawWarehouses(companyId);
    const stockRows = await this.rawStock(companyId);

    return warehouses.map((warehouse) => {
      const rows = stockRows.filter(
        (row) =>
          row.warehouseId === warehouse.id ||
          this.sameWarehouse(row.warehouseName, warehouse.name),
      );
      const productCount = new Set(
        rows.map((row) => row.productId || this.stockProductKey(row)),
      ).size;
      const totalQuantity = rows.reduce(
        (sum, row) => sum + this.safeNumber(row.quantity),
        0,
      );
      const totalCostValueUSD = rows.reduce(
        (sum, row) =>
          sum +
          this.safeNumber(row.quantity) *
            this.safeNumber(row.costPrice || row.price),
        0,
      );
      const totalSaleValueUSD = rows.reduce(
        (sum, row) =>
          sum +
          this.safeNumber(row.quantity) *
            this.safeNumber(row.salePrice || row.price),
        0,
      );

      return {
        ...warehouse,
        productCount,
        totalQuantity,
        totalValue: this.round2(totalSaleValueUSD),
        totalValueUSD: this.round2(totalSaleValueUSD),
        totalValueUZS: 0,
        totalCostValueUSD: this.round2(totalCostValueUSD),
        totalSaleValueUSD: this.round2(totalSaleValueUSD),
      };
    });
  }

  async summary(companyId: string) {
    const products = await this.products(companyId);
    const warehouses = await this.warehouses(companyId);

    return {
      products: products.length,
      warehouses: warehouses.length,
      totalQuantity: products.reduce(
        (sum, product) => sum + this.safeNumber(product.stock),
        0,
      ),
      totalValueUZS: 0,
      totalValueUSD: this.round2(
        products.reduce(
          (sum, product) =>
            sum +
            this.safeNumber(
              product.stockSaleValueUSD ||
                product.stockValueUSD ||
                product.stockValue,
            ),
          0,
        ),
      ),
      totalValue: this.round2(
        products.reduce(
          (sum, product) =>
            sum +
            this.safeNumber(
              product.stockSaleValueUSD ||
                product.stockValueUSD ||
                product.stockValue,
            ),
          0,
        ),
      ),
      totalCostValueUSD: this.round2(
        products.reduce(
          (sum, product) => sum + this.safeNumber(product.stockCostValueUSD),
          0,
        ),
      ),
      totalSaleValueUSD: this.round2(
        products.reduce(
          (sum, product) =>
            sum +
            this.safeNumber(
              product.stockSaleValueUSD ||
                product.stockValueUSD ||
                product.stockValue,
            ),
          0,
        ),
      ),
      topWarehouses: warehouses
        .slice()
        .sort(
          (a, b) =>
            this.safeNumber(b.totalQuantity) - this.safeNumber(a.totalQuantity),
        )
        .slice(0, 10),
    };
  }

  async warehouseDetail(companyId: string, id: string) {
    const warehouses = await this.warehouses(companyId);
    const warehouse = warehouses.find(
      (item) => item.id === id || item.name === id,
    );
    if (!warehouse)
      return {
        warehouse: null,
        items: [],
        totalQuantity: 0,
        totalValue: 0,
        totalValueUZS: 0,
        totalValueUSD: 0,
      };

    const products = await this.rawProducts(companyId);
    const stockRows = await this.rawStock(companyId);
    const rows = stockRows.filter(
      (row) =>
        row.warehouseId === warehouse.id ||
        this.sameWarehouse(row.warehouseName, warehouse.name),
    );

    const items = rows
      .map((row) => {
        const product = products.find(
          (p) => p.id === row.productId || this.sameProduct(row, p),
        );
        const currency = "USD";
        const costPrice = this.safeNumber(
          row.costPrice ||
            product?.costPrice ||
            row.price ||
            product?.salePrice ||
            product?.price ||
            0,
        );
        const salePrice = this.safeNumber(
          row.salePrice ||
            row.price ||
            product?.salePrice ||
            product?.price ||
            0,
        );
        const quantity = this.safeNumber(row.quantity);
        return {
          productId: product?.id || row.productId || "",
          name: product?.name || row.productName || "Nomsiz mahsulot",
          sku: product?.sku || row.sku || "",
          barcode: product?.barcode || row.barcode || "",
          category: product?.category || "",
          quantity,
          reserve: this.safeNumber(row.reserve),
          inTransit: this.safeNumber(row.inTransit),
          available: this.safeNumber(row.available || quantity),
          daysOnStock: this.safeNumber(row.daysOnStock),
          costPrice,
          salePrice,
          price: salePrice,
          costValue: this.round2(quantity * costPrice),
          saleValue: this.round2(quantity * salePrice),
          value: this.round2(quantity * salePrice),
          currency,
        };
      })
      .filter((item) => item.quantity !== 0)
      .sort((a, b) => b.value - a.value);

    const totalCostValueUSD = items.reduce(
      (sum, item) => sum + this.safeNumber(item.costValue),
      0,
    );
    const totalSaleValueUSD = items.reduce(
      (sum, item) => sum + this.safeNumber(item.saleValue || item.value),
      0,
    );

    return {
      warehouse,
      items,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      totalValue: this.round2(totalSaleValueUSD),
      totalValueUZS: 0,
      totalValueUSD: this.round2(totalSaleValueUSD),
      totalCostValueUSD: this.round2(totalCostValueUSD),
      totalSaleValueUSD: this.round2(totalSaleValueUSD),
    };
  }

  async createProduct(companyId: string, body: any) {
    const prismaAny = this.prisma as any;
    const data = this.toProductData(companyId, body);
    if (prismaAny.product?.create) return prismaAny.product.create({ data });

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
    if (prismaAny.warehouse?.create)
      return prismaAny.warehouse.create({ data });

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
    const name = String(item?.name || "").trim();
    if (!name) return { action: "skipped", product: null };

    const externalId = this.extractExternalId(item);
    const sku = String(item?.article || item?.code || "").trim();
    const barcode = this.pickBarcode(item);
    const currency = "USD";

    const data = this.toProductData(companyId, {
      externalId,
      name,
      sku,
      barcode,
      model: item?.code || "",
      category: String(
        item?.pathName || item?.productFolder?.name || "",
      ).trim(),
      description: [
        item?.description || "",
        externalId ? `MoySklad ID: ${externalId}` : "",
      ]
        .filter(Boolean)
        .join("\n"),
      costPrice: this.pickMoyskladBuyPrice(item),
      salePrice: this.pickMoyskladPrice(item),
      currency,
      isActive: true,
    });

    if (
      prismaAny.product?.findFirst &&
      prismaAny.product?.update &&
      prismaAny.product?.create
    ) {
      const existing =
        (externalId
          ? await prismaAny.product.findFirst({
              where: { companyId, externalId },
            })
          : null) ||
        (sku
          ? await prismaAny.product.findFirst({ where: { companyId, sku } })
          : null) ||
        (barcode
          ? await prismaAny.product.findFirst({ where: { companyId, barcode } })
          : null) ||
        (await prismaAny.product.findFirst({ where: { companyId, name } }));

      if (existing) {
        const product = await prismaAny.product.update({
          where: { id: existing.id },
          data,
        });
        return { action: "updated", product };
      }

      const product = await prismaAny.product.create({ data });
      return { action: "created", product };
    }

    const list = memoryProducts.get(companyId) || [];
    const index = list.findIndex(
      (p) =>
        (externalId && p.externalId === externalId) ||
        (sku && p.sku === sku) ||
        (barcode && p.barcode === barcode) ||
        p.name === name,
    );
    if (index >= 0) {
      list[index] = {
        ...list[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      memoryProducts.set(companyId, list);
      return { action: "updated", product: list[index] };
    }

    const product = {
      id: `product_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(product);
    memoryProducts.set(companyId, list);
    return { action: "created", product };
  }

  async upsertWarehouseFromMoysklad(companyId: string, item: any) {
    const prismaAny = this.prisma as any;
    const name = String(item?.name || "").trim();
    if (!name) return { action: "skipped", warehouse: null };

    const externalId = this.extractExternalId(item);
    const data = this.toWarehouseData(companyId, {
      externalId,
      name,
      address: item?.address || "",
      isActive: true,
    });

    if (
      prismaAny.warehouse?.findFirst &&
      prismaAny.warehouse?.update &&
      prismaAny.warehouse?.create
    ) {
      const existing =
        (externalId
          ? await prismaAny.warehouse.findFirst({
              where: { companyId, externalId },
            })
          : null) ||
        (await prismaAny.warehouse.findFirst({ where: { companyId, name } }));

      if (existing) {
        const warehouse = await prismaAny.warehouse.update({
          where: { id: existing.id },
          data,
        });
        return { action: "updated", warehouse };
      }

      const warehouse = await prismaAny.warehouse.create({ data });
      return { action: "created", warehouse };
    }

    const list = memoryWarehouses.get(companyId) || [];
    const index = list.findIndex(
      (w) => (externalId && w.externalId === externalId) || w.name === name,
    );
    if (index >= 0) {
      list[index] = {
        ...list[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      memoryWarehouses.set(companyId, list);
      return { action: "updated", warehouse: list[index] };
    }

    const warehouse = {
      id: `warehouse_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    list.unshift(warehouse);
    memoryWarehouses.set(companyId, list);
    return { action: "created", warehouse };
  }

  async replaceStockFromMoysklad(companyId: string, rows: any[]) {
    const prismaAny = this.prisma as any;
    const normalizedRows: StockRow[] = [];

    const warehouseMap = await this.buildWarehouseMap(companyId);

    for (const item of rows || []) {
      const baseProduct =
        item?.assortment || item?.product || item?.good || item;
      const productName = String(item?.name || baseProduct?.name || "").trim();
      const sku = String(
        item?.article ||
          item?.code ||
          baseProduct?.article ||
          baseProduct?.code ||
          "",
      ).trim();
      const barcode =
        this.pickBarcode(item) || this.pickBarcode(baseProduct || {});
      const productExternalId = this.extractExternalId(baseProduct || item);
      const currency = "USD";
      const costPrice = this.pickMoyskladCostPrice(item, baseProduct);
      const salePrice = this.pickMoyskladSalePrice(item, baseProduct);
      const price = salePrice || costPrice;

      const storeRows = this.extractStoreRows(item);
      for (const storeRow of storeRows) {
        const storeObj =
          storeRow?.store ||
          storeRow?.warehouse ||
          storeRow?.stockStore ||
          storeRow?.stockByStore ||
          storeRow;
        const warehouseExternalId =
          this.extractExternalId(storeObj) ||
          this.extractExternalId(storeRow) ||
          null;
        const warehouseName = this.resolveWarehouseName(
          storeObj,
          storeRow,
          warehouseMap,
          warehouseExternalId,
        );
        const quantity = this.safeNumber(
          storeRow?.stock ??
            storeRow?.quantity ??
            storeRow?.count ??
            storeRow?.value ??
            item?.stock ??
            item?.quantity ??
            0,
        );

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
          costPrice,
          salePrice: salePrice || price,
          currency,
          reserve: this.safeNumber(storeRow?.reserve ?? item?.reserve ?? 0),
          inTransit: this.safeNumber(
            storeRow?.inTransit ??
              item?.inTransit ??
              storeRow?.inTransitQuantity ??
              0,
          ),
          available: this.safeNumber(
            storeRow?.available ?? item?.available ?? quantity,
          ),
          daysOnStock: this.safeNumber(
            storeRow?.daysOnStock ?? item?.daysOnStock ?? item?.stockDays ?? 0,
          ),
        });
      }
    }

    memoryStock.set(companyId, normalizedRows);

    if (
      prismaAny.inventoryBalance?.deleteMany &&
      prismaAny.inventoryBalance?.upsert
    ) {
      await prismaAny.inventoryBalance.deleteMany({ where: { companyId } });

      for (const row of normalizedRows) {
        const product = await this.ensureProductFromStockRow(companyId, row);
        const warehouse = await this.ensureWarehouseFromStockRow(
          companyId,
          row,
        );
        if (!product?.id || !warehouse?.id) continue;

        const externalKey = `${product.id}:${warehouse.id}`;
        const currency = "USD";
        const price = this.safeNumber(
          row.salePrice || row.price || product.salePrice || 0,
        );

        await prismaAny.inventoryBalance.upsert({
          where: { companyId_externalKey: { companyId, externalKey } },
          update: {
            quantity: row.quantity,
            price,
            currency,
            productId: product.id,
            warehouseId: warehouse.id,
          },
          create: {
            companyId,
            externalKey,
            quantity: row.quantity,
            price,
            currency,
            productId: product.id,
            warehouseId: warehouse.id,
          },
        });
      }
    }

    return {
      rows: normalizedRows.length,
      products: new Set(
        normalizedRows.map(
          (row) =>
            row.productExternalId || row.sku || row.barcode || row.productName,
        ),
      ).size,
      warehouses: new Set(
        normalizedRows.map(
          (row) => row.warehouseExternalId || row.warehouseName,
        ),
      ).size,
      totalQuantity: normalizedRows.reduce(
        (sum, row) => sum + this.safeNumber(row.quantity),
        0,
      ),
    };
  }

  private async buildWarehouseMap(companyId: string) {
    const warehouses = await this.rawWarehouses(companyId);
    const map = new Map<string, any>();
    for (const warehouse of warehouses) {
      if (warehouse.externalId)
        map.set(String(warehouse.externalId), warehouse);
      if (warehouse.name)
        map.set(String(warehouse.name).trim().toLowerCase(), warehouse);
    }
    return map;
  }

  private extractStoreRows(item: any) {
    const candidates = [
      item?.stockByStore,
      item?.stockByWarehouse,
      item?.byStore,
      item?.stores,
      item?.storeStock,
    ].filter(Array.isArray);
    if (candidates.length) return candidates.flat();
    return [item];
  }

  private resolveWarehouseName(
    storeObj: any,
    storeRow: any,
    warehouseMap: Map<string, any>,
    externalId?: string | null,
  ) {
    const fromObject = String(
      storeObj?.name ||
        storeRow?.name ||
        storeRow?.storeName ||
        storeRow?.warehouseName ||
        "",
    ).trim();
    if (fromObject) return fromObject;
    if (externalId && warehouseMap.get(externalId)?.name)
      return warehouseMap.get(externalId).name;
    return "Umumiy";
  }

  private async rawProducts(companyId: string) {
    const prismaAny = this.prisma as any;
    if (prismaAny.product?.findMany)
      return prismaAny.product.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });
    return memoryProducts.get(companyId) || [];
  }

  private async rawWarehouses(companyId: string) {
    const prismaAny = this.prisma as any;
    if (prismaAny.warehouse?.findMany)
      return prismaAny.warehouse.findMany({
        where: { companyId },
        orderBy: { createdAt: "desc" },
      });
    return memoryWarehouses.get(companyId) || [];
  }

  private async rawStock(companyId: string) {
    const prismaAny = this.prisma as any;
    if (prismaAny.inventoryBalance?.findMany) {
      const rows = await prismaAny.inventoryBalance.findMany({
        where: { companyId },
        include: { product: true, warehouse: true },
        orderBy: { updatedAt: "desc" },
      });

      return rows.map((row: any) => ({
        productId: row.productId,
        productName: row.product?.name || "",
        sku: row.product?.sku || "",
        barcode: row.product?.barcode || "",
        warehouseId: row.warehouseId,
        warehouseName: row.warehouse?.name || "",
        quantity: row.quantity,
        price: row.price || row.product?.salePrice || 0,
        costPrice: row.product?.costPrice || 0,
        salePrice: row.product?.salePrice || row.price || 0,
        currency: "USD",
      }));
    }
    return memoryStock.get(companyId) || [];
  }

  private attachProductStock(product: any, stockRows: any[]) {
    const rows = stockRows.filter(
      (row) => row.productId === product.id || this.sameProduct(row, product),
    );
    const stock = rows.reduce(
      (sum, row) => sum + this.safeNumber(row.quantity),
      0,
    );
    const currency = "USD";
    const costPrice = this.safeNumber(
      product.costPrice || rows[0]?.costPrice || 0,
    );
    const salePrice = this.safeNumber(
      product.salePrice ||
        product.price ||
        rows[0]?.salePrice ||
        rows[0]?.price ||
        0,
    );
    const stockCostValue = stock * costPrice;
    const stockSaleValue = stock * salePrice;

    return {
      ...product,
      currency,
      costPrice,
      salePrice,
      price: salePrice,
      stock,
      stockValue: this.round2(stockSaleValue),
      stockValueUZS: 0,
      stockValueUSD: this.round2(stockSaleValue),
      stockCostValueUSD: this.round2(stockCostValue),
      stockSaleValueUSD: this.round2(stockSaleValue),
      warehouses: rows.map((row) => {
        const q = this.safeNumber(row.quantity);
        const rowCost = this.safeNumber(row.costPrice || costPrice);
        const rowSale = this.safeNumber(
          row.salePrice || row.price || salePrice,
        );
        return {
          warehouseId: row.warehouseId,
          warehouseName: row.warehouseName,
          quantity: q,
          reserve: this.safeNumber(row.reserve),
          inTransit: this.safeNumber(row.inTransit),
          available: this.safeNumber(row.available || q),
          daysOnStock: this.safeNumber(row.daysOnStock),
          costPrice: rowCost,
          salePrice: rowSale,
          price: rowSale,
          currency,
          costValue: this.round2(q * rowCost),
          saleValue: this.round2(q * rowSale),
          value: this.round2(q * rowSale),
        };
      }),
    };
  }

  private async ensureProductFromStockRow(companyId: string, row: StockRow) {
    const prismaAny = this.prisma as any;
    const existing =
      (row.productExternalId
        ? await prismaAny.product.findFirst({
            where: { companyId, externalId: row.productExternalId },
          })
        : null) ||
      (row.sku
        ? await prismaAny.product.findFirst({
            where: { companyId, sku: row.sku },
          })
        : null) ||
      (row.barcode
        ? await prismaAny.product.findFirst({
            where: { companyId, barcode: row.barcode },
          })
        : null) ||
      (await prismaAny.product.findFirst({
        where: { companyId, name: row.productName },
      }));

    const data = this.toProductData(companyId, {
      externalId: row.productExternalId || null,
      name: row.productName,
      sku: row.sku,
      barcode: row.barcode,
      costPrice: row.costPrice || 0,
      salePrice: row.salePrice || row.price || 0,
      currency: "USD",
      isActive: true,
    });

    if (existing) {
      return prismaAny.product.update({ where: { id: existing.id }, data });
    }

    return prismaAny.product.create({ data });
  }

  private async ensureWarehouseFromStockRow(companyId: string, row: StockRow) {
    const prismaAny = this.prisma as any;
    const externalId =
      row.warehouseExternalId && row.warehouseExternalId !== "general"
        ? row.warehouseExternalId
        : null;
    const existing =
      (externalId
        ? await prismaAny.warehouse.findFirst({
            where: { companyId, externalId },
          })
        : null) ||
      (await prismaAny.warehouse.findFirst({
        where: { companyId, name: row.warehouseName },
      }));

    const data = this.toWarehouseData(companyId, {
      externalId,
      name: row.warehouseName || "Umumiy",
      isActive: true,
    });

    if (existing)
      return prismaAny.warehouse.update({ where: { id: existing.id }, data });
    return prismaAny.warehouse.create({ data });
  }

  private toProductData(companyId: string, body: any) {
    const currency = "USD";
    return {
      companyId,
      externalId: body.externalId || null,
      name: String(body.name || body.title || "").trim(),
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
    return {
      companyId,
      externalId: body.externalId || null,
      name: String(body.name || "").trim(),
      address: body.address || null,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    };
  }

  private pickMoyskladPrice(item: any) {
    return this.pickMoyskladSalePrice(item, item);
  }

  private pickMoyskladBuyPrice(item: any) {
    return this.pickMoyskladCostPrice(item, item);
  }

  private pickMoyskladSalePrice(item: any, baseProduct?: any) {
    const salePrices = Array.isArray(baseProduct?.salePrices)
      ? baseProduct.salePrices
      : Array.isArray(item?.salePrices)
        ? item.salePrices
        : [];
    const preferred =
      salePrices.find((price: any) =>
        /прод|sale|сот|рознич/i.test(
          String(price?.priceType?.name || price?.name || ""),
        ),
      ) ||
      salePrices.find((price: any) => price?.value || price?.price) ||
      null;

    return this.normalizePrice(
      this.firstMoneyValue(
        item?.salePrice,
        item?.salePriceValue,
        item?.price,
        item?.sellPrice,
        item?.saleSum && this.safeNumber(item?.stock)
          ? this.safeNumber(item.saleSum) /
              Math.max(1, this.safeNumber(item.stock))
          : undefined,
        preferred?.value,
        preferred?.price,
        baseProduct?.price,
      ),
      "USD",
    );
  }

  private pickMoyskladCostPrice(item: any, baseProduct?: any) {
    return this.normalizePrice(
      this.firstMoneyValue(
        item?.costPrice,
        item?.cost,
        item?.stockCost,
        item?.avgCost,
        item?.averageCost,
        item?.buyPrice,
        item?.buyPrice?.value,
        item?.buyPrice?.price,
        item?.costSum && this.safeNumber(item?.stock)
          ? this.safeNumber(item.costSum) /
              Math.max(1, this.safeNumber(item.stock))
          : undefined,
        item?.sumCost && this.safeNumber(item?.stock)
          ? this.safeNumber(item.sumCost) /
              Math.max(1, this.safeNumber(item.stock))
          : undefined,
        baseProduct?.buyPrice?.value,
        baseProduct?.buyPrice?.price,
      ),
      "USD",
    );
  }

  private firstMoneyValue(...values: any[]) {
    for (const value of values) {
      const n = this.extractMoneyValue(value);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return 0;
  }

  private extractMoneyValue(value: any): number {
    if (value === undefined || value === null || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") return this.safeNumber(value);
    if (typeof value === "object") {
      return this.firstMoneyValue(
        value.value,
        value.price,
        value.amount,
        value.sum,
        value.cost,
        value.salePrice,
        value.costPrice,
      );
    }
    return 0;
  }

  private normalizePrice(value: any, currency = "USD") {
    const n = Math.abs(this.safeNumber(value));
    if (!Number.isFinite(n)) return 0;

    // Digi World MoySklad narxlari USD'da, API qiymati oxirida 2 ta qo'shimcha 0 bilan keladi.
    // 45000 -> 450 USD, 75400 -> 754 USD, 118000 -> 1180 USD.
    if (n >= 100) return this.round2(n / 100);
    return this.round2(n);
  }

  private pickBarcode(item: any) {
    const barcodes = item?.barcodes || [];
    const first = Array.isArray(barcodes) ? barcodes[0] : null;
    return String(
      first?.ean13 || first?.ean8 || first?.code || item?.barcode || "",
    ).trim();
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
        "",
    ).toUpperCase();
    return "USD";
  }

  private extractExternalId(item: any) {
    const href = String(item?.meta?.href || item?.href || "").trim();
    const fromHref = href ? href.split("/").pop()?.split("?")[0] : "";
    return String(item?.id || fromHref || "").trim() || null;
  }

  private normalizeCurrency(value: any) {
    return "USD";
  }

  private sameProduct(row: any, product: any) {
    const rowSku = String(row.sku || "")
      .trim()
      .toLowerCase();
    const rowBarcode = String(row.barcode || "")
      .trim()
      .toLowerCase();
    const rowName = String(row.productName || "")
      .trim()
      .toLowerCase();
    const productSku = String(product.sku || "")
      .trim()
      .toLowerCase();
    const productBarcode = String(product.barcode || "")
      .trim()
      .toLowerCase();
    const productName = String(product.name || "")
      .trim()
      .toLowerCase();
    return Boolean(
      (rowSku && productSku && rowSku === productSku) ||
      (rowBarcode && productBarcode && rowBarcode === productBarcode) ||
      (rowName && productName && rowName === productName),
    );
  }

  private sameWarehouse(a: string, b: string) {
    return (
      String(a || "")
        .trim()
        .toLowerCase() ===
      String(b || "")
        .trim()
        .toLowerCase()
    );
  }

  private stockProductKey(row: any) {
    return `${row.productId || ""}|${row.sku || ""}|${row.barcode || ""}|${row.productName || ""}`;
  }

  private safeNumber(value: any) {
    if (value === undefined || value === null || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const clean = String(value)
      .replace(/\s/g, "")
      .replace(/,/g, ".")
      .replace(/[^0-9.\-]/g, "");
    const normalized = clean.includes(".")
      ? clean.replace(/\.(?=.*\.)/g, "")
      : clean;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  private round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
