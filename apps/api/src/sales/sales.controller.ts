import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SalesService } from './sales.service';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('currency') currency?: string,
  ) {
    return this.service.list(user.companyId, { dateFrom, dateTo, currency });
  }

  @Get('summary')
  summary(@CurrentUser() user: AuthUser) {
    return this.service.summary(user.companyId);
  }

  @Get('search')
  search(@CurrentUser() user: AuthUser, @Query('q') q?: string) {
    return this.service.searchProducts(user.companyId, q || '');
  }

  @Post('scan')
  scan(@CurrentUser() user: AuthUser, @Body() body: { code: string }) {
    return this.service.scan(user.companyId, body.code);
  }

  @Post('checkout')
  checkout(@CurrentUser() user: AuthUser, @Body() body: any) {
    return this.service.checkout(user.companyId, user.sub, body);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.getOne(user.companyId, id);
  }
}
