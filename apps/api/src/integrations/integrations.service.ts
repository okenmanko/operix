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

const settingsStore = new Map<string, Settings>();
const historyStore = new Map<string, any[]>();

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

  async getSettings(companyId: string) {
    const settings = this.getRawSettings(companyId);

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
    const current = this.getRawSettings(companyId);

    const next: Settings = {
      moyskladApiUrl: body.moyskladApiUrl || current.moyskladApiUrl || 'https://api.moysklad.ru/api/remap/1.2',
      moyskladToken: this.unmask(body.moyskladToken, current.moyskladToken),
      oneCBaseUrl: body.oneCBaseUrl ?? current.oneCBaseUrl ?? '',
      oneCLogin: body.oneCLogin ?? current.oneCLogin ?? '',
      oneCPassword: this.unmaskPassword(body.oneCPassword, current.oneCPassword),
    };

    settingsStore.set(companyId, next);
    this.pushHistory(companyId, 'SYSTEM', 'SETTINGS', 'SUCCESS', 'Sozlamalar saqlandi');

    return { ok: true };
  }

  async history(companyId: string) {
    return historyStore.get(companyId) || [];
  }

  async testMoysklad(companyId: string) {
    try {
      const settings = this.getRawSettings(companyId);
      const data = await this.moyskladFetch(settings, '/entity/organization?limit=1');
      const orgName = data?.rows?.[0]?.name || 'MoySklad';

      const message = `MoySklad ulandi: ${orgName}`;
      this.pushHistory(companyId, 'MOYSKLAD', 'TEST', 'SUCCESS', message);

      return { ok: true, message };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'TEST', error?.message || 'MoySklad test xatosi');
    }
  }

  async syncMoyskladClients(companyId: string) {
    try {
      const settings = this.getRawSettings(companyId);
      const data = await this.moyskladFetch(settings, '/entity/counterparty?limit=1000');

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      let created = 0;
      let updated = 0;
      let skipped = 0;

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

        if (existing) {
          await this.prisma.client.update({
            where: { id: existing.id },
            data: {
              fullName: name,
              phone: phone || existing.phone,
              address: item?.actualAddress || item?.legalAddress || existing.address,
            },
          });
          updated++;
        } else {
          await this.prisma.client.create({
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
      }

      const message = `Mijozlar sync: ${created} yangi, ${updated} yangilandi, ${skipped} skip`;
      this.pushHistory(companyId, 'MOYSKLAD', 'CLIENTS', 'SUCCESS', message, { created, updated, skipped });

      return { ok: true, message, created, updated, skipped };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'CLIENTS', error?.message || 'Mijozlar sync xatosi');
    }
  }

  async syncMoyskladProducts(companyId: string) {
    try {
      const settings = this.getRawSettings(companyId);
      const data = await this.moyskladFetch(settings, '/entity/product?limit=1000');

      const rows = Array.isArray(data?.rows) ? data.rows : [];
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
      this.pushHistory(companyId, 'MOYSKLAD', 'PRODUCTS', 'SUCCESS', message, { created, updated, skipped });

      return { ok: true, message, created, updated, skipped };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'PRODUCTS', error?.message || 'Productlar sync xatosi');
    }
  }

  async syncMoyskladWarehouses(companyId: string) {
    try {
      const settings = this.getRawSettings(companyId);
      const data = await this.moyskladFetch(settings, '/entity/store?limit=1000');

      const rows = Array.isArray(data?.rows) ? data.rows : [];
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
      this.pushHistory(companyId, 'MOYSKLAD', 'WAREHOUSES', 'SUCCESS', message, { created, updated, skipped });

      return { ok: true, message, created, updated, skipped };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'WAREHOUSES', error?.message || 'Omborlar sync xatosi');
    }
  }

  async syncMoyskladStock(companyId: string) {
    try {
      const settings = this.getRawSettings(companyId);

      let data: any;
      try {
        data = await this.moyskladFetch(settings, '/report/stock/all?limit=1000&stockByStore=true');
      } catch {
        data = await this.moyskladFetch(settings, '/report/stock/all?limit=1000');
      }

      const rows = Array.isArray(data?.rows) ? data.rows : [];
      const result = await this.inventoryService.replaceStockFromMoysklad(companyId, rows);

      const message = `Qoldiq sync: ${result.rows} qator, ${result.totalQuantity} dona`;
      this.pushHistory(companyId, 'MOYSKLAD', 'STOCK', 'SUCCESS', message, result);

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
      const settings = this.getRawSettings(companyId);
      await this.oneCFetch(settings, '/health');
      const message = '1C ulandi';
      this.pushHistory(companyId, 'ONE_C', 'TEST', 'SUCCESS', message);
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

  private getRawSettings(companyId: string): Settings {
    return settingsStore.get(companyId) || {
      moyskladApiUrl: 'https://api.moysklad.ru/api/remap/1.2',
      moyskladToken: '',
      oneCBaseUrl: '',
      oneCLogin: '',
      oneCPassword: '',
    };
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

  private fail(companyId: string, source: string, type: string, message: string) {
    this.pushHistory(companyId, source, type, 'FAILED', message);
    return { ok: false, source, type, created: 0, updated: 0, skipped: 0, message };
  }

  private pushHistory(companyId: string, source: string, type: string, status: string, message: string, extra: any = {}) {
    const list = historyStore.get(companyId) || [];
    list.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      source,
      type,
      status,
      message,
      ...extra,
    });
    historyStore.set(companyId, list.slice(0, 50));
  }

  private noPhone(companyId: string, seed: string) {
    const safe = String(seed || 'client').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40);
    return `NO_PHONE_${companyId}_${safe}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  }
}
