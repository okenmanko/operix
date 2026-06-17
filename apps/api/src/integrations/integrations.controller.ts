import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('settings')
  settings(@CurrentUser() user: AuthUser) {
    return this.integrationsService.getSettings(user.companyId);
  }

  @Post('settings')
  saveSettings(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.integrationsService.saveSettings(user.companyId, body);
  }

  @Get('history')
  history(@CurrentUser() user: AuthUser) {
    return this.integrationsService.history(user.companyId);
  }

  @Post('moysklad/test')
  testMoysklad(@CurrentUser() user: AuthUser) {
    return this.integrationsService.testMoysklad(user.companyId);
  }

  @Post('moysklad/sync-clients')
  syncMoyskladClients(@CurrentUser() user: AuthUser) {
    this.integrationsService.syncMoyskladClients(user.companyId).catch(() => null);
    return { ok: true, message: 'Mijozlar sync boshlandi. Natijani Historydan ko‘rasiz.' };
  }

  @Post('moysklad/sync-debts')
  syncMoyskladDebts(@CurrentUser() user: AuthUser) {
    this.integrationsService.syncMoyskladDebts(user.companyId).catch(() => null);
    return { ok: true, message: 'Qarzlar sync boshlandi. 400+ kontragent bo‘lsa ham backgroundda ishlaydi.' };
  }

  @Post('moysklad/sync-products')
  syncMoyskladProducts(@CurrentUser() user: AuthUser) {
    this.integrationsService.syncMoyskladProducts(user.companyId).catch(() => null);
    return { ok: true, message: 'Tovarlar sync boshlandi. Natijani Historydan ko‘rasiz.' };
  }

  @Post('moysklad/sync-warehouses')
  syncMoyskladWarehouses(@CurrentUser() user: AuthUser) {
    this.integrationsService.syncMoyskladWarehouses(user.companyId).catch(() => null);
    return { ok: true, message: 'Omborlar sync boshlandi. Natijani Historydan ko‘rasiz.' };
  }

  @Post('moysklad/sync-stock')
  syncMoyskladStock(@CurrentUser() user: AuthUser) {
    this.integrationsService.syncMoyskladStock(user.companyId).catch(() => null);
    return { ok: true, message: 'Qoldiq sync boshlandi. Natijani Historydan ko‘rasiz.' };
  }

  @Post('moysklad/sync-all')
  syncMoyskladAll(@CurrentUser() user: AuthUser) {
    this.integrationsService.syncMoyskladAll(user.companyId).catch(() => null);
    return { ok: true, message: 'Sync all boshlandi. Sahifa osilmaydi. Natijani Historydan ko‘rasiz.' };
  }

  @Post('onec/test')
  testOneC(@CurrentUser() user: AuthUser) {
    return this.integrationsService.testOneC(user.companyId);
  }

  @Post('onec/sync-clients')
  syncOneCClients(@CurrentUser() user: AuthUser) {
    return this.integrationsService.syncOneCClients(user.companyId);
  }

  @Post('onec/sync-products')
  syncOneCProducts(@CurrentUser() user: AuthUser) {
    return this.integrationsService.syncOneCProducts(user.companyId);
  }

  @Post('onec/sync-all')
  syncOneCAll(@CurrentUser() user: AuthUser) {
    return this.integrationsService.syncOneCAll(user.companyId);
  }
}
