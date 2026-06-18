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
      return prismaAny.integrationLog.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' }, take: 50 });
    }
    return historyStore.get(companyId) || [];
  }

    async debugMoyskladCounterparty(companyId: string) {
    const settings = await this.getRawSettings(companyId);
    return this.moyskladFetch(
      settings,
      '/report/counterparty?limit=5&expand=counterparty',
    );
  }

  async debugMoyskladStock(companyId: string) {
    const settings = await this.getRawSettings(companyId);
    return this.moyskladFetch(
      settings,
      '/report/stock/all?limit=3&stockByStore=true',
    );
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
      const data = await this.moyskladFetchAll(settings, '/entity/counterparty', 200, 300);
      const rows = Array.isArray(data) ? data : [];
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
    try {
      const settings = await this.getRawSettings(companyId);

      // 1) Barcha kontragentlarni entity/counterparty orqali olamiz.
      // 2) Qarz report/counterparty orqali kelgan bo'lsa, shu bilan birlashtiramiz.
      // 3) Agar reportda valyuta bo'yicha ma'lumot to'liq kelmasa, counterparty ichidagi balance/attributesdan ham olamiz.
      const [counterparties, reportRows] = await Promise.all([
        this.withTimeout(
          this.moyskladFetchAll(settings, '/entity/counterparty', 200, 300),
          120_000,
          'MoySklad kontragentlar 120 sekunddan oshib ketdi.',
        ),
        this.withTimeout(
          this.loadMoyskladCounterpartyReport(settings).catch(() => []),
          120_000,
          'MoySklad qarzdorlik report 120 sekunddan oshib ketdi.',
        ),
      ]);

      const reportMap = new Map<string, any[]>();
      for (const row of reportRows as any[]) {
        const agent = row?.counterparty || row?.agent || row?.customer || row?.organization || row;
        const extId = this.extractExternalId(agent || row);
        const name = String(agent?.name || row?.name || row?.counterpartyName || '').trim();
        for (const key of [extId, name].filter(Boolean)) {
          const k = String(key);
          reportMap.set(k, [...(reportMap.get(k) || []), row]);
        }
      }

      let created = 0;
      let createdClients = 0;
      let updatedClients = 0;
      let skippedNoName = 0;
      let skippedNoDebt = 0;
      let totalUZS = 0;
      let totalUSD = 0;

      await this.prisma.debt.deleteMany({
        where: {
          client: { companyId },
          comment: { contains: 'MOYSKLAD_BALANCE' },
        },
      });

      for (const cp of counterparties as any[]) {
        const name = String(cp?.name || '').trim();
        const externalId = this.extractExternalId(cp);
        const phone = this.pickPhone(cp);

        if (!name) {
          skippedNoName++;
          continue;
        }

        const reports = [
          ...(externalId ? reportMap.get(externalId) || [] : []),
          ...(reportMap.get(name) || []),
        ];

        const balances = this.mergeDebtBalances([
          ...reports.flatMap((row: any) => this.extractReportBalances(row)),
          ...this.extractReportBalances(cp),
        ]);

        if (!balances.length) {
          skippedNoDebt++;
          continue;
        }

        let client = await this.findClient(companyId, { name, phone, externalId });

        if (!client) {
          client = await this.prisma.client.create({
            data: {
              companyId,
              fullName: name,
              phone: phone || this.noPhone(companyId, externalId || name),
              normalizedPhone: this.normalizePhone(phone),
              address: cp?.actualAddress || cp?.legalAddress || null,
              notes: externalId ? `MoySklad ID: ${externalId}` : null,
              guarantorName: null,
              guarantorPhone: null,
            },
          });
          createdClients++;
        } else {
          client = await this.prisma.client.update({
            where: { id: client.id },
            data: {
              fullName: name,
              phone: phone || client.phone,
              normalizedPhone: this.normalizePhone(phone || client.phone),
              address: cp?.actualAddress || cp?.legalAddress || client.address,
              notes: this.mergeNote(client.notes, externalId ? `MoySklad ID: ${externalId}` : ''),
            },
          });
          updatedClients++;
        }

        for (const balance of balances) {
          const amount = Math.abs(Number(balance.amount || 0));
          if (!Number.isFinite(amount) || amount <= 0) continue;

          const currency = this.normalizeCurrency(balance.currency);

          await this.prisma.debt.create({
            data: {
              clientId: client.id,
              amount,
              currency,
              status: 'ACTIVE',
              comment: `MOYSKLAD_BALANCE:${externalId || name}:${currency}:SIGN_${balance.sign || 'UNKNOWN'}`,
            },
          });

          created++;
          if (currency === 'USD') totalUSD += amount;
          else totalUZS += amount;
        }
      }

      const message =
        `Qarzlar sync: ${created} ta qarz. ` +
        `Qarzdor kontragent: ${createdClients + updatedClients}. ` +
        `UZS: ${this.round2(totalUZS).toLocaleString('ru-RU')}. ` +
        `USD: ${this.round2(totalUSD).toLocaleString('ru-RU')}. ` +
        `MS kontragent: ${(counterparties as any[]).length}. Report: ${(reportRows as any[]).length}. Skip debt: ${skippedNoDebt}`;

      await this.pushHistory(companyId, 'MOYSKLAD', 'DEBTS', 'SUCCESS', message, {
        created,
        createdClients,
        updatedClients,
        skippedNoName,
        skippedNoDebt,
        counterparties: (counterparties as any[]).length,
        reportRows: (reportRows as any[]).length,
        totalUZS: this.round2(totalUZS),
        totalUSD: this.round2(totalUSD),
      });

      return {
        ok: true,
        message,
        created,
        createdClients,
        updatedClients,
        skippedNoName,
        skippedNoDebt,
        counterparties: (counterparties as any[]).length,
        reportRows: (reportRows as any[]).length,
        totalUZS: this.round2(totalUZS),
        totalUSD: this.round2(totalUSD),
      };
    } catch (error: any) {
      return this.fail(companyId, 'MOYSKLAD', 'DEBTS', error?.message || 'Qarzlar sync xatosi');
    }
  }

  async syncMoyskladProducts(companyId: string) {
    try {
      const settings = await this.getRawSettings(companyId);
      const rows = await this.moyskladFetchAll(settings, '/entity/product', 200, 300);
      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const item of rows) {
        const result = await this.inventoryService.upsertProductFromMoysklad(companyId, item);
        if (result.action === 'created') created++;
        else if (result.action === 'updated') updated++;
        else skipped++;
      }

      const message = `Tovarlar sync: ${created} yangi, ${updated} yangilandi, ${skipped} skip`;
      await this.pushHistory(companyId, 'MOYSKLAD', 'PRODUCTS', 'SUCCESS', message, { created, updated, skipped });
      return { ok: true, message, created, updated, skipped };
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

      // Muhim: oldingi kod faqat 200 qator olardi. Endi barcha sahifalarni olamiz.
      let rows: any[] = [];
      let mode = 'stock-all-by-store';

      try {
        rows = await this.moyskladFetchAll(settings, '/report/stock/all?stockByStore=true', 1000, 100);
      } catch (error: any) {
        mode = 'stock-all';
        rows = await this.moyskladFetchAll(settings, '/report/stock/all', 1000, 100);
      }

      const result = await this.inventoryService.replaceStockFromMoysklad(companyId, rows);
      const message = `Qoldiq sync: ${result.rows} qator, ${result.totalQuantity} dona. Mode: ${mode}. MS rows: ${rows.length}`;
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
    await this.pushHistory(companyId, 'MOYSKLAD', 'ALL', 'RUNNING', 'Sync all boshlandi: mijozlar → qarzlar → omborlar → tovarlar → qoldiq');

    try {
      const clients = await this.syncMoyskladClients(companyId);
      const debts = await this.syncMoyskladDebts(companyId);
      const warehouses = await this.syncMoyskladWarehouses(companyId);
      const products = await this.syncMoyskladProducts(companyId);
      const stock = await this.syncMoyskladStock(companyId);

      const ok = Boolean(clients.ok && debts.ok && warehouses.ok && products.ok && stock.ok);
      const message = ok
        ? 'Sync all tugadi. Dashboard/Mijozlar/Qarzlar/Tovarlar/Omborlar yangilandi.'
        : 'Sync all tugadi, lekin ayrim bo‘limlarda xato bor. Historyni ko‘r.';

      await this.pushHistory(companyId, 'MOYSKLAD', 'ALL', ok ? 'SUCCESS' : 'ERROR', message, {
        clients,
        debts,
        warehouses,
        products,
        stock,
      });

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

  async syncOneCClients(companyId: string) { return this.fail(companyId, 'ONE_C', 'CLIENTS', '1C endpoint strukturasi kerak.'); }
  async syncOneCProducts(companyId: string) { return this.fail(companyId, 'ONE_C', 'PRODUCTS', '1C endpoint strukturasi kerak.'); }
  async syncOneCAll(companyId: string) {
    const clients = await this.syncOneCClients(companyId);
    const products = await this.syncOneCProducts(companyId);
    return { ok: false, message: '1C mapping kerak', clients, products };
  }


  private async withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    let timer: NodeJS.Timeout | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => reject(new Error(message)), ms);
        }),
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

  private async loadMoyskladCounterpartyReport(settings: Settings) {
    const rows: any[] = [];

    // Asosiy to'g'ri endpoint: report/counterparty.
    // expand=counterparty qo'shiladi, shunda nom/id keladi.
    const attempts = [
      '/report/counterparty?expand=counterparty',
      '/report/counterparty',
    ];

    let lastError = '';

    for (const path of attempts) {
      try {
        const part = await this.moyskladFetchAll(settings, path, 200, 300);
        if (part.length) rows.push(...part);
        if (rows.length) break;
      } catch (error: any) {
        lastError = error?.message || String(error);
      }
    }

    if (!rows.length) {
      throw new Error(lastError || 'MoySklad report/counterparty bo\'sh qaytdi');
    }

    // Faqat dublikatlarni tozalaymiz. 400+ qarzdor bo'lsa ham hammasi qoladi.
    const seen = new Set<string>();
    const unique: any[] = [];

    for (const row of rows) {
      const agent = row?.counterparty || row?.agent || row;
      const id = this.extractExternalId(agent) || String(agent?.name || row?.name || Math.random());
      const rawBalance = row?.balance ?? row?.debt ?? row?.accountBalance ?? row?.sum ?? row?.saldo ?? row?.remainder ?? '';
      const key = `${id}:${rawBalance}:${this.normalizeCurrency(row?.currency?.name || row?.currency?.isoCode || row?.currency?.code || row?.currency || '')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(row);
    }

    return unique;
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
    const timer = setTimeout(() => controller.abort(), 45_000);

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
      if (error?.name === 'AbortError') {
        throw new Error(`MoySklad javob bermadi: ${path}`);
      }
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

  private extractReportBalances(row: any) {
    const result: { amount: number; currency: string; sign: string }[] = [];

    const baseCurrency = this.normalizeCurrency(
      row?.currency?.isoCode ||
      row?.currency?.code ||
      row?.currency?.name ||
      row?.accountCurrency?.isoCode ||
      row?.accountCurrency?.name ||
      'UZS',
    );

    // MoySklad pul qiymatlari ko'p hollarda tiyin/kopeyka formatida keladi: 351994562 => 3 519 945.62
    const directFields = ['balance', 'debt', 'accountBalance', 'sum', 'saldo', 'remainder'];
    for (const field of directFields) {
      if (row?.[field] === undefined || row?.[field] === null) continue;
      const raw = this.extractMoneyAmount(row[field]);
      if (!Number.isFinite(raw) || raw === 0) continue;
      const currency = this.extractMoneyCurrency(row[field], baseCurrency);
      result.push({ amount: this.fromMoyskladMinorMoney(raw, currency), currency, sign: raw > 0 ? 'PLUS' : 'MINUS' });
      break;
    }

    // Ba'zi accountlarda qarzlar valyuta bo'yicha array bo'lib keladi.
    const arrays = [row?.balances, row?.balanceByCurrency, row?.balancesByCurrency, row?.currencyBalances].filter(Array.isArray);
    for (const arr of arrays) {
      for (const item of arr) {
        const moneyValue = item?.balance ?? item?.amount ?? item?.sum ?? item?.debt ?? item?.value ?? item;
        const raw = this.extractMoneyAmount(moneyValue);
        if (!Number.isFinite(raw) || raw === 0) continue;
        const currency = this.extractMoneyCurrency(moneyValue, item?.currency || baseCurrency);
        result.push({ amount: this.fromMoyskladMinorMoney(raw, currency), currency, sign: raw > 0 ? 'PLUS' : 'MINUS' });
      }
    }

    // Custom attribute bilan USD qarz saqlangan bo'lsa ham ushlaydi.
    const attrs = Array.isArray(row?.attributes) ? row.attributes : [];
    for (const attr of attrs) {
      const name = String(attr?.name || '').toLowerCase();
      if (!name.includes('qarz') && !name.includes('долг') && !name.includes('debt') && !name.includes('balance')) continue;
      const raw = Number(attr?.value || 0);
      if (!Number.isFinite(raw) || raw === 0) continue;
      const currency = this.normalizeCurrency(name.includes('usd') || name.includes('$') || name.includes('дол') ? 'USD' : baseCurrency);
      result.push({ amount: Math.abs(raw), currency, sign: raw > 0 ? 'PLUS' : 'MINUS' });
    }

    const merged = new Map<string, { amount: number; sign: string }>();
    for (const item of result) {
      const prev = merged.get(item.currency) || { amount: 0, sign: item.sign };
      prev.amount += Math.abs(item.amount);
      if (item.sign === 'MINUS') prev.sign = 'MINUS';
      merged.set(item.currency, prev);
    }

    return [...merged.entries()]
      .map(([currency, data]) => ({ currency, amount: data.amount, sign: data.sign }))
      .filter((x) => x.amount > 0);
  }

  private extractBalances(item: any, report?: any) {
    const candidates = [report, item].filter(Boolean);
    const result: { amount: number; currency: string }[] = [];
    for (const obj of candidates) {
      const currency = this.normalizeCurrency(obj?.currency?.name || obj?.currency?.code || obj?.currency || obj?.accountCurrency || 'UZS');
      const raw = obj?.balance ?? obj?.accountBalance ?? obj?.debt ?? obj?.sum ?? obj?.saldo ?? obj?.remainder;
      const n = Number(raw || 0);
      if (Number.isFinite(n) && n !== 0) result.push({ amount: n, currency });

      const attrs = Array.isArray(obj?.attributes) ? obj.attributes : [];
      for (const attr of attrs) {
        const name = String(attr?.name || '').toLowerCase();
        if (!name.includes('qarz') && !name.includes('долг') && !name.includes('debt') && !name.includes('balance')) continue;
        const value = Number(attr?.value || 0);
        if (!Number.isFinite(value) || value === 0) continue;
        result.push({ amount: value, currency: this.normalizeCurrency(name.includes('usd') || name.includes('$') ? 'USD' : currency) });
      }
    }

    const merged = new Map<string, number>();
    for (const row of result) merged.set(row.currency, (merged.get(row.currency) || 0) + row.amount);
    return [...merged.entries()].map(([currency, amount]) => ({ currency, amount }));
  }

  private mergeDebtBalances(items: { amount: number; currency: string; sign?: string }[]) {
    const map = new Map<string, { amount: number; currency: string; sign: string }>();

    for (const item of items || []) {
      const currency = this.normalizeCurrency(item.currency);
      const amount = this.round2(Math.abs(Number(item.amount || 0)));
      if (!Number.isFinite(amount) || amount <= 0) continue;

      const old = map.get(currency) || { amount: 0, currency, sign: item.sign || 'UNKNOWN' };
      old.amount = this.round2(old.amount + amount);
      if (item.sign === 'MINUS') old.sign = 'MINUS';
      map.set(currency, old);
    }

    return [...map.values()].filter((x) => x.amount > 0);
  }

  private round2(value: number) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private extractMoneyAmount(value: any): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return this.parseLooseNumber(value);
    if (typeof value === 'object') {
      const raw =
        value.amount ??
        value.value ??
        value.balance ??
        value.sum ??
        value.debt ??
        value.remainder ??
        value.accountBalance ??
        0;
      return this.extractMoneyAmount(raw);
    }
    return 0;
  }

  private extractMoneyCurrency(value: any, fallback = 'UZS'): string {
    if (value && typeof value === 'object') {
      return this.normalizeCurrency(
        value?.currency?.isoCode ||
        value?.currency?.code ||
        value?.currency?.name ||
        value?.currency ||
        value?.accountCurrency?.isoCode ||
        value?.accountCurrency?.code ||
        value?.accountCurrency?.name ||
        fallback,
      );
    }
    return this.normalizeCurrency(fallback);
  }

  private parseLooseNumber(value: any): number {
    const raw = String(value || '').trim();
    if (!raw) return 0;
    const clean = raw
      .replace(/\s/g, '')
      .replace(/,/g, '.')
      .replace(/[^0-9.\-]/g, '');
    const normalized = clean.includes('.')
      ? clean.replace(/\.(?=.*\.)/g, '')
      : clean;
    const n = Number(normalized);
    return Number.isFinite(n) ? n : 0;
  }

  private fromMoyskladMinorMoney(value: any, currency = 'UZS') {
    const n = Math.abs(this.extractMoneyAmount(value));
    if (!Number.isFinite(n)) return 0;

    const cur = this.normalizeCurrency(currency);

    // Digi World qoidasiga mos:
    // USD'da 45.000 / 45 000 ko'rinsa bu 45$ degani. Ortiqcha 000 lar kesiladi.
    if (cur === 'USD') {
      if (n >= 1000 && Number.isInteger(n) && n % 1000 === 0) return n / 1000;
      if (n >= 100000 && Number.isInteger(n) && n % 100 === 0) return n / 100;
      return n;
    }

    // UZS'da 45 000 000 haqiqiy so'm. Faqat juda katta minor-unit qiymatlar /100 qilinadi.
    if (n >= 10000000000 && Number.isInteger(n) && n % 100 === 0) return n / 100;
    return n;
  }

  private normalizeMoyskladMoney(value: any) {
    const n = Number(value || 0);
    if (!Number.isFinite(n)) return 0;
    return Math.abs(n) >= 100000 ? n / 100 : n;
  }

  private normalizeCurrency(value: any) {
    const raw = String(value || 'UZS').trim().toUpperCase();
    return raw.includes('USD') || raw.includes('$') || raw.includes('ДОЛ') ? 'USD' : 'UZS';
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
    const item = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      provider,
      action,
      source: provider,
      type: action,
      status,
      message,
      payload,
      createdAt: new Date().toISOString(),
    };
    const current = historyStore.get(companyId) || [];
    historyStore.set(companyId, [item, ...current].slice(0, 50));

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
