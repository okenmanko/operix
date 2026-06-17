import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

type Settings = {
  moyskladApiUrl: string;
  moyskladToken?: string;
  oneCBaseUrl?: string;
  oneCLogin?: string;
  oneCPassword?: string;
};

type SyncDebtResult = {
  created: number;
  updated: number;
  skipped: number;
};

const SETTINGS_PROVIDER = 'SETTINGS';
const LOG_PROVIDER = 'MOYSKLAD';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async getSettings(companyId: string) {
    const settings = await this.getRawSettings(companyId);

    return {
      ...settings,
      moyskladToken: settings.moyskladToken ? this.mask(settings.moyskladToken) : '',
      oneCPassword: settings.oneCPassword ? '********' : '',
      status: {
        moysklad: Boolean(settings.moyskladToken),
        oneC: Boolean(settings.oneCBaseUrl && settings.oneCLogin),
      },
    };
  }

  async saveSettings(companyId: string, body: any) {
    const current = await this.getRawSettings(companyId);

    const next: Settings = {
      moyskladApiUrl: body.moyskladApiUrl || current.moyskladApiUrl || 'https://api.moysklad.ru/api/remap/1.2',
      moyskladToken: this.unmask(body.moyskladToken, current.moyskladToken),
      oneCBaseUrl: body.oneCBaseUrl ?? current.oneCBaseUrl ?? '',
      oneCLogin: body.oneCLogin ?? current.oneCLogin ?? '',
      oneCPassword: this.unmaskPassword(body.oneCPassword, current.oneCPassword),
    };

    await this.setSetting(companyId, 'moyskladApiUrl', next.moyskladApiUrl);
    await this.setSetting(companyId, 'moyskladToken', next.moyskladToken || '');
    await this.setSetting(companyId, 'oneCBaseUrl', next.oneCBaseUrl || '');
    await this.setSetting(companyId, 'oneCLogin', next.oneCLogin || '');
    await this.setSetting(companyId, 'oneCPassword', next.oneCPassword || '');

    await this.pushHistory(companyId, 'SYSTEM', 'SETTINGS', 'SUCCESS', 'Sozlamalar saqlandi');

    return { ok: true };
  }

  async history(companyId: string) {
    const logs = await this.prisma.integrationLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      source: log.provider,
      type: log.action,
      status: log.status,
      message: log.message || '',
      ...(typeof log.payload === 'object' && log.payload ? (log.payload as any) : {}),
    }));
  }

  async testMoysklad(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      const data = await this.moyskladFetch(settings, '/entity/organization?limit=1');
      const orgName = data?.rows?.[0]?.name || 'MoySklad';

      const message = `MoySklad ulandi: ${orgName}`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'TEST', 'SUCCESS', message);

      return { ok: true, message };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'TEST', error?.message || 'MoySklad test xatosi');
    }
  }

  async syncMoyskladClients(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      const data = await this.moyskladFetch(settings, '/entity/counterparty?limit=1000');

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      let created = 0;
      let updated = 0;
      let skipped = 0;
      const debtResult: SyncDebtResult = { created: 0, updated: 0, skipped: 0 };

      for (const item of rows) {
        const name = String(item?.name || '').trim();
        const phone = this.pickPhone(item);

        if (!name) {
          skipped++;
          continue;
        }

        const existing = phone
          ? await this.prisma.client.findFirst({ where: { companyId, phone } })
          : await this.prisma.client.findFirst({ where: { companyId, fullName: name } });

        let client: any;

        if (existing) {
          client = await this.prisma.client.update({
            where: { id: existing.id },
            data: {
              fullName: name,
              phone: phone || existing.phone,
              address: item?.actualAddress || item?.legalAddress || existing.address,
            },
          });
          updated++;
        } else {
          client = await this.prisma.client.create({
            data: {
              companyId,
              fullName: name,
              phone: phone || this.noPhone(companyId, name),
              address: item?.actualAddress || item?.legalAddress || null,
              guarantorName: null,
              guarantorPhone: null,
            },
          });
          created++;
        }

        await this.upsertClientDebtFromMoysklad(client.id, item, debtResult);
      }

      await this.trySyncCounterpartyReportDebts(companyId, settings, debtResult);

      const message = `Mijozlar sync: ${created} yangi, ${updated} yangilandi, ${skipped} skip, qarz: ${debtResult.created} yangi/${debtResult.updated} yangilandi`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'CLIENTS', 'SUCCESS', message, { created, updated, skipped, debtResult });

      return { ok: true, message, created, updated, skipped, debtResult };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'CLIENTS', error?.message || 'Mijozlar sync xatosi');
    }
  }

  async syncMoyskladProducts(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      const rows = await this.loadAllMoyskladRows(settings, '/entity/product');
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const item of rows) {
        const result = await this.inventoryService.upsertProductFromMoysklad(companyId, item);
        if (result.action === 'created') created++;
        else if (result.action === 'updated') updated++;
        else skipped++;
      }

      const message = `Productlar sync: ${created} yangi, ${updated} yangilandi, ${skipped} skip`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'PRODUCTS', 'SUCCESS', message, { created, updated, skipped });

      return { ok: true, message, created, updated, skipped };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'PRODUCTS', error?.message || 'Productlar sync xatosi');
    }
  }

  async syncMoyskladWarehouses(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      const rows = await this.loadAllMoyskladRows(settings, '/entity/store');
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const item of rows) {
        const result = await this.inventoryService.upsertWarehouseFromMoysklad(companyId, item);
        if (result.action === 'created') created++;
        else if (result.action === 'updated') updated++;
        else skipped++;
      }

      const message = `Omborlar sync: ${created} yangi, ${updated} yangilandi, ${skipped} skip`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'WAREHOUSES', 'SUCCESS', message, { created, updated, skipped });

      return { ok: true, message, created, updated, skipped };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'WAREHOUSES', error?.message || 'Omborlar sync xatosi');
    }
  }

  async syncMoyskladStock(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);

      let data: any;
      try {
        data = await this.moyskladFetch(settings, '/report/stock/all?limit=1000&stockByStore=true');
      } catch {
        data = await this.moyskladFetch(settings, '/report/stock/all?limit=1000');
      }

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const result = await this.inventoryService.replaceStockFromMoysklad(companyId, rows);

      const message = `Qoldiq sync: ${result.rows} qator, ${result.totalQuantity} dona`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'STOCK', 'SUCCESS', message, result);

      return { ok: true, message, ...result };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'STOCK', error?.message || 'Qoldiq sync xatosi');
    }
  }

  async syncMoyskladAll(companyId: string) {
    const clients = await this.syncMoyskladClients(companyId);
    const warehouses = await this.syncMoyskladWarehouses(companyId);
    const products = await this.syncMoyskladProducts(companyId);
    const stock = await this.syncMoyskladStock(companyId);

    return {
      ok: Boolean(clients.ok && products.ok && warehouses.ok && stock.ok),
      message: 'Sync all tugadi',
      clients,
      warehouses,
      products,
      stock,
    };
  }

  async testOneC(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      await this.oneCFetch(settings, '/health');
      const message = '1C ulandi';
      await this.pushHistory(companyId, 'ONE_C', 'TEST', 'SUCCESS', message);
      return { ok: true, message };
    } catch (error: any) {
      return this.fail(companyId, 'ONE_C', 'TEST', error?.message || '1C test xatosi');
    }
  }

  async syncOneCClients(companyId: string) {
    return this.fail(companyId, 'ONE_C', 'CLIENTS', '1C endpoint strukturasi kerak.');
  }

  async syncOneCProducts(companyId: string) {
    return this.fail(companyId, 'ONE_C', 'PRODUCTS', '1C endpoint strukturasi kerak.');
  }

  async syncOneCAll(companyId: string) {
    const clients = await this.syncOneCClients(companyId);
    const products = await this.syncOneCProducts(companyId);
    return { ok: false, message: '1C mapping kerak', clients, products };
  }

  private async getRawSettings(companyId: string): Promise<Settings> {
    const rows = await this.prisma.integrationSetting.findMany({
      where: { companyId, provider: SETTINGS_PROVIDER, isActive: true },
    });

    const map = new Map(rows.map((row) => [row.key, row.value || '']));

    return {
      moyskladApiUrl: map.get('moyskladApiUrl') || 'https://api.moysklad.ru/api/remap/1.2',
      moyskladToken: map.get('moyskladToken') || '',
      oneCBaseUrl: map.get('oneCBaseUrl') || '',
      oneCLogin: map.get('oneCLogin') || '',
      oneCPassword: map.get('oneCPassword') || '',
    };
  }

  private async setSetting(companyId: string, key: string, value: string) {
    const existing = await this.prisma.integrationSetting.findFirst({
      where: { companyId, provider: SETTINGS_PROVIDER, key },
    });

    if (existing) {
      return this.prisma.integrationSetting.update({
        where: { id: existing.id },
        data: { value, isActive: true },
      });
    }

    return this.prisma.integrationSetting.create({
      data: { companyId, provider: SETTINGS_PROVIDER, key, value, isActive: true },
    });
  }

  private async loadAllMoyskladRows(settings: Settings, path: string) {
    const limit = 1000;
    let offset = 0;
    const rows: any[] = [];

    while (true) {
      const separator = path.includes('?') ? '&' : '?';
      const data = await this.moyskladFetch(settings, `${path}${separator}limit=${limit}&offset=${offset}`);
      const chunk = Array.isArray(data?.rows) ? data.rows : [];
      rows.push(...chunk);
      if (chunk.length < limit) break;
      offset += limit;
      if (offset > 20000) break;
    }

    return rows;
  }

  private async moyskladFetch(settings: Settings, path: string) {
    if (!settings.moyskladToken) throw new Error('MoySklad API token kiritilmagan');

    const base = (settings.moyskladApiUrl || 'https://api.moysklad.ru/api/remap/1.2').replace(/\/$/, '');
    const token = settings.moyskladToken.trim();

    const response = await fetch(`${base}${path}`, {
      headers: {
        Accept: 'application/json;charset=utf-8',
        'Content-Type': 'application/json;charset=utf-8',
        Authorization: token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`,
      },
    });

    const text = await response.text();
    let data: any = null;

    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }

    if (!response.ok) {
      const msg = typeof data === 'object'
        ? data?.errors?.[0]?.error || data?.message || `MoySklad HTTP ${response.status}`
        : String(data || `MoySklad HTTP ${response.status}`);
      throw new Error(msg);
    }

    return data;
  }

  private async oneCFetch(settings: Settings, path: string) {
    if (!settings.oneCBaseUrl || !settings.oneCLogin) throw new Error('1C URL yoki login kiritilmagan');

    const base = settings.oneCBaseUrl.replace(/\/$/, '');
    const pair = Buffer.from(`${settings.oneCLogin}:${settings.oneCPassword || ''}`).toString('base64');

    const response = await fetch(`${base}${path}`, {
      headers: { Accept: 'application/json', Authorization: `Basic ${pair}` },
    });

    if (!response.ok) throw new Error(`1C HTTP ${response.status}`);
    return response.json();
  }

  private async upsertClientDebtFromMoysklad(clientId: string, item: any, result: SyncDebtResult) {
    const amount = this.pickDebtAmount(item);
    if (!amount || amount <= 0) {
      result.skipped++;
      return;
    }

    const currency = this.pickDebtCurrency(item);
    const comment = `MoySklad qarz sync${item?.id ? ` ID: ${item.id}` : ''}`;

    const existing = await this.prisma.debt.findFirst({
      where: { clientId, currency, comment: { contains: 'MoySklad qarz sync' } },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      await this.prisma.debt.update({
        where: { id: existing.id },
        data: { amount, status: amount > 0 ? 'ACTIVE' : 'CLOSED', comment },
      });
      result.updated++;
      return;
    }

    await this.prisma.debt.create({
      data: { clientId, amount, currency, status: 'ACTIVE', comment },
    });
    result.created++;
  }

  private async trySyncCounterpartyReportDebts(companyId: string, settings: Settings, result: SyncDebtResult) {
    try {
      const data = await this.moyskladFetch(settings, '/report/counterparty?limit=1000');
      const rows = Array.isArray(data?.rows) ? data.rows : [];

      for (const row of rows) {
        const name = String(row?.counterparty?.name || row?.name || '').trim();
        if (!name) continue;

        const client = await this.prisma.client.findFirst({ where: { companyId, fullName: name } });
        if (!client) continue;

        await this.upsertClientDebtFromMoysklad(client.id, row, result);
      }
    } catch {
      // MoySklad аккаунтларида bu report endpoint har xil ishlashi mumkin. Asosiy sync to‘xtamaydi.
    }
  }

  private pickDebtAmount(item: any) {
    const raw =
      item?.balance ??
      item?.debt ??
      item?.debtAmount ??
      item?.receivable ??
      item?.counterpartyBalance ??
      item?.sum ??
      item?.amount ??
      0;

    const n = Number(raw || 0);
    if (!Number.isFinite(n)) return 0;
    const normalized = Math.abs(n) > 1000000 ? n / 100 : n;
    return normalized > 0 ? normalized : 0;
  }

  private pickDebtCurrency(item: any) {
    const raw = String(
      item?.currency?.isoCode ||
      item?.currency?.name ||
      item?.rate?.currency?.isoCode ||
      item?.currency ||
      'UZS',
    ).toUpperCase();

    return raw.includes('USD') || raw.includes('ДОЛ') || raw.includes('$') ? 'USD' : 'UZS';
  }

  private pickPhone(item: any) {
    return String(item?.phone || item?.fax || item?.email || '').trim();
  }

  private mask(value?: string) {
    if (!value) return '';
    if (value.length <= 8) return '********';
    return `${value.slice(0, 4)}********${value.slice(-4)}`;
  }

  private unmask(value: any, previous?: string) {
    if (value === undefined || value === null) return previous || '';
    if (String(value).includes('********')) return previous || '';
    return String(value);
  }

  private unmaskPassword(value: any, previous?: string) {
    if (value === undefined || value === null) return previous || '';
    if (value === '********') return previous || '';
    return String(value);
  }

  private async fail(companyId: string, source: string, type: string, message: string) {
    await this.pushHistory(companyId, source, type, 'FAILED', message);
    return { ok: false, source, type, created: 0, updated: 0, skipped: 0, message };
  }

  private async pushHistory(companyId: string, source: string, type: string, status: string, message: string, extra: any = {}) {
    return this.prisma.integrationLog.create({
      data: {
        companyId,
        provider: source || LOG_PROVIDER,
        action: type,
        status,
        message,
        payload: extra || {},
      },
    });
  }

  private noPhone(companyId: string, seed: string) {
    const safe = String(seed || 'client').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40);
    return `NO_PHONE_${companyId}_${safe}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }
}
