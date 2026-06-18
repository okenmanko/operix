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
const syncRunStore = new Map<string, { running: boolean; action: string; startedAt: string }>();

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

    await this.saveRawSettings(companyId, next);
    await this.pushHistory(companyId, 'SYSTEM', 'SETTINGS', 'SUCCESS', 'Sozlamalar saqlandi');
    return { ok: true };
  }

  async history(companyId: string) {
    const prismaAny = this.prisma as any;
    if (prismaAny.integrationLog?.findMany) {
      return prismaAny.integrationLog.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 80 });
    }
    return historyStore.get(companyId) || [];
  }

  async debugMoyskladCounterparty(companyId: string) {
    const settings = await this.getRawSettings(companyId);
    return this.moyskladFetch(settings, '/entity/counterparty?limit=5');
  }

  async debugMoyskladStock(companyId: string) {
    const settings = await this.getRawSettings(companyId);
    return this.moyskladFetch(settings, '/report/stock/all?limit=5&stockByStore=true&expand=assortment,stockByStore.store');
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
      const rows = await this.moyskladFetchAll(settings, '/entity/counterparty', 200, 400);
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const item of rows) {
        const name = String(item?.name || '').trim();
        const phone = this.pickPhone(item);
        const externalId = this.extractExternalId(item);
        if (!name) {
          skipped++;
          continue;
        }

        const existing = await this.findClient(companyId, { name, phone, externalId });
        const dataClient: any = {
          fullName: name,
          phone: phone || existing?.phone || this.noPhone(companyId, externalId || name),
          normalizedPhone: this.normalizePhone(phone || existing?.phone || ''),
          address: item?.actualAddress || item?.legalAddress || existing?.address || null,
          notes: this.mergeNote(existing?.notes, externalId ? `MoySklad ID: ${externalId}` : ''),
        };

        if (existing) {
          await this.prisma.client.update({ where: { id: existing.id }, data: dataClient });
          updated++;
        } else {
          await this.prisma.client.create({ data: { companyId, ...dataClient, guarantorName: null, guarantorPhone: null } });
          created++;
        }
      }

      const message = `Mijozlar sync: ${created} yangi, ${updated} yangilandi, ${skipped} skip`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'CLIENTS', 'SUCCESS', message, { created, updated, skipped });
      return { ok: true, message, created, updated, skipped };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'CLIENTS', error?.message || 'Mijozlar sync xatosi');
    }
  }

  async syncMoyskladDebts(companyId: string) {
    const message = 'MoySklad qarz sync vaqtincha o‘chirilgan. Qarzlar 1C/Excel import orqali kiritiladi.';
    await this.pushHistory(companyId, 'MOYSKLAD', 'DEBTS', 'SUCCESS', message, { disabled: true });
    return { ok: true, disabled: true, message };
  }

  async syncMoyskladProducts(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      const rows = await this.moyskladFetchAll(settings, '/entity/product?expand=salePrices.priceType,currency,buyPrice.currency', 200, 400);
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const item of rows) {
        const result = await this.inventoryService.upsertProductFromMoysklad(companyId, item);
        if (result.action === 'created') created++;
        else if (result.action === 'updated') updated++;
        else skipped++;
      }

      const message = `Tovarlar sync: ${created} yangi, ${updated} yangilandi, ${skipped} skip. MS rows: ${rows.length}`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'PRODUCTS', 'SUCCESS', message, { created, updated, skipped, moyskladRows: rows.length });
      return { ok: true, message, created, updated, skipped, moyskladRows: rows.length };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'PRODUCTS', error?.message || 'Tovarlar sync xatosi');
    }
  }

  async syncMoyskladWarehouses(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      const rows = await this.moyskladFetchAll(settings, '/entity/store', 100, 100);
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
      let rows: any[] = [];
      let mode = 'stock-all-by-store-expanded';

      const attempts = [
        '/report/stock/all?stockByStore=true&expand=assortment,stockByStore.store',
        '/report/stock/all?stockByStore=true&expand=assortment',
        '/report/stock/all?stockByStore=true',
        '/report/stock/all',
      ];

      let lastError = '';
      for (const path of attempts) {
        try {
          rows = await this.moyskladFetchAll(settings, path, 1000, 100);
          mode = path;
          if (rows.length) break;
        } catch (error: any) {
          lastError = error?.message || String(error);
        }
      }

      if (!rows.length && lastError) throw new Error(lastError);

      const result = await this.inventoryService.replaceStockFromMoysklad(companyId, rows);
      const message = `Qoldiq sync: ${result.rows} qator, ${result.products} tovar, ${result.warehouses} ombor, ${result.totalQuantity} dona. MS rows: ${rows.length}`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'STOCK', 'SUCCESS', message, { ...result, mode, moyskladRows: rows.length });
      return { ok: true, message, ...result, mode, moyskladRows: rows.length };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'STOCK', error?.message || 'Qoldiq sync xatosi');
    }
  }

  async syncMoyskladAll(companyId: string) {
    const runKey = `${companyId}:MOYSKLAD:ALL`;
    const current = syncRunStore.get(runKey);
    if (current?.running) {
      await this.pushHistory(companyId, 'MOYSKLAD', 'ALL', 'RUNNING', `Sync all allaqachon ishlayapti: ${current.startedAt}`);
      return { ok: true, running: true, message: 'Sync all allaqachon ishlayapti. Historyni yangilang.' };
    }

    syncRunStore.set(runKey, { running: true, action: 'ALL', startedAt: new Date().toISOString() });
    await this.pushHistory(companyId, 'MOYSKLAD', 'ALL', 'RUNNING', 'Sync all boshlandi: mijozlar → omborlar → tovarlar → qoldiq. Qarzlar Excel/1C orqali.');

    try {
      const clients = await this.syncMoyskladClients(companyId);
      const warehouses = await this.syncMoyskladWarehouses(companyId);
      const products = await this.syncMoyskladProducts(companyId);
      const stock = await this.syncMoyskladStock(companyId);
      const debts = await this.syncMoyskladDebts(companyId);

      const ok = Boolean(clients.ok && warehouses.ok && products.ok && stock.ok);
      const message = ok
        ? 'Sync all tugadi. MoySklad tovar/ombor/qoldiq yangilandi. Qarzlar Excel/1C import orqali kiritiladi.'
        : 'Sync all tugadi, lekin ayrim bo‘limlarda xato bor. Historyni ko‘r.';

      await this.pushHistory(companyId, 'MOYSKLAD', 'ALL', ok ? 'SUCCESS' : 'ERROR', message, { clients, debts, warehouses, products, stock });
      return { ok, message, clients, debts, warehouses, products, stock };
    } catch (error: any) {
      const message = error?.message || 'Sync all xatosi';
      await this.pushHistory(companyId, 'MOYSKLAD', 'ALL', 'ERROR', message);
      return { ok: false, message };
    } finally {
      syncRunStore.delete(runKey);
    }
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

  async syncOneCClients(companyId: string) { return this.fail(companyId, 'ONE_C', 'CLIENTS', '1C endpoint strukturasi kerak. Hozir qarzlar Excel import orqali ishlaydi.'); }
  async syncOneCProducts(companyId: string) { return this.fail(companyId, 'ONE_C', 'PRODUCTS', '1C endpoint strukturasi kerak.'); }
  async syncOneCAll(companyId: string) {
    const clients = await this.syncOneCClients(companyId);
    const products = await this.syncOneCProducts(companyId);
    return { ok: false, message: '1C mapping kerak. Hozir Excel import ishlat.', clients, products };
  }

  private async withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); }),
      ]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async getRawSettings(companyId: string): Promise<Settings> {
    const cached = settingsStore.get(companyId);
    if (cached) return cached;

    const defaults: Settings = { moyskladApiUrl: 'https://api.moysklad.ru/api/remap/1.2', moyskladToken: '', oneCBaseUrl: '', oneCLogin: '', oneCPassword: '' };
    const prismaAny = this.prisma as any;
    if (!prismaAny.integrationSetting?.findMany) return defaults;

    const rows = await prismaAny.integrationSetting.findMany({ where: { companyId, provider: 'OPERIX' } });
    const settings = { ...defaults } as any;
    for (const row of rows) settings[row.key] = row.value || '';
    settingsStore.set(companyId, settings);
    return settings;
  }

  private async saveRawSettings(companyId: string, settings: Settings) {
    settingsStore.set(companyId, settings);
    const prismaAny = this.prisma as any;
    if (!prismaAny.integrationSetting?.upsert) return;

    for (const [key, value] of Object.entries(settings)) {
      const existing = await prismaAny.integrationSetting.findFirst({ where: { companyId, provider: 'OPERIX', key } });
      if (existing) await prismaAny.integrationSetting.update({ where: { id: existing.id }, data: { value: String(value || '') } });
      else await prismaAny.integrationSetting.create({ data: { companyId, provider: 'OPERIX', key, value: String(value || '') } });
    }
  }

  private async moyskladFetchAll(settings: Settings, path: string, limit = 200, maxPages = 300) {
    const rows: any[] = [];
    let offset = 0;
    for (let i = 0; i < maxPages; i++) {
      const sep = path.includes('?') ? '&' : '?';
      const data = await this.moyskladFetch(settings, `${path}${sep}limit=${limit}&offset=${offset}`);
      const part = Array.isArray(data?.rows) ? data.rows : [];
      rows.push(...part);
      if (part.length < limit) break;
      offset += limit;
    }
    return rows;
  }

  private async moyskladFetch(settings: Settings, path: string) {
    if (!settings.moyskladToken) throw new Error('MoySklad API token kiritilmagan');
    const base = (settings.moyskladApiUrl || 'https://api.moysklad.ru/api/remap/1.2').replace(/\/$/, '');
    const token = settings.moyskladToken.trim();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);

    let response: Response;
    try {
      response = await fetch(`${base}${path}`, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json;charset=utf-8',
          'Content-Type': 'application/json;charset=utf-8',
          Authorization: token.toLowerCase().startsWith('bearer ') ? token : `Bearer ${token}`,
        },
      });
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new Error(`MoySklad javob bermadi: ${path}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let data: any = null;
    if (text) { try { data = JSON.parse(text); } catch { data = text; } }
    if (!response.ok) {
      const msg = typeof data === 'object' ? data?.errors?.[0]?.error || data?.message || `MoySklad HTTP ${response.status}` : data || `MoySklad HTTP ${response.status}`;
      throw new Error(msg);
    }
    return data;
  }

  private async oneCFetch(settings: Settings, path: string) {
    if (!settings.oneCBaseUrl) throw new Error('1C URL kiritilmagan');
    const base = settings.oneCBaseUrl.replace(/\/$/, '');
    const response = await fetch(`${base}${path}`, { headers: { Authorization: settings.oneCLogin || settings.oneCPassword ? `Basic ${Buffer.from(`${settings.oneCLogin || ''}:${settings.oneCPassword || ''}`).toString('base64')}` : '' } });
    if (!response.ok) throw new Error(`1C HTTP ${response.status}`);
    return response.json().catch(() => ({}));
  }

  private async findClient(companyId: string, params: { name: string; phone?: string; externalId?: string | null }) {
    const normalizedPhone = this.normalizePhone(params.phone || '');
    if (params.externalId) {
      const byNote = await this.prisma.client.findFirst({ where: { companyId, notes: { contains: `MoySklad ID: ${params.externalId}` } } });
      if (byNote) return byNote;
    }
    if (normalizedPhone) {
      const byPhone = await this.prisma.client.findFirst({ where: { companyId, normalizedPhone } });
      if (byPhone) return byPhone;
    }
    return this.prisma.client.findFirst({ where: { companyId, fullName: params.name } });
  }

  private pickPhone(item: any) {
    const raw = item?.phone || item?.phones?.[0]?.phone || item?.legalAddressFull?.phone || item?.actualAddressFull?.phone || '';
    return this.normalizePhone(raw) || '';
  }

  private normalizePhone(value: any) {
    const digits = String(value || '').replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length === 9) return `998${digits}`;
    return digits;
  }

  private noPhone(companyId: string, key: string) {
    return `no-phone-${companyId.slice(0, 6)}-${String(key).replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || Date.now()}`;
  }

  private extractExternalId(item: any) {
    const href = String(item?.meta?.href || item?.href || '').trim();
    const fromHref = href ? href.split('/').pop()?.split('?')[0] : '';
    return String(item?.id || fromHref || '').trim() || null;
  }

  private mergeNote(oldNote?: string | null, next?: string) {
    const clean = String(next || '').trim();
    if (!clean) return oldNote || null;
    if (String(oldNote || '').includes(clean)) return oldNote || null;
    return [oldNote, clean].filter(Boolean).join('\n');
  }

  private mask(value: string) {
    if (!value) return '';
    if (value.length <= 8) return '********';
    return `${value.slice(0, 4)}********${value.slice(-4)}`;
  }

  private unmask(value: string | undefined, oldValue?: string) {
    if (value === undefined || value === null || value === '') return oldValue || '';
    if (String(value).includes('********')) return oldValue || '';
    return String(value).trim();
  }

  private unmaskPassword(value: string | undefined, oldValue?: string) {
    if (value === undefined || value === null || value === '') return oldValue || '';
    if (String(value) === '********') return oldValue || '';
    return String(value);
  }

  private async pushHistory(companyId: string, provider: string, action: string, status: string, message: string, payload?: any) {
    const item = { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, provider, action, source: provider, type: action, status, message, payload, createdAt: new Date().toISOString() };
    const current = historyStore.get(companyId) || [];
    historyStore.set(companyId, [item, ...current].slice(0, 80));

    const prismaAny = this.prisma as any;
    if (prismaAny.integrationLog?.create) {
      await prismaAny.integrationLog.create({ data: { companyId, provider, action, status, message, payload: payload || {} } }).catch(() => null);
    }
  }

  private async fail(companyId: string, provider: string, action: string, message: string) {
    await this.pushHistory(companyId, provider, action, 'ERROR', message);
    return { ok: false, message };
  }
}
